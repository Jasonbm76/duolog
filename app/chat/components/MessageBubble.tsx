"use client";

import { Message } from '@/lib/types/chat';
import { Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

const roleConfig = {
  user: {
    name: 'You',
    icon: User,
    bgColor: 'bg-primary',
    textColor: 'text-white',
    bubbleAlign: 'ml-auto',
    containerAlign: 'justify-end',
    bubbleColor: 'bg-primary text-white',
  },
  claude: {
    name: 'Claude',
    icon: Bot,
    bgColor: 'bg-purple-500',
    textColor: 'text-white',
    bubbleAlign: 'mr-auto',
    containerAlign: 'justify-start',
    bubbleColor: 'bg-gray-100 text-gray-900 border border-gray-200',
  },
  gpt: {
    name: 'GPT-4',
    icon: Sparkles,
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    bubbleAlign: 'mr-auto',
    containerAlign: 'justify-start',
    bubbleColor: 'bg-gray-100 text-gray-900 border border-gray-200',
  },
};

export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const config = roleConfig[message.role];
  const Icon = config.icon;

  return (
    <div className={cn('flex gap-3 max-w-4xl mx-auto', config.containerAlign)}>
      {/* Avatar - show for AI messages on left, user on right */}
      {message.role !== 'user' && (
        <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.bgColor)}>
          <Icon className={cn('w-4 h-4', config.textColor)} />
        </div>
      )}

      {/* Message Content */}
      <div className={cn('flex flex-col max-w-[80%]', message.role === 'user' ? 'items-end' : 'items-start')}>
        {/* Message Header */}
        <div className="flex items-center gap-2 mb-1">
          {message.role !== 'user' && (
            <span className="text-xs font-medium text-gray-600">
              {config.name}
            </span>
          )}
          <span className="text-xs text-gray-500">
            Round {message.round}
          </span>
          <span className="text-xs text-gray-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message Bubble */}
        <div className={cn(
          'px-4 py-3 rounded-2xl shadow-sm',
          config.bubbleColor,
          message.role === 'user' 
            ? 'rounded-br-md' 
            : 'rounded-bl-md'
        )}>
          <div className="prose prose-sm max-w-none">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1" />
            )}
          </div>
        </div>

        {/* Streaming indicator */}
        {isStreaming && message.role !== 'user' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      {/* User Avatar on right */}
      {message.role === 'user' && (
        <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.bgColor)}>
          <Icon className={cn('w-4 h-4', config.textColor)} />
        </div>
      )}
    </div>
  );
}