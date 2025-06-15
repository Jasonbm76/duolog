"use client";

import { cn } from '@/lib/utils';
import { ProcessingStatus } from '@/lib/types/chat';
import { getStatusText } from '@/lib/mock-data/conversations';
import { Brain, Search, PenTool, CheckCircle, Eye, Sparkles } from 'lucide-react';
import ChatGptIcon from './icons/ChatGptIcon';
import ClaudeIcon from './icons/ClaudeIcon';

interface TypingIndicatorProps {
  aiModel: 'claude' | 'gpt' | 'gpt-4';
  round: number;
  status?: ProcessingStatus;
  colorOverride?: string;
}

const modelConfig = {
  claude: {
    name: 'Claude',
    avatar: <ClaudeIcon size={16} color="white" />,
    bgColor: 'bg-claude-500',
    textColor: 'text-white',
    bubbleColorOverride: 'bg-claude-500/20',
  },
  gpt: {
    name: 'GPT-4',
    avatar: <ChatGptIcon size={16} color="white" />,
    bgColor: 'bg-openai-500',
    textColor: 'text-white',
    bubbleColorOverride: 'bg-openai-500/20',
  },
  'gpt-4': {
    name: 'GPT-4',
    avatar: <ChatGptIcon size={16} color="white" />,
    bgColor: 'bg-openai-500',
    textColor: 'text-white',
    bubbleColorOverride: 'bg-openai-500/20',
  },
};

// Status-specific icons
const getStatusIcon = (status: ProcessingStatus) => {
  switch (status) {
    case 'thinking':
      return <Brain className="w-4 h-4 text-white/80 animate-pulse" />;
    case 'analyzing':
      return <Search className="w-4 h-4 text-white/80 animate-pulse" />;
    case 'generating':
      return <PenTool className="w-4 h-4 text-white/80 animate-pulse" />;
    case 'reviewing':
      return <Eye className="w-4 h-4 text-white/80 animate-pulse" />;
    case 'finalizing':
      return <Sparkles className="w-4 h-4 text-white/80 animate-pulse" />;
    case 'complete':
      return <CheckCircle className="w-4 h-4 text-success-500" />;
    default:
      return <Brain className="w-4 h-4 text-white/80 animate-pulse" />;
  }
};

export default function TypingIndicator({ 
  aiModel, 
  round, 
  status = 'thinking',
  colorOverride,
}: TypingIndicatorProps) {
  const config = modelConfig[aiModel];
  const statusText = getStatusText(aiModel === 'gpt-4' ? 'gpt' : aiModel, status);

  return (
    <div className="flex gap-3 w-full justify-start">
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        config.bgColor
      )}>
        {config.avatar}
      </div>

      {/* Typing Content - 80% width on mobile, 50% on desktop */}
      <div className="w-4/5 lg:w-1/2 max-w-[600px]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-on-dark">
            {config.name}
          </span>
          <span className="text-xs text-on-dark-muted">
            Round {round}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-primary-500 rounded-full animate-pulse" />
            <span className="text-xs text-primary-500">typing...</span>
          </div>
        </div>

        {/* Typing Bubble with glass-card */}
        <div className={cn(
          'glass-card p-4 text-white relative bg-white/5',
          colorOverride || config.bubbleColorOverride
        )}>
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              {/* Status icon on the left */}
              <div className="flex gap-1">
                {getStatusIcon(status)}
              </div>
              
              {/* Status text floated to the right in white */}
              <span className="text-sm text-white font-medium">
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}