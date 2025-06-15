"use client";

import { useState, useEffect } from 'react';
import { Activity, Settings, RotateCcw, Zap, TrendingUp, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ConversationTokens, tokenTracker } from '@/lib/services/token-tracker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DebugResetButton from './DebugResetButton';

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

  // Notify parent when dropdown state changes
  useEffect(() => {
    onDropdownToggle?.(isExpanded);
  }, [isExpanded, onDropdownToggle]);

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
    console.log('🔴 [StatusButton] RESET BUTTON CLICKED - handleResetUsage called!');
    console.log('🔴 [StatusButton] NODE_ENV:', process.env.NODE_ENV);
    console.log('🔴 [StatusButton] Event handler is working!');
    
    try {
      console.log('🔄 Starting reset usage...');
      const response = await fetch('/api/dev/reset-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_counts' }),
      });
      
      const result = await response.json();
      console.log('Reset API response:', result);
      
      if (response.ok) {
        if (result.success) {
          toast.success(result.message || 'Usage counter reset!');
          
          // Add a small delay to ensure database transaction is committed
          console.log('⏳ Waiting for database commit...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Refresh usage status without full page reload
          console.log('🔄 Refreshing usage status...');
          await refreshUsageStatus();
          console.log('✅ Reset workflow completed');
        } else {
          toast.info(result.message || 'Database not configured');
        }
      } else {
        toast.error(result.error || 'Failed to reset usage');
      }
    } catch (error) {
      console.error('Failed to reset usage:', error);
      toast.error('Network error - failed to reset usage');
    }
  };

  const refreshUsageStatus = async () => {
    try {
      console.log('🔄 Refreshing usage status with identifiers...');
      
      // Import fingerprinting utilities (dynamic import for client-side only)
      const { createUserIdentifier } = await import('@/lib/utils/fingerprint');
      const identifiers = createUserIdentifier();
      
      console.log('Generated identifiers:', {
        fingerprint: identifiers.fingerprint,
        persistentId: identifiers.persistentId,
        sessionId
      });
      
      const params = new URLSearchParams({
        sessionId,
        fingerprint: identifiers.fingerprint,
        persistentId: identifiers.persistentId,
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
      
      const apiUrl = `/api/chat/usage?${params}`;
      console.log('Making request to:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('Usage API response:', data);
        console.log('Calling onUsageStatusChange with:', data);
        onUsageStatusChange?.(data);
        console.log('✅ Usage status refresh completed');
      } else {
        console.error('Usage API request failed:', response.status, response.statusText);
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
          <div className="absolute top-full right-0 mt-8 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-background/95 backdrop-blur-xl border border-white/10 shadow-xl z-[110]">
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

                  {/* Reset button - Always show in development or when running locally */}
                  {/* Always show reset button in development with enhanced debugging */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        console.log('🔴 [StatusButton] RESET BUTTON CLICKED!');
                        console.log('🔴 [StatusButton] About to call handleResetUsage...');
                        handleResetUsage();
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/25 text-warning rounded-lg hover:bg-warning/20 transition-all duration-200 text-sm font-medium w-full"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Usage
                    </button>
                    
                    {/* Debug test button */}
                    <button
                      onClick={() => {
                        console.log('🟢 DEBUG: Simple click test worked!');
                        alert('Debug button clicked! Check console for logs.');
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-error/10 border border-error/25 text-error rounded-lg hover:bg-error/20 transition-all duration-200 text-sm font-medium w-full"
                    >
                      🧪 Debug Test Button
                    </button>
                  </div>
                  
                  {/* Debug info */}
                  <div className="text-xs text-warning/70 p-2 bg-warning/5 rounded mt-2">
                    NODE_ENV: {process.env.NODE_ENV || 'undefined'}<br/>
                    Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'server'}<br/>
                    Show Reset: {(process.env.NODE_ENV === 'development' || typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'YES' : 'NO'}
                  </div>
                  
                  {/* Always show debug button for testing */}
                  <div className="mt-3">
                    <DebugResetButton />
                  </div>
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