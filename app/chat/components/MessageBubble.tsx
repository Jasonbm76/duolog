"use client";

import { Message } from '@/lib/types/chat';
import { User, Quote, Brain, Copy, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ChatGptIcon from './icons/ChatGptIcon';
import ClaudeIcon from './icons/ClaudeIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Utility function to format timestamps relative to now
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - timestamp.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  
  if (diffInSeconds < 10) {
    return 'just now';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return timestamp.toLocaleDateString();
  }
};

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

// Custom Code Block Component with Copy Functionality
function CodeBlock({ children, className, ...props }: any) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');

  const handleCodeCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  if (language) {
    return (
      <div className="relative group my-4">
        <div className="flex items-center justify-between bg-neutral-800/50 px-4 py-2 rounded-t-lg border border-white/10">
          <span className="text-xs text-white/70 font-mono">{language}</span>
          <button
            onClick={handleCodeCopy}
            className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
            title="Copy code"
          >
            <Copy className="w-3 h-3 text-white" />
          </button>
        </div>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: '0.5rem',
            borderBottomRightRadius: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: 'none',
          }}
          {...props}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className="bg-white/10 text-white px-2 py-1 rounded text-sm font-mono border border-white/20" {...props}>
      {children}
    </code>
  );
}

// Custom Markdown Renderers for Glass Theme
const markdownComponents = {
  // Headings with glass theme styling
  h1: ({ children }: any) => (
    <h1 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-semibold text-white mb-3 border-b border-white/10 pb-1">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-semibold text-white mb-2">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-sm font-semibold text-white mb-2">{children}</h4>
  ),
  h5: ({ children }: any) => (
    <h5 className="text-sm font-medium text-white mb-2">{children}</h5>
  ),
  h6: ({ children }: any) => (
    <h6 className="text-sm font-medium text-white/90 mb-2">{children}</h6>
  ),
  
  // Paragraphs
  p: ({ children }: any) => (
    <p className="text-white/90 mb-3 leading-relaxed">{children}</p>
  ),
  
  // Lists
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside text-white/90 mb-3 space-y-1 ml-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside text-white/90 mb-3 space-y-1 ml-2">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-white/90">{children}</li>
  ),
  
  // Emphasis
  strong: ({ children }: any) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-white/95">{children}</em>
  ),
  
  // Links
  a: ({ children, href }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),
  
  // Blockquotes
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-white/30 pl-4 my-4 bg-white/5 py-2 rounded-r-lg text-white/80 italic">
      {children}
    </blockquote>
  ),
  
  // Tables
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-white/20 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-white/10">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="bg-white/5">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="border-b border-white/10">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-2 text-left text-white font-semibold border-r border-white/10 last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-2 text-white/90 border-r border-white/10 last:border-r-0">
      {children}
    </td>
  ),
  
  // Code blocks and inline code
  code: CodeBlock,
  pre: ({ children }: any) => (
    <div className="my-4">{children}</div>
  ),
  
  // Horizontal rule
  hr: () => (
    <hr className="border-white/20 my-6" />
  ),
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
            {formatTimestamp(message.timestamp)}
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
            <div className="max-w-none text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
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