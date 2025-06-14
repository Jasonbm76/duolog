"use client";

import { Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  aiModel: 'claude' | 'gpt';
  round: number;
}

const modelConfig = {
  claude: {
    name: 'Claude',
    icon: Bot,
    bgColor: 'bg-purple-500',
    textColor: 'text-white',
  },
  gpt: {
    name: 'GPT-4',
    icon: Sparkles,
    bgColor: 'bg-green-500',
    textColor: 'text-white',
  },
};

export default function TypingIndicator({ aiModel, round }: TypingIndicatorProps) {
  const config = modelConfig[aiModel];
  const Icon = config.icon;

  return (
    <div className="flex gap-3 max-w-4xl mx-auto justify-start">
      {/* Avatar */}
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.bgColor)}>
        <Icon className={cn('w-4 h-4', config.textColor)} />
      </div>

      {/* Typing Content */}
      <div className="flex flex-col max-w-[80%] items-start">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-600">
            {config.name}
          </span>
          <span className="text-xs text-gray-500">
            Round {round}
          </span>
        </div>

        {/* Typing Bubble */}
        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Animated dots */}
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-600">
              {config.name} is analyzing...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}