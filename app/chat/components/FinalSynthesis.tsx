"use client";

import { Message } from '@/lib/types/chat';
import { Copy, CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

interface FinalSynthesisProps {
  message: Message;
}

export default function FinalSynthesis({ message }: FinalSynthesisProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success('Final answer copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 lg:px-0">
      <div className="glass-card p-4 lg:p-6 bg-gradient-to-r from-primary/10 to-care/10 border-primary/20">
        {/* Header - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/20 flex-shrink-0">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-on-dark">Final Answer</h3>
              <p className="text-xs lg:text-sm text-on-dark-muted hidden sm:block">Synthesized from Claude & GPT-4's collaboration</p>
            </div>
          </div>
          
          {/* Copy button - Full width on mobile */}
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 lg:px-4 rounded-lg transition-all duration-200 w-full sm:w-auto text-sm",
              copied
                ? "bg-success/20 text-success border border-success/30"
                : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
            )}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Answer</span>
              </>
            )}
          </button>
        </div>

        {/* Content - Responsive text sizing */}
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-white">
            {message.content}
          </div>
        </div>

        {/* Footer note - Smaller on mobile */}
        <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-on-dark/10">
          <p className="text-[10px] sm:text-xs text-on-dark-muted">
            💡 This is the agreed-upon answer from both AIs. You can copy it, ask follow-up questions, or start a new conversation.
          </p>
        </div>
      </div>
    </div>
  );
}