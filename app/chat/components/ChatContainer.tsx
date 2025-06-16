"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useConversation } from '../context/ConversationContext';
import { useStatusProgression } from '../hooks/useStatusProgression';
import { realConversationService } from '@/lib/services/real-conversation';
import { mockConversationService } from '@/lib/services/mock-conversation-real-interface';
import { Message } from '@/lib/types/chat';
import { getMockConversationFlow, createMessageFromMockResponse } from '@/lib/mock-data/conversations';
import { Bot, CheckCircle, AlertCircle, Settings, Brain, Wifi, WifiOff } from 'lucide-react';
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
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Email-based usage tracking
  const [userEmail, setUserEmail] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [showVerificationWaiting, setShowVerificationWaiting] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  // Connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connected');
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Tone preferences
  const [selectedTone, setSelectedTone] = useState<string>('conversational');
  
  const toneOptions = [
    { value: 'professional', label: '🎯 Professional', description: 'Business-focused, formal language' },
    { value: 'conversational', label: '💬 Conversational', description: 'Friendly, casual, approachable' },
    { value: 'creative', label: '🎨 Creative', description: 'Imaginative, expressive, inspiring' },
    { value: 'technical', label: '🔬 Technical', description: 'Detailed, precise, analytical' },
    { value: 'concise', label: '⚡ Concise', description: 'Brief, to-the-point responses' },
    { value: 'educational', label: '🎓 Educational', description: 'Teaching-focused, step-by-step' },
    { value: 'enthusiastic', label: '🚀 Enthusiastic', description: 'Energetic, motivational' },
    { value: 'sarcastic', label: '😏 Sarcastic', description: 'Witty, clever, with a touch of humor' },
    { value: 'roast', label: '🔥 Roast Me', description: 'Playfully savage, comedy roast style' }
  ];

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Example prompts pool for random selection
  const examplePrompts = [
    // Business & Entrepreneurship
    { emoji: "👗", text: "I want to start a sustainable fashion brand but don't know where to begin", prompt: "I want to start a sustainable fashion brand but don't know where to begin. Help me create a business plan." },
    { emoji: "☕", text: "Help me create a business plan for a specialty coffee roastery", prompt: "I want to open a specialty coffee roastery focusing on single-origin beans. Help me create a comprehensive business plan." },
    { emoji: "📱", text: "Design a social media strategy for my local bakery", prompt: "I own a small bakery and want to create an effective social media strategy to attract more customers. What should I focus on?" },
    { emoji: "💡", text: "Validate my SaaS idea for freelance project management", prompt: "I have an idea for a SaaS tool that helps freelancers manage multiple projects. How do I validate this idea before building it?" },
    
    // Creative & Writing
    { emoji: "✍️", text: "Write a creative story about a time traveler stuck in ancient Rome", prompt: "Write a short story about a time traveler who can only go backward in time and gets stuck in ancient Rome." },
    { emoji: "🎵", text: "Help me write lyrics for a song about overcoming challenges", prompt: "I want to write lyrics for an uplifting song about overcoming personal challenges. Help me brainstorm themes and verses." },
    { emoji: "🎨", text: "Create a concept for an interactive art installation", prompt: "I'm planning an interactive art installation for a local gallery. Help me develop a concept that engages visitors." },
    { emoji: "📖", text: "Plot outline for a mystery novel set in Victorian London", prompt: "Help me create a plot outline for a mystery novel set in Victorian London with a female detective protagonist." },
    
    // Tech & Programming
    { emoji: "🐍", text: "Help me understand Python decorators with practical examples", prompt: "I'm learning Python and struggling with understanding decorators. Can you explain them with practical examples?" },
    { emoji: "⚛️", text: "Build a React component for user authentication", prompt: "I need to create a React component for user authentication with login and signup forms. Guide me through the best practices." },
    { emoji: "🤖", text: "Explain machine learning concepts for beginners", prompt: "I'm new to machine learning and want to understand the basic concepts and algorithms. Where should I start?" },
    { emoji: "🔐", text: "Secure my web application against common vulnerabilities", prompt: "I'm building a web application and want to ensure it's secure. What are the most important security measures I should implement?" },
    
    // Travel & Culture
    { emoji: "🇯🇵", text: "Plan a 2-week Japan itinerary focused on traditional culture", prompt: "Plan a 2-week itinerary for Japan focusing on traditional culture, local food, and off-the-beaten-path destinations." },
    { emoji: "🏔️", text: "Design a hiking adventure through the Swiss Alps", prompt: "I want to plan a 10-day hiking adventure through the Swiss Alps. Help me create an itinerary with accommodations." },
    { emoji: "🏛️", text: "Cultural immersion trip to ancient Greek historical sites", prompt: "Plan a cultural immersion trip to Greece focusing on ancient historical sites and archaeological museums." },
    
    // Personal Development
    { emoji: "🎤", text: "Help me improve my public speaking and overcome stage fright", prompt: "I want to improve my public speaking skills. Create a practice plan and help me overcome stage fright." },
    { emoji: "🧘", text: "Create a morning routine to boost productivity and wellness", prompt: "I want to establish a morning routine that improves my productivity and overall wellness. What should I include?" },
    { emoji: "💪", text: "Design a workout plan for someone who works from home", prompt: "I work from home and need a fitness routine that doesn't require a gym. Create a workout plan I can do at home." },
    { emoji: "📚", text: "Learn a new language efficiently as an adult", prompt: "I'm 30 and want to learn Spanish efficiently. What's the best approach for adult language learning?" },
    
    // Health & Wellness
    { emoji: "🥗", text: "Create a meal prep plan for healthy eating on a budget", prompt: "I want to eat healthier but I'm on a tight budget and have limited time. Help me create a meal prep plan." },
    { emoji: "😴", text: "Improve my sleep quality and establish better sleep habits", prompt: "I have trouble sleeping and want to improve my sleep quality. What changes should I make to my routine?" },
    { emoji: "🧠", text: "Techniques to reduce stress and manage anxiety naturally", prompt: "I've been feeling overwhelmed lately. What are some natural techniques to reduce stress and manage anxiety?" },
    
    // Home & DIY
    { emoji: "🏡", text: "Design a small apartment to maximize space and functionality", prompt: "I live in a 500 sq ft apartment and want to maximize space while keeping it stylish. Give me design ideas." },
    { emoji: "🌱", text: "Start an indoor herb garden for cooking", prompt: "I want to grow herbs indoors for cooking. What are the best herbs to start with and how do I set up a system?" },
    { emoji: "🔨", text: "Build a custom bookshelf for my living room", prompt: "I want to build a custom bookshelf that fits perfectly in my living room. Guide me through the planning and construction." },
    
    // Learning & Education
    { emoji: "🎯", text: "Master the fundamentals of digital marketing", prompt: "I want to learn digital marketing from scratch. Create a learning plan that covers all the essential skills." },
    { emoji: "📊", text: "Understand data analysis and visualization basics", prompt: "I need to learn data analysis for my job. Teach me the basics of working with data and creating visualizations." },
    { emoji: "🎪", text: "Learn photography composition and lighting techniques", prompt: "I want to improve my photography skills. Teach me about composition, lighting, and post-processing techniques." }
  ];

  // Randomly select 5 examples on component mount
  const [selectedExamples, setSelectedExamples] = useState<typeof examplePrompts>([]);

  useEffect(() => {
    const shuffled = [...examplePrompts].sort(() => 0.5 - Math.random());
    setSelectedExamples(shuffled.slice(0, 5));
    
    // Load saved tone preference
    const savedTone = localStorage.getItem('duolog-tone-preference');
    if (savedTone && toneOptions.find(t => t.value === savedTone)) {
      setSelectedTone(savedTone);
    }
  }, []);
  
  // Save tone preference when changed
  const handleToneChange = (tone: string) => {
    setSelectedTone(tone);
    localStorage.setItem('duolog-tone-preference', tone);
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

  // Handle wheel events (mouse wheel) to detect user scroll intent
  const handleWheel = useCallback((e: WheelEvent) => {
    // If user scrolls up with wheel, disable auto-scroll
    if (e.deltaY < 0) {
      setUserHasScrolled(true);
    }
  }, []);

  // Handle touch events to detect user swipe/scroll intent
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Store initial touch position
    const touch = e.touches[0];
    if (touch && scrollContainerRef.current) {
      scrollContainerRef.current.dataset.touchStartY = touch.clientY.toString();
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Detect upward swipe
    const touch = e.touches[0];
    if (touch && scrollContainerRef.current?.dataset.touchStartY) {
      const startY = parseFloat(scrollContainerRef.current.dataset.touchStartY);
      const deltaY = touch.clientY - startY;
      
      // If user swipes up (negative deltaY), disable auto-scroll
      if (deltaY > 20) { // Threshold to avoid accidental triggers
        setUserHasScrolled(true);
      }
    }
  }, []);

  // Enhanced auto-scroll with smooth streaming behavior
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

  // Throttled smooth scroll function for better performance
  const smoothScrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (!userHasScrolled && messagesEndRef.current) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        });
      }
    }, 100); // Throttle to 100ms for smooth but responsive scrolling
  }, [userHasScrolled]);

  // Smooth scroll during AI typing/streaming content
  useEffect(() => {
    if (!userHasScrolled && state.conversation?.messages) {
      const streamingMessage = state.conversation.messages.find(msg => msg.isStreaming);
      if (streamingMessage) {
        smoothScrollToBottom();
      }
    }
  }, [
    state.conversation?.messages.map(msg => msg.content).join(''), // Re-run when any message content changes
    userHasScrolled,
    smoothScrollToBottom
  ]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Generate sessionId after hydration - only when truly needed
  useEffect(() => {
    if (!sessionId) {
      const service = isMockMode ? mockConversationService : realConversationService;
      setSessionId(service.generateSessionId());
    }
    
  }, []); // Remove isMockMode dependency to prevent unnecessary regeneration

  // Initialize client-side state for connection monitoring
  useEffect(() => {
    setIsClient(true);
    setLastConnectionCheck(new Date());
  }, []);

  // Connection status monitoring
  useEffect(() => {
    if (!isClient) return;
    const checkConnection = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Check if we're online
        if (!navigator.onLine) {
          setConnectionStatus('disconnected');
          return;
        }
        
        // Test API connectivity with a lightweight endpoint
        const response = await fetch('/api/health', {
          method: 'GET',
          timeout: 5000,
        } as RequestInit);
        
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        setConnectionStatus('error');
      } finally {
        setLastConnectionCheck(new Date());
      }
    };

    // Initial check
    checkConnection();

    // Periodic checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Listen for online/offline events
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Add scroll detection event listeners
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: true });
      scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Remove scroll detection event listeners
      if (scrollContainer) {
        scrollContainer.removeEventListener('wheel', handleWheel);
        scrollContainer.removeEventListener('touchstart', handleTouchStart);
        scrollContainer.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isClient, handleWheel, handleTouchStart, handleTouchMove]);

  // Update connection status during active conversations
  useEffect(() => {
    if (state.isLoading || processingRef.current) {
      setConnectionStatus('connecting');
    } else if (state.error) {
      setConnectionStatus('error');
    }
  }, [state.isLoading, state.error]);

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
        if (savedEmail && isValidEmail(savedEmail)) {
          try {
            // Verify the email is still valid and verified on the server
            const { createUserIdentifier } = await import('@/lib/utils/fingerprint');
            const identifiers = createUserIdentifier();
            
            const params = new URLSearchParams({
              email: savedEmail,
              fingerprint: identifiers.fingerprint,
              sessionId: sessionId || 'temp'
            });
            
            const response = await fetch(`/api/chat/email-usage?${params}`);

            if (response.ok) {
              const result = await response.json();
              if (result.emailVerified) {
                // Email is verified, restore it
                setUserEmail(savedEmail);
              } else {
                // Email exists but not verified, remove from localStorage
                localStorage.removeItem('user_email');
              }
            } else {
              // API error, remove email from localStorage to be safe
              localStorage.removeItem('user_email');
            }
          } catch (error) {
            console.error('Error validating saved email:', error);
            // Remove email from localStorage if validation fails
            localStorage.removeItem('user_email');
          }
        } else if (savedEmail) {
          // Invalid email format, remove from localStorage
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
        // Start conversation immediately with the verified email
        handleStartConversationWithEmail(pendingPrompt, email);
        setPendingPrompt('');
      }
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

  const handleStartConversationWithEmail = async (initialPrompt: string, emailToUse: string) => {
    console.log('handleStartConversationWithEmail called with:', { initialPrompt, emailToUse, sessionId });
    if (processingRef.current || !sessionId) {
      console.log('Conversation blocked:', { processingRefCurrent: processingRef.current, sessionId });
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
          email: emailToUse,
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
        email: emailToUse,
        fingerprint: identifiers.fingerprint,
        userKeys: (userKeys.openai || userKeys.anthropic) ? userKeys : undefined,
        tone: selectedTone,
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
          // Token tracking logic would go here
        }
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start conversation' });
      processingRef.current = false;
    }
  };

  const handleStartConversation = async (initialPrompt: string) => {
    if (processingRef.current || !sessionId) return;

    // Check if we have user email - if not, show email capture modal
    if (!userEmail) {
      setShowEmailCapture(true);
      setPendingPrompt(initialPrompt);
      return;
    }

    // Use the existing email for conversation
    return handleStartConversationWithEmail(initialPrompt, userEmail);
  };

  const handleStop = () => {
    // Stop the conversation service
    const service = isMockMode ? mockConversationService : realConversationService;
    service.stop();
    
    // Set AI as no longer active and clear processing state
    isAIActiveRef.current = false;
    processingRef.current = false;
    setTypingAI(null);
    setActiveBreathingRound(0);
    clearProgression();
    
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

  const handleContinueConversation = async (followUpPrompt: string) => {
    if (processingRef.current || !sessionId) return;
    processingRef.current = true;

    try {
      // Create user identifiers for usage tracking
      const { createUserIdentifier } = await import('@/lib/utils/fingerprint');
      const identifiers = createUserIdentifier();

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
        email: userEmail,
        fingerprint: identifiers.fingerprint,
        userKeys: (userKeys.openai || userKeys.anthropic) ? userKeys : undefined,
        tone: selectedTone,
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
          connectionStatus={connectionStatus}
          lastConnectionCheck={lastConnectionCheck}
        />
      </div>

      {/* Connection Status Indicator - Desktop Only */}
      {isClient && (
        <div className="fixed top-[37px] right-[20px] z-[60] group hidden lg:block">
          <div className="flex flex-col items-center">
            <div 
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 cursor-pointer",
                connectionStatus === 'connected' && "bg-success/20 text-success hover:bg-success/30",
                connectionStatus === 'connecting' && "bg-warning/20 text-warning animate-pulse hover:bg-warning/30",
                connectionStatus === 'disconnected' && "bg-error/20 text-error hover:bg-error/30",
                connectionStatus === 'error' && "bg-error/20 text-error animate-pulse hover:bg-error/30"
              )}
            >
              {connectionStatus === 'connected' && <Wifi className="w-4 h-4" />}
              {connectionStatus === 'connecting' && <Wifi className="w-4 h-4" />}
              {connectionStatus === 'disconnected' && <WifiOff className="w-4 h-4" />}
              {connectionStatus === 'error' && <AlertCircle className="w-4 h-4" />}
            </div>
            
            {/* Connection Badge */}
            <div className="mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-on-dark/10 text-on-dark/60">
              Connection
            </div>
            
            {/* Tooltip */}
            <div className="absolute top-full mt-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-background border border-on-dark/20 rounded-lg p-3 shadow-lg max-w-48 text-sm">
                <div className="text-on-dark font-medium mb-1">
                  {connectionStatus === 'connected' && 'Connected'}
                  {connectionStatus === 'connecting' && 'Connecting...'}
                  {connectionStatus === 'disconnected' && 'Disconnected'}
                  {connectionStatus === 'error' && 'Connection Error'}
                </div>
                <div className="text-on-dark/70">
                  {connectionStatus === 'connected' && 'All systems operational'}
                  {connectionStatus === 'connecting' && 'Establishing connection...'}
                  {connectionStatus === 'disconnected' && 'No internet connection'}
                  {connectionStatus === 'error' && 'API connection failed'}
                </div>
                {lastConnectionCheck && connectionStatus === 'connected' && (
                  <div className="text-on-dark/50 text-xs mt-1">
                    Last checked: {lastConnectionCheck.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                className={cn(
                  "flex-1 overflow-y-auto scrollbar-hide lg:py-6 py-3 lg:pb-6 pb-[120px] transition-all duration-300",
                  state.conversation?.messages.some(msg => msg.isStreaming) && "scroll-smooth"
                )}
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
                        <p className="text-on-dark max-w-lg mx-auto mb-6 lg:text-base text-sm">
                          Ask anything—from creative projects and business strategy to learning new skills or solving everyday problems. Get the combined expertise of two AI minds working together.
                        </p>
                        
                        {/* Example Prompts */}
                        {selectedExamples.length > 0 && (
                          <div className="grid gap-3 mb-6">
                            <h3 className="lg:text-sm text-xs font-medium text-on-dark mb-2">Here are some examples from different categories:</h3>
                            <div className="grid gap-2 lg:text-sm text-xs">
                              {selectedExamples.map((example, index) => (
                                <button 
                                  key={index}
                                  onClick={() => handleStartConversation(example.prompt)}
                                  className="lg:p-3 p-2 text-left border border-on-dark/20 rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-on-dark flex items-center lg:gap-3 gap-2"
                                  disabled={!canStartNew}
                                >
                                  <span className="lg:text-lg text-base">{example.emoji}</span>
                                  <span>{example.text}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
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
                  {state.conversation?.messages.map((message, index) => {
                    const previousMessage = index > 0 ? state.conversation?.messages[index - 1] : null;
                    const isNewRound = !previousMessage || message.round !== previousMessage.round;
                    const isFirstMessageInRound = isNewRound;
                    
                    return (
                      <div key={message.id}>
                        {/* Round Separator */}
                        {isFirstMessageInRound && message.round > 1 && !message.isFinalSynthesis && (
                          <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-4 text-on-dark/40">
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-on-dark/20 to-transparent"></div>
                              <div className="flex items-center gap-2 px-4 py-2 glass-card">
                                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                                <span className="text-sm font-medium">Round {message.round}</span>
                                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                              </div>
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-on-dark/20 to-transparent"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Final Synthesis Separator */}
                        {message.isFinalSynthesis && (
                          <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-4 text-on-dark/40">
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-success/20 to-transparent"></div>
                              <div className="flex items-center gap-2 px-4 py-2 glass-card">
                                <div className="w-2 h-2 rounded-full bg-success/60 animate-pulse"></div>
                                <span className="text-sm font-medium">Final Synthesis</span>
                                <div className="w-2 h-2 rounded-full bg-success/60 animate-pulse"></div>
                              </div>
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-success/20 to-transparent"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Message Content */}
                        {message.isFinalSynthesis ? (
                          <FinalSynthesis 
                            message={message}
                          />
                        ) : (
                          <MessageBubble 
                            message={message} 
                            isStreaming={message.isStreaming}
                          />
                        )}
                      </div>
                    );
                  })}

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
                            // Calculate rounds intelligently based on actual conversation state
                            const currentActiveRound = activeBreathingRound || state.conversation.currentRound;
                            
                            let totalRounds;
                            if (isConversationComplete) {
                              // When complete, only show actual AI messages
                              totalRounds = aiMessages.length;
                            } else {
                              // During conversation, show completed + current active round
                              totalRounds = Math.max(aiMessages.length, currentActiveRound);
                            }
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

                        {/* Status Text - Just show completion status */}
                        <div className="text-sm">
                          {isConversationComplete && (
                            <span className="text-success font-medium">
                              Complete!
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
          <div ref={promptInputRef} className="lg:mb-6 lg:px-0 lg:static fixed bottom-0 left-0 right-0 lg:bg-transparent bg-background/95 backdrop-blur-xl lg:border-0 border-t border-white/10 z-50 lg:pb-0 pb-safe">
          <div className="container-fluid mx-auto lg:max-w-4xl max-w-full lg:p-0 p-0">
            <PromptInput
              onSubmit={isConversationComplete ? handleContinueConversation : handleStartConversation}
              onStop={handleStop}
              disabled={state.error ? true : (isConversationComplete ? !canContinue : !canStartNew)}
              isLoading={state.isLoading || processingRef.current}
              placeholder={state.error?.includes('limit reached') ? "Demo complete - Thank you for trying DuoLog!" : (isConversationComplete ? "Ask a follow-up question..." : "Enter your prompt...")}
              selectedTone={selectedTone}
              onToneChange={handleToneChange}
              toneOptions={toneOptions}
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
        selectedTone={selectedTone}
        onToneChange={handleToneChange}
        toneOptions={toneOptions}
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