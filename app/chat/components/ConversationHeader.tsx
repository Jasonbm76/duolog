"use client";

import { Conversation } from '@/lib/types/chat';
import { ArrowLeft, RotateCcw, Copy, CheckCircle } from 'lucide-react';
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
      <div className="flex-shrink-0 glass-card p-6 mb-6 mt-8">
        <h1 className="text-2xl font-bold text-on-dark">AI Collaboration Workspace</h1>
        <p className="text-on-dark mt-1">Claude and GPT-4 working together to perfect your prompt</p>
      </div>
    );
  }

  const roundSteps = [1, 2, 3];
  const isComplete = conversation.status === 'completed';

  return (
    <div className="flex-shrink-0 glass-card p-6 mb-6 mt-8">
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

      {/* Round Progress */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-on-dark">Progress:</span>
        <div className="flex items-center gap-2">
          {roundSteps.map((round, index) => (
            <div key={round} className="flex items-center">
              {/* Round Step */}
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors',
                conversation.currentRound > round || isComplete
                  ? 'bg-primary border-primary text-white'
                  : conversation.currentRound === round
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-on-dark/30 text-on-dark bg-transparent'
              )}>
                {conversation.currentRound > round || isComplete ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  round
                )}
              </div>

              {/* Connector Line */}
              {index < roundSteps.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-1 transition-colors',
                  conversation.currentRound > round || isComplete
                    ? 'bg-primary'
                    : 'bg-on-dark/30'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Status Text */}
        <div className="ml-4 text-sm">
          {isComplete ? (
            <span className="text-success font-medium">
              Collaboration Complete!
            </span>
          ) : (
            <span className="text-on-dark">
              Round {conversation.currentRound} of {conversation.totalRounds}
            </span>
          )}
        </div>
      </div>

      {/* Round Description */}
      <div className="mt-3 text-sm text-on-dark">
        {isComplete ? (
          "Your prompt has been refined through collaborative AI analysis."
        ) : conversation.currentRound === 1 ? (
          "Claude and GPT-4 will analyze your prompt and suggest improvements."
        ) : conversation.currentRound === 2 ? (
          "The AIs are building on their previous analysis to refine further."
        ) : (
          "Final round of collaborative refinement in progress."
        )}
      </div>
    </div>
  );
}