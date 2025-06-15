"use client";

import { Message } from '@/lib/types/chat';
import { User, Quote, Brain, Copy, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ChatGptIcon from './icons/ChatGptIcon';
import ClaudeIcon from './icons/ClaudeIcon';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  colorOverride?: string; // Allow color override for the bubble
}

const roleConfig = {
  user: {
    name: 'You',
    avatar: <User className="w-4 h-4 text-white" />,
    bgColor: 'bg-primary-600',
    textColor: 'text-white',
    containerAlign: 'justify-end',
    bubbleColorOverride: 'bg-primary-500/20',
  },
  claude: {
    name: 'Claude',
    avatar: <ClaudeIcon size={16} color="white" />,
    bgColor: 'bg-claude-500',
    textColor: 'text-white',
    containerAlign: 'justify-start',
    bubbleColorOverride: 'bg-claude-500/20',
  },
  gpt: {
    name: 'GPT-4',
    avatar: <ChatGptIcon size={16} color="white" />,
    bgColor: 'bg-openai-500',
    textColor: 'text-white',
    containerAlign: 'justify-start',
    bubbleColorOverride: 'bg-openai-500/20',
  },
};

export default function MessageBubble({ message, isStreaming = false, colorOverride }: MessageBubbleProps) {
  const config = roleConfig[message.role];


  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    try {
      
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }
      
      // Check if there's actually content to copy
      if (!message.content || message.content.trim() === '') {
        toast.error('No content to copy');
        return;
      }
      
      await navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard!');
    } catch (err) {
      
      // Fallback: try the older execCommand method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = message.content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        
        if (successful) {
          toast.success('Message copied to clipboard!');
        } else {
          throw new Error('Fallback copy method failed');
        }
      } catch (fallbackErr) {
        toast.error('Failed to copy message');
      }
    }
  };

  return (
    <div className={cn('flex gap-3 w-full', config.containerAlign)}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        config.bgColor
      )}>
        {config.avatar}
      </div>

      {/* Message Content - 80% width on mobile, 50% on desktop */}
      <div className="w-4/5 lg:w-1/2 max-w-[600px]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-on-dark">
            {config.name}
          </span>
          <span className="text-xs text-on-dark-muted">
            Round {message.round}
          </span>
        </div>

        {/* Message Bubble with glass-card */}
        <div className={cn(
          'glass-card p-4 text-white relative group',
          message.role === 'user' ? 'bg-white/10' : 'bg-white/5',
          colorOverride || config.bubbleColorOverride
        )}>
          {/* Copy button - faded out, fades in on hover */}
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 opacity-35 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10 rounded p-1 z-20 cursor-pointer active:scale-95"
            title="Copy message"
          >
            <Copy className="w-4 h-4 text-white/70 hover:text-white transition-colors" />
          </button>

          {/* Content - with right padding to avoid overlap with copy button */}
          <div className="relative z-10 pr-10">
            {/* Input Prompt Quote (for AI messages) */}
            {message.inputPrompt && message.role !== 'user' && (
              <div className="mb-3 pb-3">
                <div className="flex items-start gap-2">
                  <Quote className="w-3 h-3 text-white/60 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-white/70 italic">
                    "{message.inputPrompt}"
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            </div>
          </div>
        </div>

        {/* Typing indicator below the message, floated right */}
        {isStreaming && (
          <div className="flex justify-end mt-2">
            <div className="flex items-center gap-2">
              <PenTool className="w-3 h-3 text-white animate-pulse" />
              <span className="text-xs text-white">typing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}