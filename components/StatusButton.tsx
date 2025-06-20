"use client";

import { useState, useEffect, useRef } from 'react';
import { Activity, Settings, RotateCcw, Zap, TrendingUp, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ConversationTokens, tokenTracker } from '@/lib/services/token-tracker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UsageStatus {
  used: number;
  limit: number;
  hasOwnKeys: boolean;
}

interface StatusButtonProps {
  conversationId?: string;
  isMockMode: boolean;
  usageStatus: UsageStatus | null;
  sessionId: string;
  onSettingsClick: () => void;
  onDropdownToggle?: (isOpen: boolean) => void;
  onUsageStatusChange?: (newStatus: UsageStatus | null) => void;
}

export default function StatusButton({ 
  conversationId, 
  isMockMode, 
  usageStatus, 
  sessionId,
  onSettingsClick,
  onDropdownToggle,
  onUsageStatusChange
}: StatusButtonProps) {
  const [tokens, setTokens] = useState<ConversationTokens | null>(null);
  const [sessionTotal, setSessionTotal] = useState({ tokens: 0, cost: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notify parent when dropdown state changes
  useEffect(() => {
    onDropdownToggle?.(isExpanded);
  }, [isExpanded, onDropdownToggle]);

  // Handle outside clicks and escape key
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isExpanded]);

  // Update token tracking
  useEffect(() => {
    const updateTokens = () => {
      if (conversationId && !isMockMode) {
        const conversation = tokenTracker.getConversation(conversationId);
        setTokens(conversation);
      }
      setSessionTotal(tokenTracker.getSessionTotal());
    };

    updateTokens();
    const interval = setInterval(updateTokens, 1000);
    return () => clearInterval(interval);
  }, [conversationId, isMockMode]);

  const handleResetUsage = async () => {
    if (isResetting) return;
    
    try {
      setIsResetting(true);
      
      // Get user email from localStorage (safe for SSR)
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;
      console.log('Reset Usage - Email from localStorage:', userEmail);
      
      if (!userEmail) {
        console.log('No email found in localStorage. Available keys:', typeof window !== 'undefined' ? Object.keys(localStorage) : []);
        toast.error('No email found - please restart your session');
        return;
      }

      console.log('Sending reset request for email:', userEmail);
      const response = await fetch('/api/dev/reset-email-usage', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({ 
          action: 'reset_counts',
          email: userEmail
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.success) {
          toast.success(result.message || 'Usage counter reset!');
          
          // Add a small delay to ensure database transaction is committed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Refresh usage status without full page reload
          await refreshUsageStatus();
        } else {
          toast.info(result.message || 'Database not configured');
        }
      } else {
        toast.error(result.error || 'Failed to reset usage');
      }
    } catch (error) {
      console.error('Failed to reset usage:', error);
      toast.error('Network error - failed to reset usage');
    } finally {
      setIsResetting(false);
    }
  };

  const refreshUsageStatus = async () => {
    try {
      // Get user email from localStorage (safe for SSR)
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;
      console.log('Refresh Usage - Email from localStorage:', userEmail);
      
      if (!userEmail) {
        console.log('No email found for refresh - user needs to provide email');
        return;
      }

      // Import fingerprinting utilities (dynamic import for client-side only)
      const { createUserIdentifier } = await import('@/lib/utils/fingerprint');
      const identifiers = createUserIdentifier();
      
      const params = new URLSearchParams({
        email: userEmail,
        sessionId,
        fingerprint: identifiers.fingerprint,
      });

      // Check for user keys in localStorage and include them
      try {
        const { SecureStorage } = await import('@/lib/utils/encryption');
        const stored = await SecureStorage.getItem('duolog-api-keys');
        if (stored) {
          const userKeys = JSON.parse(stored);
          if (userKeys.openai || userKeys.anthropic) {
            params.append('userKeys', JSON.stringify(userKeys));
          }
        }
      } catch (error) {
        console.error('Failed to load user keys for refresh:', error);
      }
      
      const response = await fetch(`/api/chat/email-usage?${params}`);
      if (response.ok) {
        const data = await response.json();
        onUsageStatusChange?.(data);
      }
    } catch (error) {
      console.error('Failed to refresh usage status:', error);
    }
  };

  // Always show the status bar - it provides access to settings even when no data is loaded yet
  // Only hide in mock mode when there's no usage status and no token data
  const shouldShow = !isMockMode || usageStatus || (tokens || sessionTotal.tokens > 0);
  
  if (!shouldShow) return null;

  const currentTokens = tokens?.totalTokens || 0;
  const currentCost = tokens?.totalCost || 0;
  const hasTokenData = !isMockMode && (tokens || sessionTotal.tokens > 0);

  return (
    <div className="relative">
      {/* Compact status button - styled like nav items */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "nav-item group flex items-center gap-2",
          isExpanded && "nav-item-active"
        )}
      >
        <Activity className="w-4 h-4 transition-colors group-hover:text-primary" />
        <span>Status</span>
        
        {/* Usage indicator */}
        {!isMockMode && usageStatus && (
          <span className="tabular-nums text-xs text-on-dark">
            {usageStatus.used}/{usageStatus.limit}
          </span>
        )}
        
        {/* Cost indicator */}
        {hasTokenData && sessionTotal.cost > 0 && (
          <span className="tabular-nums text-xs text-primary">
            ${(sessionTotal.cost / 100).toFixed(2)}
          </span>
        )}
        
        {/* Dropdown arrow */}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 text-on-dark/60 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded dropdown */}
      {isExpanded && (
        <>
          {/* Dropdown panel */}
          <div 
            ref={dropdownRef}
            className="absolute top-full right-0 mt-8 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-background/95 backdrop-blur-xl border border-white/10 shadow-xl z-[110]"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-on-dark flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Status Dashboard
                </h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-on-dark-muted hover:text-on-dark transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Usage Section */}
              {usageStatus && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <h4 className="text-sm font-medium text-on-dark mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Usage Limit
                  </h4>
                  
                  {/* Enhanced usage pill */}
                  <div className="mb-3">
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex items-center bg-on-dark/8 rounded-xl p-1">
                        {Array.from({ length: usageStatus.limit }, (_, i) => (
                          <div key={i} className="relative">
                            <div
                              className={cn(
                                "w-6 h-3 transition-all duration-500 ease-out",
                                i === 0 && "rounded-l-lg",
                                i === usageStatus.limit - 1 && "rounded-r-lg",
                                i < (usageStatus.used ?? 0)
                                  ? (usageStatus.used ?? 0) >= usageStatus.limit
                                    ? "bg-error shadow-md"
                                    : (usageStatus.used ?? 0) >= usageStatus.limit * 0.8
                                      ? "bg-warning shadow-md"
                                      : "bg-primary shadow-md"
                                  : "bg-white shadow-sm"
                              )}
                            >
                              {i < (usageStatus.used ?? 0) && (
                                <div className={cn(
                                  "absolute inset-0 opacity-40",
                                  i === 0 && "rounded-l-lg",
                                  i === usageStatus.limit - 1 && "rounded-r-lg",
                                  (usageStatus.used ?? 0) >= usageStatus.limit
                                    ? "bg-gradient-to-t from-error/30 to-error/60"
                                    : (usageStatus.used ?? 0) >= usageStatus.limit * 0.8
                                      ? "bg-gradient-to-t from-warning/30 to-warning/60"
                                      : "bg-gradient-to-t from-primary/30 to-primary/60"
                                )} />
                              )}
                            </div>
                            {i < usageStatus.limit - 1 && (
                              <div className="absolute top-0 right-0 w-px h-3 bg-on-dark/15" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="font-mono text-sm text-on-dark">
                        {usageStatus.used ?? 0} / {usageStatus.limit} conversations used
                      </span>
                    </div>
                  </div>

                  {/* Reset button */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={handleResetUsage}
                      disabled={isResetting}
                      className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/25 text-warning rounded-lg hover:bg-warning/20 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                      {isResetting ? 'Resetting...' : 'Reset Usage'}
                    </button>
                  )}
                </div>
              )}

              {/* Token Usage Section */}
              {hasTokenData && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <h4 className="text-sm font-medium text-on-dark mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Token Usage
                  </h4>

                  {/* Current conversation */}
                  {tokens && (
                    <div className="mb-3 p-2 bg-on-dark/5 rounded-md">
                      <div className="text-xs text-on-dark-muted mb-2">Current Conversation</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-on-dark-muted">Input</div>
                          <div className="font-mono text-on-dark">
                            {tokenTracker.formatTokens(tokens.totalInputTokens)}
                          </div>
                        </div>
                        <div>
                          <div className="text-on-dark-muted">Output</div>
                          <div className="font-mono text-on-dark">
                            {tokenTracker.formatTokens(tokens.totalOutputTokens)}
                          </div>
                        </div>
                        <div>
                          <div className="text-on-dark-muted">Total</div>
                          <div className="font-mono text-on-dark">
                            {tokenTracker.formatTokens(tokens.totalTokens)}
                          </div>
                        </div>
                        <div>
                          <div className="text-on-dark-muted">Cost</div>
                          <div className="font-mono text-primary font-medium">
                            ${(tokens.totalCost / 100).toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Session total */}
                  {sessionTotal.tokens > 0 && (
                    <div className="p-2 bg-warning/5 border border-warning/10 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-on-dark flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-warning" />
                          Session Total
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-mono text-on-dark">
                            {tokenTracker.formatTokens(sessionTotal.tokens)}
                          </div>
                          <div className="text-xs font-mono text-warning font-medium">
                            ${(sessionTotal.cost / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* System Info */}
              <div className="mb-4 p-3 bg-on-dark/5 border border-on-dark/10 rounded-lg">
                <h4 className="text-sm font-medium text-on-dark mb-2">System Status</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-dark-muted">Mode</span>
                    <span className="text-on-dark font-mono">
                      {isMockMode ? 'Mock Responses' : 'Live APIs'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-dark-muted">API Keys</span>
                    <span className={cn(
                      "font-mono",
                      usageStatus?.hasOwnKeys ? "text-success" : "text-warning"
                    )}>
                      {usageStatus?.hasOwnKeys ? 'Configured' : 'Using Demo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-dark-muted">Session</span>
                    <span className="text-on-dark font-mono">
                      {sessionId.slice(-8)}
                    </span>
                  </div>
                  {tokens && (
                    <div className="flex justify-between">
                      <span className="text-on-dark-muted">Conversation</span>
                      <span className="text-on-dark font-mono">
                        {conversationId?.slice(-8) || 'None'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onSettingsClick();
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                  usageStatus?.hasOwnKeys
                    ? "bg-success/10 border border-success/20 text-success hover:bg-success/15"
                    : "bg-on-dark/5 border border-on-dark/10 text-on-dark-muted hover:bg-on-dark/10 hover:text-on-dark"
                )}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {usageStatus?.hasOwnKeys ? "API Settings" : "Settings"}
                </span>
              </button>

              {/* Usage tip */}
              {sessionTotal.cost > 50 && !usageStatus?.hasOwnKeys && (
                <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded text-xs text-primary">
                  💡 Add your own API keys for unlimited access and lower costs
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 