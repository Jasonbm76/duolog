"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PromptInput({ 
  onSubmit, 
  isLoading = false, 
  placeholder = "Enter your prompt...",
  disabled = false,
  className 
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading && !disabled) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow shift+enter for new lines
        return;
      } else {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const canSubmit = prompt.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className={cn("flex-shrink-0", className?.includes('m-0') ? "" : "glass-card p-4 mt-6", className)}>
      <div className="flex gap-3 items-end">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "w-full resize-none border border-on-dark/20 rounded-xl px-4 py-3",
              "text-on-dark placeholder-on-dark bg-neutral-900/50 backdrop-blur-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
              "min-h-[80px] max-h-48 leading-6",
              "disabled:bg-on-dark/5 disabled:text-on-dark disabled:cursor-not-allowed",
              "transition-colors scrollbar-hide overflow-hidden"
            )}
            rows={2}
          />
          
          {/* Character count for longer prompts */}
          {prompt.length > 100 && (
            <div className="absolute -top-6 right-0 text-xs text-on-dark">
              {prompt.length} characters
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "px-4 py-3 h-12 min-w-[48px]",
            "bg-primary hover:bg-primary/90 disabled:bg-on-dark/20",
            "transition-all duration-200"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="flex justify-between items-center mt-2 text-xs text-on-dark">
        <span>
          {disabled 
            ? "Conversation is complete"
            : isLoading 
              ? "AI is processing..." 
              : "Press Enter to send, Shift+Enter for new line"
          }
        </span>
        
        {canSubmit && (
          <span className="text-primary font-medium">
            Ready to send
          </span>
        )}
      </div>
    </div>
  );
}