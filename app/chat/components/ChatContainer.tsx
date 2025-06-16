"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useConversation } from '../context/ConversationContext';
import { useStatusProgression } from '../hooks/useStatusProgression';
import { realConversationService } from '@/lib/services/real-conversation';
import { mockConversationService } from '@/lib/services/mock-conversation-real-interface';
import { Message } from '@/lib/types/chat';
import { getMockConversationFlow, createMessageFromMockResponse } from '@/lib/mock-data/conversations';
import { Bot, CheckCircle, AlertCircle, Settings, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ConversationHeader from './ConversationHeader';
import PromptInput from './PromptInput';
import SettingsDialog from './SettingsDialog';
import DevModeToggle from './DevModeToggle';
import EmailForm from '@/components/EmailForm';
import UnifiedStatusBar from './UnifiedStatusBar';
import ChatNavigation from './ChatNavigation';
import FinalSynthesis from './FinalSynthesis';
import EmailCaptureModal from './EmailCaptureModal';
import EmailVerificationWaiting from './EmailVerificationWaiting';
import { tokenTracker } from '@/lib/services/token-tracker';
import { cn } from '@/lib/utils';

interface UsageStatus {
  used: number;
  limit: number;
  hasOwnKeys: boolean;
}

export default function ChatContainer() {
  const { state, startConversation, addMessage, continueConversation, resetConversation, dispatch, startProcessing, stopProcessing } = useConversation();
  const { startStatusProgression, clearProgression } = useStatusProgression();
  const [typingAI, setTypingAI] = useState<'claude' | 'gpt-4' | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [activeBreathingRound, setActiveBreathingRound] = useState(0);
  const breathingStepRef = useRef(0);
  const stepCounterRef = useRef(0);
  const isAIActiveRef = useRef(false); // Track if any AI is currently active
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [userKeys, setUserKeys] = useState<{ openai: string; anthropic: string }>({ openai: '', anthropic: '' });
  const [isMockMode, setIsMockMode] = useState(false); // Default to real mode for testing
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const currentInputPrompt = useRef<string | undefined>(undefined);
  const messageIdCounter = useRef(0); // Stable counter for message IDs
  const promptInputRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const isFinalSynthesisRef = useRef(false);
  const lastRoundKeyRef = useRef<string | null>(null);

  // Email-based usage tracking
  const [userEmail, setUserEmail] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [showVerificationWaiting, setShowVerificationWaiting] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Stable message ID generation to avoid hydration issues
  const generateMessageId = (model: string, round: number) => {
    messageIdCounter.current += 1;
    return `msg-${messageIdCounter.current}-${model}-${round}`;
  };

  const isConversationComplete = state.conversation?.status === 'completed';
  const canStartNew = !state.isLoading && !processingRef.current;
  const canContinue = isConversationComplete && !state.isLoading && !processingRef.current;
  const showTypingIndicator = typingAI && state.currentProcessingStatus && !isConversationComplete;

  // Handle scroll detection to determine if user has manually scrolled
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Check if user scrolled up (manual scroll)
    if (scrollTop < lastScrollTop.current && scrollTop < (scrollHeight - clientHeight - 100)) {
      setUserHasScrolled(true);
    }
    
    // Check if user scrolled to bottom (reset auto-scroll)
    if (scrollTop >= (scrollHeight - clientHeight - 50)) {
      setUserHasScrolled(false);
    }
    
    lastScrollTop.current = scrollTop;
  }, []);

  // Auto-scroll to bottom when new messages are added (only if user hasn't manually scrolled)
  useEffect(() => {
    if (!userHasScrolled && messagesEndRef.current && (
      state.conversation?.messages.length || 
      showTypingIndicator ||
      isConversationComplete ||
      state.error
    )) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [
    state.conversation?.messages.length, 
    showTypingIndicator, 
    isConversationComplete,
    state.error,
    state.currentProcessingStatus,
    userHasScrolled
  ]);

  // Generate sessionId after hydration - only when truly needed
  useEffect(() => {
    if (!sessionId) {
      const service = isMockMode ? mockConversationService : realConversationService;
      setSessionId(service.generateSessionId());
    }
    
  }, []); // Remove isMockMode dependency to prevent unnecessary regeneration

  // Load saved keys on component mount
  useEffect(() => {
    if (!sessionId) return;

    const loadSavedKeys = async () => {
      try {
        const { SecureStorage } = await import('@/lib/utils/encryption');
        const stored = await SecureStorage.getItem('duolog-api-keys');
        if (stored) {
          const keys = JSON.parse(stored);
          setUserKeys(keys);
        }
      } catch (error) {
        console.error('Failed to load saved keys:', error);
      }
    };

    loadSavedKeys();
  }, [sessionId]);

  // Check for existing users and restore email on component mount
  useEffect(() => {
    const checkExistingUser = async () => {
      if (typeof window !== 'undefined') {
        // Check if user has existing fingerprint-based usage (migration case)
        const existingFingerprint = localStorage.getItem('user_fingerprint');
        if (existingFingerprint) {
          setIsExistingUser(true);
        }

        // Try to restore saved email from localStorage
        const savedEmail = localStorage.getItem('user_email');
        console.log('Checking saved email from localStorage:', savedEmail);
        if (savedEmail && isValidEmail(savedEmail)) {
          try {
            // Verify the email is still valid and verified on the server
            const { createUserIdentifier } = await import('@/lib/utils/fingerprint');
            const identifiers = createUserIdentifier();
            
            console.log('Validating saved email with server...');
            const response = await fetch('/api/chat/email-usage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: savedEmail,
                fingerprint: identifiers.fingerprint,
                sessionId: sessionId || 'temp'
              })
            });

            if (response.ok) {
              const result = await response.json();
              console.log('Email validation result:', result);
              if (result.emailVerified) {
                // Email is verified, restore it
                setUserEmail(savedEmail);
                console.log('✅ Restored verified email from localStorage:', savedEmail);
              } else {
                // Email exists but not verified, remove from localStorage
                localStorage.removeItem('user_email');
                console.log('❌ Removed unverified email from localStorage');
              }
            } else {
              // API error, remove email from localStorage to be safe
              console.log('❌ API error during email validation, removing from localStorage');
              localStorage.removeItem('user_email');
            }
          } catch (error) {
            console.error('Error validating saved email:', error);
            // Remove email from localStorage if validation fails
            localStorage.removeItem('user_email');
          }
        } else if (savedEmail) {
          console.log('❌ Invalid email format in localStorage, removing:', savedEmail);
          localStorage.removeItem('user_email');
        }
      }
    };

    checkExistingUser();
  }, [sessionId]); // Depend on sessionId so it runs after sessionId is generated

  // Load usage status whenever sessionId, userEmail, or userKeys change
  useEffect(() => {
    // Skip if no email (user hasn't provided one yet)
    if (!userEmail) {
      return;
    }
    
    // If sessionId isn't ready yet, wait for it
    if (!sessionId) {
      return;
    }

    const loadUsageStatus = async () => {
      try {
        // Import fingerprinting utilities (dynamic import for client-side only)
        const { createUserIdentifier } = await import('@/lib/utils/fingerprint');
        const identifiers = createUserIdentifier();
        
        const params = new URLSearchParams({
          email: userEmail,
          sessionId,
          fingerprint: identifiers.fingerprint,
        });

        // Include user keys in the request if available
        if (userKeys.openai || userKeys.anthropic) {
          params.append('userKeys', JSON.stringify(userKeys));
        }
        
        const response = await fetch(`/api/chat/email-usage?${params}`);
        if (response.ok) {
          const data = await response.json();
          setUsageStatus(data);
        }
      } catch (error) {
        console.error('Failed to load email usage status:', error);
        // Even on error, mark as loaded to show something
        setUsageStatus({ used: 0, limit: 5, hasOwnKeys: false });
      }
    };

    loadUsageStatus();
  }, [sessionId, userEmail, userKeys]);

  // Handler for usage status changes (used by reset button)
  const handleUsageStatusChange = (newStatus: UsageStatus | null) => {
    setUsageStatus(newStatus);
  };

  // Handle email submission from modal (when verified)
  const handleEmailSubmit = async (email: string) => {
    try {
      setUserEmail(email);
      // Save verified email to localStorage for future visits
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_email', email);
      }
      setShowEmailCapture(false);
      setShowVerificationWaiting(false);
      
      // If there's a pending prompt, start the conversation
      if (pendingPrompt) {
        // Wait a bit for state to update
        setTimeout(() => {
          handleStartConversation(pendingPrompt);
        }, 100);
        setPendingPrompt('');
      }
      
      toast.success('Email verified! Starting your conversation...');
    } catch (error) {
      console.error('Email submission error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  // Handle when verification is required
  const handleVerificationRequired = (email: string) => {
    setUserEmail(email);
    setShowEmailCapture(false);
    setShowVerificationWaiting(true);
  };

  // Handle verification completion
  const handleVerificationComplete = () => {
    setShowVerificationWaiting(false);
    
    // If there's a pending prompt, start the conversation
    if (pendingPrompt) {
      setTimeout(() => {
        handleStartConversation(pendingPrompt);
      }, 100);
      setPendingPrompt('');
    }
  };

  // Handle resend verification email
  const handleResendVerification = () => {
    // Just show a toast - the EmailVerificationWaiting component handles the API call
    console.log('Resending verification email...');
  };

  const handleStartConversation = async (initialPrompt: string) => {
    if (processingRef.current || !sessionId) return;

    // Check if we have user email - if not, show email capture modal
    if (!userEmail) {
      setShowEmailCapture(true);
      setPendingPrompt(initialPrompt);
      return;
    }

    processingRef.current = true;

    try {
      // Check usage limits before starting conversation
      const { createUserIdentifier } = await import('@/lib/utils/fingerprint');
      const identifiers = createUserIdentifier();
      
      const validationResponse = await fetch('/api/chat/email-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          fingerprint: identifiers.fingerprint,
          sessionId,
          userKeys: (userKeys.openai || userKeys.anthropic) ? userKeys : undefined,
        }),
      });

      if (!validationResponse.ok) {
        const errorData = await validationResponse.json();
        
        if (validationResponse.status === 429) {
          // Usage limit reached
          dispatch({ type: 'SET_ERROR', payload: `Conversation limit reached (${errorData.used}/${errorData.limit}). You've experienced the full DuoLog demo!` });
          processingRef.current = false;
          return;
        }
        
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const validationData = await validationResponse.json();
      
      // Update usage status
      if (validationData.usage) {
        setUsageStatus({
          used: validationData.usage.used,
          limit: validationData.usage.limit,
          hasOwnKeys: Boolean(userKeys.openai || userKeys.anthropic),
        });
      }

      // Start the conversation in state
      startConversation(initialPrompt);
      setCurrentRound(0);
      stepCounterRef.current = 0; // Reset step counter for new conversation
      lastRoundKeyRef.current = null; // Reset round key guard
      setUserHasScrolled(false); // Reset scroll state for new conversation

      // Get the conversation flow to access processing states
      const flow = getMockConversationFlow(initialPrompt);

      // Track current message for streaming updates
      let currentMessageId = '';
      let currentMessageContent = '';

      const service = isMockMode ? mockConversationService : realConversationService;
      await service.startConversation({
        prompt: initialPrompt,
        sessionId,
        email: userEmail,
        fingerprint: identifiers.fingerprint,
        userKeys: (userKeys.openai || userKeys.anthropic) ? userKeys : undefined,
        onRoundStart: (round: number, model: 'claude' | 'gpt-4', inputPrompt?: string) => {
          // Guard against duplicate round starts and stale events after reset
          if (processingRef.current === false) {
            console.warn('Round start received after processing stopped, ignoring:', `${round}-${model}`);
            return;
          }
          
          const roundKey = `${round}-${model}`;
          if (lastRoundKeyRef.current === roundKey) {
            console.warn('Duplicate round start detected, ignoring:', roundKey);
            return;
          }
          lastRoundKeyRef.current = roundKey;
          
          // Increment step counter for each AI response
          stepCounterRef.current = stepCounterRef.current + 1;
          const currentStepNumber = stepCounterRef.current;
          breathingStepRef.current = currentStepNumber;
          isAIActiveRef.current = true; // Mark AI as active
          setCurrentRound(round);
          setActiveBreathingRound(currentStepNumber);
          setTypingAI(model);
          
          // Get processing states for this AI and round
          const roundData = flow.rounds[round - 1];
          const aiModelKey = model === 'claude' ? 'claude' : 'gpt';
          const aiResponse = roundData?.[aiModelKey];
          const processingStates = aiResponse?.processingStates;
          
          // Start processing status progression
          startProcessing(aiModelKey, round, 'thinking');
          startStatusProgression(aiModelKey, processingStates, () => {
            // Status progression complete - message will start streaming
          });
          
          // Reset message tracking for this round
          currentMessageId = generateMessageId(aiModelKey, round);
          currentMessageContent = '';
          
          // Store input prompt for when we create the message
          currentInputPrompt.current = aiResponse?.inputPrompt || inputPrompt;
          
          // Check if this is the final synthesis round
          isFinalSynthesisRef.current = inputPrompt === 'Creating final synthesis';
        },
        onContentChunk: (round: number, model: 'claude' | 'gpt-4', content: string) => {
          // Create message bubble when content first starts streaming
          if (currentMessageContent === '' && content.length > 0) {
            // Clear processing indicators when content starts (but keep breathing animation)
            setTypingAI(null);
            stopProcessing();
            clearProgression();
            
            // Force update activeBreathingRound to current step (fix closure issue)
            setActiveBreathingRound(breathingStepRef.current);
            
            // Start accumulating content
            currentMessageContent = content;
            
            // Create the message bubble now that content is streaming
            const messageData = {
              role: (model === 'claude' ? 'claude' : 'gpt') as 'claude' | 'gpt',
              content: content, // Start with the initial content chunk
              round,
              isStreaming: true,
              ...(currentInputPrompt.current && { inputPrompt: currentInputPrompt.current }),
              ...(isFinalSynthesisRef.current && { isFinalSynthesis: true }),
            };
            
            const newMessage = addMessage(messageData);
            currentMessageId = newMessage.id; // Store the message ID for updates
          } else if (currentMessageId) {
            // Detect if this is cumulative content (mock mode) or incremental (real APIs)
            const isCumulativeContent = content.startsWith(currentMessageContent);
            
            if (isCumulativeContent) {
              // Mock mode: content contains full message so far, just replace
              currentMessageContent = content;
            } else {
              // Real API mode: content is incremental chunk, accumulate
              currentMessageContent += content;
            }
            
            // Update message content
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: { messageId: currentMessageId, content: currentMessageContent },
            });
          }
        },
        onRoundComplete: (round: number, model: 'claude' | 'gpt-4') => {
          // Complete the message by round and role instead of tracking IDs
          const role = model === 'claude' ? 'claude' : 'gpt';
          dispatch({ type: 'COMPLETE_MESSAGE_BY_ROUND', payload: { round, role } });
          
          // Clear all processing indicators AND breathing animation when AI finishes
          setTypingAI(null);
          stopProcessing();
          clearProgression();
          
          // Mark AI as no longer active and clear breathing animation
          isAIActiveRef.current = false;
          setActiveBreathingRound(0);
          
          // Reset message tracking
          currentMessageId = '';
          currentMessageContent = '';
          isFinalSynthesisRef.current = false;
          
          // Small delay before next round
          setTimeout(() => {
            // Only proceed to next round if conversation is still active
            if (round < 6 && state.conversation?.status === 'active') {
              dispatch({ type: 'NEXT_ROUND' });
            }
          }, 1000);
        },
        onConversationComplete: () => {
          dispatch({ type: 'COMPLETE_CONVERSATION' });
          setTypingAI(null);
          setCurrentRound(0);
          setActiveBreathingRound(0);
          processingRef.current = false;
          
          // Ensure loading state is cleared (safety dispatch)
          dispatch({ type: 'SET_LOADING', payload: false });
          
          // Update usage status
          if (usageStatus) {
            setUsageStatus({
              ...usageStatus,
              used: usageStatus.used + 1,
            });
          }
        },
        onError: (error: string) => {
          dispatch({ type: 'SET_ERROR', payload: error });
          setTypingAI(null);
          processingRef.current = false;
          clearProgression();
        },
        onTokenUpdate: (conversationId: string, tokens: { inputTokens: number; outputTokens: number; model: 'gpt-4' | 'claude-3-sonnet' | 'claude-3-haiku' }) => {
          // Start tracking if not already started
          if (!tokenTracker.getConversation(conversationId)) {
            tokenTracker.startConversation(conversationId);
          }
          
          // Add the token usage
          tokenTracker.addTokenUsage(
            conversationId,
            tokens.model,
            tokens.inputTokens,
            tokens.outputTokens
          );
        },
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start conversation' });
      processingRef.current = false;
      clearProgression();
    }
  };

  const handleReset = () => {
    // Stop any ongoing processes first
    const service = isMockMode ? mockConversationService : realConversationService;
    service.stop();
    
    resetConversation();
    setTypingAI(null);
    setCurrentRound(0);
    setActiveBreathingRound(0);
    stepCounterRef.current = 0; // Reset step counter
    lastRoundKeyRef.current = null; // Reset round key guard
    isAIActiveRef.current = false; // Reset AI active state
    processingRef.current = false;
    clearProgression();
    
    // Generate new session ID to prevent state carryover
    const newSessionId = service.generateSessionId();
    setSessionId(newSessionId);
  };

  const handleScrollToInput = () => {
    if (promptInputRef.current) {
      promptInputRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus the input after scrolling
      setTimeout(() => {
        const textarea = promptInputRef.current?.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }, 500); // Delay to allow scroll animation to complete
    }
  };

  const handleStop = () => {
    // Stop the current conversation processing
    processingRef.current = false;
    setTypingAI(null);
    setActiveBreathingRound(0); // Clear breathing animation
    isAIActiveRef.current = false; // Reset AI active state
    clearProgression();
    
    // Stop the service (this will abort any ongoing delays/processing)
    const service = isMockMode ? mockConversationService : realConversationService;
    service.stop();
    
    // Set loading to false and clear processing status
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'STOP_PROCESSING' });
    
    // If there's a conversation in progress, mark it as completed
    if (state.conversation && state.conversation.status === 'active') {
      dispatch({ type: 'COMPLETE_CONVERSATION' });
    }
    
    // Show toast notification
    toast.info('Conversation stopped');
  };

  const handleContinueConversation = async (followUpPrompt: string) => {
    if (processingRef.current || !sessionId) return;
    processingRef.current = true;

    try {
      // Continue the conversation in state
      continueConversation(followUpPrompt);
      setCurrentRound(0);
      stepCounterRef.current = 0; // Reset step counter for new conversation flow
      lastRoundKeyRef.current = null; // Reset round key guard

      // Get the conversation flow to access processing states
      const flow = getMockConversationFlow(followUpPrompt);

      // Track current message for streaming updates
      let currentMessageId = '';
      let currentMessageContent = '';

      const service = isMockMode ? mockConversationService : realConversationService;
      await service.continueConversation({
        prompt: followUpPrompt,
        sessionId,
        userKeys: (userKeys.openai || userKeys.anthropic) ? userKeys : undefined,
        onRoundStart: (round: number, model: 'claude' | 'gpt-4', inputPrompt?: string) => {
          // Guard against duplicate round starts and stale events after reset
          if (processingRef.current === false) {
            console.warn('Round start received after processing stopped, ignoring:', `${round}-${model}`);
            return;
          }
          
          const roundKey = `${round}-${model}`;
          if (lastRoundKeyRef.current === roundKey) {
            console.warn('Duplicate round start detected, ignoring:', roundKey);
            return;
          }
          lastRoundKeyRef.current = roundKey;
          
          // Increment step counter for each AI response
          stepCounterRef.current = stepCounterRef.current + 1;
          const currentStepNumber = stepCounterRef.current;
          breathingStepRef.current = currentStepNumber;
          isAIActiveRef.current = true; // Mark AI as active
          setCurrentRound(round);
          setActiveBreathingRound(currentStepNumber);
          setTypingAI(model);
          
          // Get processing states for this AI and round
          const roundData = flow.rounds[round - 1];
          const aiModelKey = model === 'claude' ? 'claude' : 'gpt';
          const aiResponse = roundData?.[aiModelKey];
          const processingStates = aiResponse?.processingStates;
          
          // Start processing status progression
          startProcessing(aiModelKey, round, 'thinking');
          startStatusProgression(aiModelKey, processingStates, () => {
            // Status progression complete - message will start streaming
          });
          
          // Reset message tracking for this round
          currentMessageId = generateMessageId(aiModelKey, round);
          currentMessageContent = '';
          
          // Store input prompt for when we create the message
          currentInputPrompt.current = aiResponse?.inputPrompt || inputPrompt;
          
          // Check if this is the final synthesis round
          isFinalSynthesisRef.current = inputPrompt === 'Creating final synthesis';
        },
        onContentChunk: (round: number, model: 'claude' | 'gpt-4', content: string) => {
          // Create message bubble when content first starts streaming
          if (currentMessageContent === '' && content.length > 0) {
            // Clear processing indicators when content starts (but keep breathing animation)
            setTypingAI(null);
            stopProcessing();
            clearProgression();
            
            // Force update activeBreathingRound to current step (fix closure issue)
            setActiveBreathingRound(breathingStepRef.current);
            
            // Start accumulating content
            currentMessageContent = content;
            
            // Create the message bubble now that content is streaming
            const messageData = {
              role: (model === 'claude' ? 'claude' : 'gpt') as 'claude' | 'gpt',
              content: content, // Start with the initial content chunk
              round,
              isStreaming: true,
              ...(currentInputPrompt.current && { inputPrompt: currentInputPrompt.current }),
              ...(isFinalSynthesisRef.current && { isFinalSynthesis: true }),
            };
            
            const newMessage = addMessage(messageData);
            currentMessageId = newMessage.id; // Store the message ID for updates
          } else if (currentMessageId) {
            // Detect if this is cumulative content (mock mode) or incremental (real APIs)
            const isCumulativeContent = content.startsWith(currentMessageContent);
            
            if (isCumulativeContent) {
              // Mock mode: content contains full message so far, just replace
              currentMessageContent = content;
            } else {
              // Real API mode: content is incremental chunk, accumulate
              currentMessageContent += content;
            }
            
            // Update message content
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: { messageId: currentMessageId, content: currentMessageContent },
            });
          }
        },
        onRoundComplete: (round: number, model: 'claude' | 'gpt-4') => {
          // Complete the message by round and role instead of tracking IDs
          const role = model === 'claude' ? 'claude' : 'gpt';
          dispatch({ type: 'COMPLETE_MESSAGE_BY_ROUND', payload: { round, role } });
          
          // Clear all processing indicators AND breathing animation when AI finishes
          setTypingAI(null);
          stopProcessing();
          clearProgression();
          
          // Mark AI as no longer active and clear breathing animation
          isAIActiveRef.current = false;
          setActiveBreathingRound(0);
          
          // Reset message tracking
          currentMessageId = '';
          currentMessageContent = '';
          isFinalSynthesisRef.current = false;
          
          // Small delay before next round
          setTimeout(() => {
            // Only proceed to next round if conversation is still active
            if (round < 6 && state.conversation?.status === 'active') {
              dispatch({ type: 'NEXT_ROUND' });
            }
          }, 1000);
        },
        onConversationComplete: () => {
          dispatch({ type: 'COMPLETE_CONVERSATION' });
          setTypingAI(null);
          setCurrentRound(0);
          setActiveBreathingRound(0);
          processingRef.current = false;
          
          // Ensure loading state is cleared (safety dispatch)
          dispatch({ type: 'SET_LOADING', payload: false });
          
          // Update usage status
          if (usageStatus) {
            setUsageStatus({
              ...usageStatus,
              used: usageStatus.used + 1,
            });
          }
        },
        onError: (error: string) => {
          dispatch({ type: 'SET_ERROR', payload: error });
          setTypingAI(null);
          processingRef.current = false;
          clearProgression();
        },
        onTokenUpdate: (conversationId: string, tokens: { inputTokens: number; outputTokens: number; model: 'gpt-4' | 'claude-3-sonnet' | 'claude-3-haiku' }) => {
          // Start tracking if not already started
          if (!tokenTracker.getConversation(conversationId)) {
            tokenTracker.startConversation(conversationId);
          }
          
          // Add the token usage
          tokenTracker.addTokenUsage(
            conversationId,
            tokens.model,
            tokens.inputTokens,
            tokens.outputTokens
          );
        },
      });
    } catch (error) {
      console.error('Error continuing conversation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to continue conversation' });
      processingRef.current = false;
      clearProgression();
    }
  };

  return (
    <>
      {/* Chat Navigation with integrated status button */}
      <ChatNavigation
        conversationId={state.conversation?.id}
        isMockMode={isMockMode}
        usageStatus={usageStatus}
        sessionId={sessionId}
        onSettingsClick={() => setShowSettings(true)}
        onStatusDropdownToggle={setIsStatusDropdownOpen}
        onUsageStatusChange={handleUsageStatusChange}
      />
      
      {/* Mobile Settings Button - Responsive positioning */}
      <div className="fixed top-[37px] right-[130px] sm:top-[37px] sm:right-[145px] md:right-[155px] z-[60] lg:hidden block">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-on-dark" />
        </button>
      </div>

      {/* Mobile Status Bar - Responsive positioning */}
      <div className="fixed top-[37px] right-[81px] sm:top-[37px] sm:right-[96px] md:right-[100px] z-[60] lg:hidden block">
        <UnifiedStatusBar
          conversationId={state.conversation?.id}
          isMockMode={isMockMode}
          usageStatus={usageStatus}
          sessionId={sessionId}
          onSettingsClick={() => setShowSettings(true)}
          onUsageStatusChange={handleUsageStatusChange}
        />
      </div>

      {/* Main Chat Container */}
      <div className={`flex flex-col h-screen transition-opacity duration-200 ${isStatusDropdownOpen ? 'opacity-20' : 'opacity-100'}`}>
        {/* Fixed Header Space - increased to account for nav header + buffer */}
        <div className="h-[120px] flex-shrink-0" />
        
        {/* Chat Messages Area - constrained scrolling */}
        <div className="flex-1 overflow-hidden relative">
          
          <div className="container mx-auto max-w-8xl h-full lg:px-6 px-3">
            <div className="h-full flex flex-col">
              
              {/* Messages Container with internal scrolling */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto scrollbar-hide lg:py-6 py-3"
                onScroll={handleScroll}
              >
                <div className="lg:space-y-6 space-y-4">
                  
                  {/* Thank you message when out of usage */}
                  {!state.conversation && !state.error && (usageStatus && usageStatus.used >= usageStatus.limit && !usageStatus.hasOwnKeys) && (
                    <div className="text-center py-8">
                      <div className="glass-card p-8 max-w-md mx-auto">
                        {/* Usage Limit Reached */}
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-warning/20 rounded-full mb-4">
                          <CheckCircle className="w-6 h-6 text-warning" />
                        </div>
                        <h3 className="text-lg font-semibold text-on-dark mb-2">
                          Thank you for testing DuoLog!
                        </h3>
                        <p className="text-on-dark mb-4">
                          You've successfully experienced {usageStatus.limit} AI collaboration conversations. We hope you enjoyed seeing Claude and GPT-4 work together to refine your prompts!
                        </p>
                        <div className="text-sm text-on-dark-muted mb-4 p-3 bg-on-dark/5 rounded-lg">
                          <p className="font-medium mb-1">What's next?</p>
                          <p>Join our early access waitlist to get notified when we launch with unlimited conversations and premium features.</p>
                        </div>
                        
                        {/* Email signup form */}
                        <div className="mb-4">
                          <EmailForm />
                        </div>
                        
                        {/* OR divider and API keys option (dev only) */}
                        {process.env.NODE_ENV === 'development' && (
                          <>
                            <div className="flex items-center mb-4">
                              <div className="flex-1 border-t border-on-dark/20"></div>
                              <span className="px-3 text-xs text-on-dark-muted">OR</span>
                              <div className="flex-1 border-t border-on-dark/20"></div>
                            </div>
                            <button
                              onClick={() => setShowSettings(true)}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              Add your own API keys for unlimited access
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Welcome State - hide if user is out of usage */}
                  {!state.conversation && !state.error && !(usageStatus && usageStatus.used >= usageStatus.limit && !usageStatus.hasOwnKeys) && (
                    <div className="text-center py-16">
                      <div className="glass-card p-8 max-w-2xl mx-auto">
                        {/* Animated Brains */}
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6 relative">
                          <div className="relative w-8 h-8">
                            {/* First brain - ChatGPT */}
                            <motion.div
                              className="absolute"
                              animate={{
                                rotateY: [0, 360],
                                x: [0, 6, 0, -6, 0],
                                z: [0, 3, 0, -3, 0],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              style={{
                                transformStyle: "preserve-3d",
                              }}
                            >
                              <Brain className="w-8 h-8 text-primary drop-shadow-lg" />
                            </motion.div>
                            
                            {/* Second brain - Claude */}
                            <motion.div
                              className="absolute"
                              animate={{
                                rotateY: [180, 540],
                                x: [0, -6, 0, 6, 0],
                                z: [0, -3, 0, 3, 0],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 2, // Offset by half the duration
                              }}
                              style={{
                                transformStyle: "preserve-3d",
                              }}
                            >
                              <Brain className="w-8 h-8 text-care drop-shadow-lg" />
                            </motion.div>
                          </div>
                        </div>
                        
                        <h2 className="lg:text-2xl text-xl font-bold text-on-dark mb-3">
                          Welcome to DuoLog
                        </h2>
                        <p className="text-on-dark max-w-md mx-auto mb-6 lg:text-base text-sm">
                          Start a conversation and watch Claude and GPT-4 collaborate to refine your prompt across 3 rounds of analysis.
                        </p>
                        
                        {/* Example Prompts */}
                        <div className="grid gap-3 mb-6">
                          <h3 className="lg:text-sm text-xs font-medium text-on-dark mb-2">Try these examples:</h3>
                          <div className="grid gap-2 lg:text-sm text-xs">
                            <button 
                              onClick={() => handleStartConversation("I want to start a vibe coding website but have no idea how to start it")}
                              className="lg:p-3 p-2 text-left border border-on-dark/20 rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-on-dark flex items-center lg:gap-3 gap-2"
                              disabled={!canStartNew}
                            >
                              <span className="lg:text-lg text-base">💻</span>
                              <span>I want to start a vibe coding website but have no idea how to start it</span>
                            </button>
                            <button 
                              onClick={() => handleStartConversation("I have an exam on the American Civil War tomorrow. What are the key events, causes, and outcomes I should focus on studying?")}
                              className="lg:p-3 p-2 text-left border border-on-dark/20 rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-on-dark flex items-center lg:gap-3 gap-2"
                              disabled={!canStartNew}
                            >
                              <span className="lg:text-lg text-base">📚</span>
                              <span>Help me study for my Civil War history exam</span>
                            </button>
                            <button 
                              onClick={() => handleStartConversation("How do I make the perfect homemade pizza dough? I want it crispy on the outside but chewy inside.")}
                              className="lg:p-3 p-2 text-left border border-on-dark/20 rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-on-dark flex items-center lg:gap-3 gap-2"
                              disabled={!canStartNew}
                            >
                              <span className="lg:text-lg text-base">🍕</span>
                              <span>Teach me how to make perfect pizza dough</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* OR divider */}
                        <div className="flex items-center mb-4">
                          <div className="flex-1 border-t border-on-dark/20"></div>
                          <span className="px-3 text-xs text-on-dark-muted">OR</span>
                          <div className="flex-1 border-t border-on-dark/20"></div>
                        </div>
                        
                        <button
                          onClick={handleScrollToInput}
                          className="px-6 py-3 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all duration-200 font-medium"
                        >
                          Enter your own prompt below
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Conversation Messages */}
                  {state.conversation?.messages.map((message) => (
                    message.isFinalSynthesis ? (
                      <FinalSynthesis 
                        key={message.id} 
                        message={message}
                      />
                    ) : (
                      <MessageBubble 
                        key={message.id} 
                        message={message} 
                        isStreaming={message.isStreaming}
                      />
                    )
                  ))}

                  {/* Typing Indicator */}
                  {showTypingIndicator && (
                    <TypingIndicator 
                      aiModel={typingAI!} 
                      round={currentRound}
                      status={state.currentProcessingStatus}
                    />
                  )}

                  {/* Completion Message */}
                  {isConversationComplete && !state.error && (
                    <div className="text-center py-8">
                      <div className="glass-card p-8 max-w-md mx-auto">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-success/20 rounded-full mb-4">
                          <CheckCircle className="w-6 h-6 text-success" />
                        </div>
                        <h3 className="text-lg font-semibold text-on-dark mb-2">
                          Collaboration Complete!
                        </h3>
                        <p className="text-on-dark mb-6">
                          Claude and GPT-4 have worked together to refine your prompt. What would you like to do next?
                        </p>
                        
                        <div className="space-y-3">
                          <div className="text-sm text-on-dark-muted p-3 bg-on-dark/5 rounded-lg">
                            <p className="font-medium mb-1">💬 Continue this conversation</p>
                            <p>Type a follow-up message below to continue with the current context and refined prompt</p>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="flex-1 border-t border-on-dark/20"></div>
                            <span className="px-3 text-xs text-on-dark-muted">OR</span>
                            <div className="flex-1 border-t border-on-dark/20"></div>
                          </div>
                          
                          <button
                            onClick={handleReset}
                            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            🆕 Start New Conversation
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {state.error && (
                    <div className="text-center py-8">
                      <div className="glass-card p-8 max-w-md mx-auto">
                        {state.error.includes('limit reached') ? (
                          <>
                            {/* Usage Limit Reached */}
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-warning/20 rounded-full mb-4">
                              <CheckCircle className="w-6 h-6 text-warning" />
                            </div>
                            <h3 className="text-lg font-semibold text-on-dark mb-2">
                              Thank you for testing DuoLog!
                            </h3>
                            <p className="text-on-dark mb-4">
                              You've successfully experienced 5 AI collaboration conversations. We hope you enjoyed seeing Claude and GPT-4 work together to refine your prompts!
                            </p>
                            <div className="text-sm text-on-dark-muted mb-4 p-3 bg-on-dark/5 rounded-lg">
                              <p className="font-medium mb-1">What's next?</p>
                              <p>Join our early access waitlist to get notified when we launch with unlimited conversations and premium features.</p>
                            </div>
                            
                            {/* Email signup form */}
                            <div className="mb-4">
                              <EmailForm />
                            </div>
                            
                            {/* OR divider and API keys option (dev only) */}
                            {process.env.NODE_ENV === 'development' && (
                              <>
                                <div className="flex items-center mb-4">
                                  <div className="flex-1 border-t border-on-dark/20"></div>
                                  <span className="px-3 text-xs text-on-dark-muted">OR</span>
                                  <div className="flex-1 border-t border-on-dark/20"></div>
                                </div>
                                <button
                                  onClick={() => setShowSettings(true)}
                                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                  Add your own API keys for unlimited access
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Regular Error */}
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-error/20 rounded-full mb-4">
                              <AlertCircle className="w-6 h-6 text-error" />
                            </div>
                            <h3 className="text-lg font-semibold text-on-dark mb-2">
                              Something went wrong
                            </h3>
                            <p className="text-on-dark mb-4">{state.error}</p>
                            <button
                              onClick={handleReset}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              Try Again
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Auto scroll target */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Progress Indicator - centered below chat */}
              {state.conversation && (
                <div className="flex-shrink-0 py-6">
                  <div className="flex justify-center">
                    <div className="glass-card p-4 bg-white/5">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-on-dark">Progress:</span>
                        <div className="flex items-center gap-2">
                          {(() => {
                            if (!state.conversation) return null;
                            const aiMessages = state.conversation.messages.filter(m => m.role !== 'user');
                            const totalRounds = isConversationComplete ? aiMessages.length : Math.max(aiMessages.length, activeBreathingRound || state.conversation.currentRound);
                            return Array.from({ length: totalRounds }, (_, i) => i + 1).map((round, index, array) => (
                              <div key={round} className="flex items-center">
                                {/* Round Step */}
                                <div className={cn(
                                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-colors relative',
                                  round <= aiMessages.length || isConversationComplete
                                    ? 'bg-primary border-primary text-white'
                                    : round === state.conversation!.currentRound
                                      ? 'border-primary text-primary bg-primary/10 animate-pulse'
                                      : 'border-on-dark/30 text-on-dark bg-transparent'
                                )}>
                                  {/* Breathing glow animation */}
                                  {round === activeBreathingRound && !isConversationComplete && activeBreathingRound > 0 && (
                                    <div className="absolute inset-0 rounded-full animate-breathe-glow" />
                                  )}
                                  
                                  {(() => {
                                    // Check if there's a completed (non-streaming) message for this step
                                    const completedMessages = aiMessages.filter(m => !m.isStreaming);
                                    const hasCompletedMessage = round <= completedMessages.length;
                                    
                                    if (hasCompletedMessage || isConversationComplete) {
                                      return <CheckCircle className="w-4 h-4" />;
                                    } else {
                                      return (
                                        <span className={cn(
                                          "relative z-10",
                                          round === state.conversation!.currentRound && "animate-pulse"
                                        )}>
                                          {round}
                                        </span>
                                      );
                                    }
                                  })()}
                                </div>

                                {/* Connector Line */}
                                {index < array.length - 1 && (
                                  <div className={cn(
                                    'w-8 h-0.5 mx-1 transition-colors',
                                    round <= aiMessages.length || isConversationComplete
                                      ? 'bg-primary'
                                      : 'bg-on-dark/30'
                                  )} />
                                )}
                              </div>
                            ));
                          })()}
                        </div>

                        {/* Status Text */}
                        <div className="text-sm">
                          {isConversationComplete ? (
                            <span className="text-success font-medium">
                              Complete!
                            </span>
                          ) : state.conversation && (
                            <span className="text-on-dark">
                              Round {state.conversation.currentRound} of ?
                            </span>
                          )}
                        </div>


                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Input Area - hide if user is out of usage */}
        {!(usageStatus && usageStatus.used >= usageStatus.limit && !usageStatus.hasOwnKeys) && (
          <div ref={promptInputRef} className="mb-6 px-0">
          <div className="container-fluid mx-auto lg:max-w-4xl max-w-full">
            <PromptInput
              onSubmit={isConversationComplete ? handleContinueConversation : handleStartConversation}
              onStop={handleStop}
              disabled={state.error ? true : (isConversationComplete ? !canContinue : !canStartNew)}
              isLoading={state.isLoading || processingRef.current}
              placeholder={state.error?.includes('limit reached') ? "Demo complete - Thank you for trying DuoLog!" : (isConversationComplete ? "Ask a follow-up question..." : "Enter your prompt...")}
            />
            
            {/* Usage status and controls */}
            <div className="flex items-center justify-between mt-3 text-xs text-on-dark-muted">
              <div className="flex items-center gap-4">
                <div className="hidden lg:block">
                  <DevModeToggle isMockMode={isMockMode} onToggle={setIsMockMode} />
                </div>
              </div>
              
              {/* Feature gated settings - only show in development for now, hidden on mobile */}
              {process.env.NODE_ENV === 'development' && (
                <div className="hidden lg:block">
                  <button
                    onClick={() => setShowSettings(true)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                      usageStatus?.hasOwnKeys
                        ? "bg-success/10 border border-success/20 text-success hover:bg-success/15" // Success state with own keys
                        : "bg-on-dark/5 border border-on-dark/10 text-on-dark-muted hover:bg-on-dark/10 hover:text-on-dark" // Default state
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {usageStatus?.hasOwnKeys ? "API Settings" : "Settings"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onKeysUpdated={(keys) => {
          setUserKeys(keys);
          // Update usage status to reflect having own keys
          if (usageStatus) {
            setUsageStatus({
              ...usageStatus,
              hasOwnKeys: Boolean(keys.openai || keys.anthropic),
            });
          }
        }}
      />

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailCapture}
        onSubmit={handleEmailSubmit}
        onClose={() => {
          setShowEmailCapture(false);
          setPendingPrompt('');
        }}
        isExistingUser={isExistingUser}
        onVerificationRequired={handleVerificationRequired}
      />

      {/* Email Verification Waiting */}
      {showVerificationWaiting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <EmailVerificationWaiting
            email={userEmail}
            onResendEmail={handleResendVerification}
            onVerificationComplete={handleVerificationComplete}
          />
        </div>
      )}
    </>
  );
}