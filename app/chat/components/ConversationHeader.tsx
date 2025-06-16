"use client";

import { Conversation } from '@/lib/types/chat';
import { ArrowLeft, RotateCcw, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConversationHeaderProps {
  conversation: Conversation | null;
  onReset: () => void;
  onBack?: () => void;
}

export default function ConversationHeader({ 
  conversation, 
  onReset, 
  onBack 
}: ConversationHeaderProps) {
  if (!conversation) {
    return (
      <div className="glass-card p-6 m-4">
        <h1 className="text-2xl font-bold text-on-dark">AI Collaboration Workspace</h1>
        <p className="text-on-dark mt-1">Claude and GPT-4 working together to perfect your prompt</p>
      </div>
    );
  }

  const isComplete = conversation.status === 'completed';

  return (
    <div className="glass-card p-6 m-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="text-on-dark hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-xl font-bold text-on-dark">
            AI Collaboration
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReset}
            className="text-on-dark hover:text-primary border-on-dark/20 hover:border-primary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Simple Status */}
      {isComplete && (
        <div className="mt-3 text-sm">
          <span className="text-success font-medium">
            ✅ Collaboration Complete!
          </span>
          <p className="text-on-dark mt-1">
            Your prompt has been refined through collaborative AI analysis.
          </p>
        </div>
      )}
    </div>
  );
}