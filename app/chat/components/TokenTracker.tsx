"use client";

import { useState, useEffect } from 'react';
import { Activity, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { ConversationTokens, tokenTracker } from '@/lib/services/token-tracker';
import { cn } from '@/lib/utils';

interface TokenTrackerProps {
  conversationId?: string;
  className?: string;
}

export default function TokenTracker({ conversationId, className }: TokenTrackerProps) {
  const [tokens, setTokens] = useState<ConversationTokens | null>(null);
  const [sessionTotal, setSessionTotal] = useState({ tokens: 0, cost: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateTokens = () => {
      if (conversationId) {
        const conversation = tokenTracker.getConversation(conversationId);
        setTokens(conversation);
      }
      setSessionTotal(tokenTracker.getSessionTotal());
    };

    updateTokens();
    const interval = setInterval(updateTokens, 1000); // Update every second

    return () => clearInterval(interval);
  }, [conversationId]);

  if (!tokens && sessionTotal.tokens === 0) {
    return null; // Don't show until we have some token usage
  }

  const currentCost = tokens?.totalCost || 0;
  const currentTokens = tokens?.totalTokens || 0;

  return (
    <div className={cn("relative", className)}>
      {/* Compact view */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
          "bg-primary/10 border border-primary/20 hover:bg-primary/20",
          "text-primary text-sm font-medium"
        )}
      >
        <Activity className="w-4 h-4" />
        <span className="tabular-nums">
          {tokenTracker.formatTokens(currentTokens)}
        </span>
        <span className="text-primary/70">•</span>
        <span className="tabular-nums">
          {tokenTracker.formatCost(currentCost)}
        </span>
        {sessionTotal.tokens > currentTokens && (
          <>
            <span className="text-primary/70">•</span>
            <span className="text-xs text-primary/70">
              Session: {tokenTracker.formatCost(sessionTotal.cost)}
            </span>
          </>
        )}
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-background/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-on-dark flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Token Usage
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-on-dark-muted hover:text-on-dark"
              >
                ×
              </button>
            </div>

            {/* Current conversation */}
            {tokens && (
              <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                <h4 className="text-sm font-medium text-on-dark mb-2">Current Conversation</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-on-dark-muted">Input Tokens</div>
                    <div className="font-mono text-on-dark">
                      {tokenTracker.formatTokens(tokens.totalInputTokens)}
                    </div>
                  </div>
                  <div>
                    <div className="text-on-dark-muted">Output Tokens</div>
                    <div className="font-mono text-on-dark">
                      {tokenTracker.formatTokens(tokens.totalOutputTokens)}
                    </div>
                  </div>
                  <div>
                    <div className="text-on-dark-muted">Total Tokens</div>
                    <div className="font-mono text-on-dark">
                      {tokenTracker.formatTokens(tokens.totalTokens)}
                    </div>
                  </div>
                  <div>
                    <div className="text-on-dark-muted">Estimated Cost</div>
                    <div className="font-mono text-primary font-medium">
                      {tokenTracker.formatCost(tokens.totalCost)}
                    </div>
                  </div>
                </div>

                {/* Model breakdown */}
                {tokens.modelUsage.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-on-dark/10">
                    <div className="text-xs text-on-dark-muted mb-2">Model Usage</div>
                    <div className="space-y-1">
                      {tokens.modelUsage.map((usage, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-on-dark">{usage.model}</span>
                          <span className="font-mono text-on-dark-muted">
                            {tokenTracker.formatTokens(usage.totalTokens)} • {tokenTracker.formatCost(usage.estimatedCost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Session total */}
            {sessionTotal.tokens > 0 && (
              <div className="p-3 bg-warning/5 rounded-lg">
                <h4 className="text-sm font-medium text-on-dark mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-warning" />
                  Session Total
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-dark">
                    {tokenTracker.formatTokens(sessionTotal.tokens)} tokens
                  </span>
                  <span className="font-mono text-warning font-medium">
                    {tokenTracker.formatCost(sessionTotal.cost)}
                  </span>
                </div>
              </div>
            )}

            {/* Cost warning for high usage */}
            {sessionTotal.cost > 100 && (
              <div className="mt-3 p-2 bg-error/10 border border-error/20 rounded text-xs text-error">
                💡 Consider using your own API keys for unlimited access
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}