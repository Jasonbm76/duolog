"use client";

import { useCallback, useRef } from 'react';
import { ProcessingStatus } from '@/lib/types/chat';
import { getProcessingDelay, processingSequences } from '@/lib/mock-data/conversations';
import { useConversation } from '../context/ConversationContext';

export function useStatusProgression() {
  const { updateProcessingStatus, stopProcessing } = useConversation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProgressingRef = useRef(false);

  const clearProgression = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isProgressingRef.current = false;
  }, []);

  const startStatusProgression = useCallback(
    async (
      aiModel: 'claude' | 'gpt',
      processingStates?: ProcessingStatus[],
      onComplete?: () => void
    ) => {
      // Clear any existing progression
      clearProgression();
      
      // Use provided states or default sequence for the AI model
      const statesToProgress = processingStates || processingSequences[aiModel];
      
      if (!statesToProgress || statesToProgress.length === 0) {
        onComplete?.();
        return;
      }

      isProgressingRef.current = true;
      let currentIndex = 0;

      const progressToNextStatus = () => {
        if (!isProgressingRef.current || currentIndex >= statesToProgress.length) {
          stopProcessing();
          onComplete?.();
          return;
        }

        const currentStatus = statesToProgress[currentIndex];
        updateProcessingStatus(currentStatus);

        // If this is the last status (complete), stop here
        if (currentStatus === 'complete' || currentIndex === statesToProgress.length - 1) {
          isProgressingRef.current = false;
          stopProcessing();
          onComplete?.();
          return;
        }

        // Schedule next status update
        const delay = getProcessingDelay(currentStatus);
        timeoutRef.current = setTimeout(() => {
          currentIndex++;
          progressToNextStatus();
        }, delay);
      };

      // Start the progression
      progressToNextStatus();
    },
    [updateProcessingStatus, stopProcessing, clearProgression]
  );

  const skipToComplete = useCallback(() => {
    clearProgression();
    updateProcessingStatus('complete');
    stopProcessing();
  }, [clearProgression, updateProcessingStatus, stopProcessing]);

  const pauseProgression = useCallback(() => {
    clearProgression();
  }, [clearProgression]);

  const resumeProgressionFrom = useCallback(
    (
      status: ProcessingStatus,
      aiModel: 'claude' | 'gpt',
      onComplete?: () => void
    ) => {
      const statesToProgress = processingSequences[aiModel];
      const startIndex = statesToProgress.indexOf(status);
      
      if (startIndex === -1) {
        onComplete?.();
        return;
      }

      const remainingStates = statesToProgress.slice(startIndex);
      startStatusProgression(aiModel, remainingStates, onComplete);
    },
    [startStatusProgression]
  );

  return {
    startStatusProgression,
    skipToComplete,
    pauseProgression,
    resumeProgressionFrom,
    clearProgression,
  };
} 