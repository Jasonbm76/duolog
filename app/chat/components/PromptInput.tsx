"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Loader2, Square, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Web Speech API TypeScript declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PromptInput({ 
  onSubmit, 
  onStop,
  isLoading = false, 
  placeholder = "Enter your prompt...",
  disabled = false,
  className 
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechServiceAvailable, setSpeechServiceAvailable] = useState(true);
  const [lastServiceCheck, setLastServiceCheck] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastErrorRef = useRef<number>(0);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Initializing speech recognition...');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      console.log('SpeechRecognition available:', !!SpeechRecognition);
      console.log('Browser:', navigator.userAgent);
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Changed to false for better reliability
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        console.log('Speech recognition configured:', {
          continuous: recognition.continuous,
          interimResults: recognition.interimResults,
          lang: recognition.lang
        });

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update the prompt with final transcript
          if (finalTranscript) {
            setPrompt(prevPrompt => {
              const newPrompt = prevPrompt + finalTranscript + ' ';
              return newPrompt;
            });
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error details:', {
            error: event.error,
            message: event.message,
            timeStamp: event.timeStamp,
            type: event.type
          });
          
          setIsRecording(false);
          
          // Prevent spam logging of the same error
          const now = Date.now();
          if (now - lastErrorRef.current < 1000) {
            console.log('Skipping duplicate error within 1 second');
            return; // Skip if same error happened within 1 second
          }
          lastErrorRef.current = now;
          
          switch (event.error) {
            case 'network':
              // In development (localhost), this is often a Chrome security restriction, not a real network issue
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              
              if (isLocalhost) {
                setSpeechError('Voice input not available in development');
                toast.error('Voice input requires HTTPS in production. Please type your message.', {
                  duration: 4000,
                });
                console.warn('Speech recognition network error - Chrome requires HTTPS for speech recognition. This will work in production.');
                // Don't mark service as unavailable in development - it's expected
                setSpeechServiceAvailable(false);
              } else {
                // In production, this might be a real network issue
                setSpeechServiceAvailable(false);
                setSpeechError('Speech service temporarily unavailable');
                toast.error('Voice input is temporarily unavailable. Please type your message instead.', {
                  duration: 4000,
                });
                console.warn('Speech recognition network error in production environment');
                // Retry after 30 seconds
                setTimeout(() => {
                  console.log('Re-enabling speech service for retry');
                  setSpeechServiceAvailable(true);
                  setSpeechError(null);
                }, 30000);
              }
              break;
            case 'not-allowed':
              setSpeechError('Microphone access denied');
              console.warn('Speech recognition permission denied');
              toast.error('Microphone access denied. Please allow microphone access.');
              break;
            case 'no-speech':
              // Don't show error for no speech, just stop recording
              setSpeechError(null);
              console.warn('Speech recognition - no speech detected');
              break;
            case 'aborted':
              // User intentionally stopped, don't show error
              setSpeechError(null);
              console.warn('Speech recognition aborted');
              break;
            default:
              setSpeechError('Speech recognition failed');
              console.warn('Speech recognition error:', event.error);
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  const toggleRecording = useCallback(async () => {
    console.log('Toggle recording clicked', { 
      speechSupported, 
      isRecording, 
      speechServiceAvailable,
      recognitionAvailable: !!recognitionRef.current 
    });

    if (!speechSupported) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
        setIsRecording(false);
      }
    } else {
      // Check for microphone permissions first
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          console.log('Requesting microphone permission...');
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Microphone permission granted');
          // Stop the stream immediately as we only needed permission
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Small delay to prevent rapid restart issues
        setTimeout(() => {
          try {
            if (recognitionRef.current && !isRecording) {
              console.log('Starting speech recognition...');
              setSpeechError(null); // Clear any previous errors
              recognitionRef.current.start();
            }
          } catch (startError) {
            console.error('Failed to start speech recognition:', startError);
            setSpeechError('Speech recognition failed to start');
            toast.error('Failed to start voice input. Please try typing instead.');
          }
        }, 100);
      } catch (permissionError) {
        console.error('Microphone permission error:', permissionError);
        toast.error('Microphone access is required for voice input');
      }
    }
  }, [isRecording, speechSupported, speechServiceAvailable]);

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading && !disabled) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow shift+enter for new lines
        return;
      } else {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const canSubmit = prompt.trim().length > 0 && !isLoading && !disabled;

  return (
    <>
      {/* Desktop Version */}
      <div className={cn("hidden lg:block flex-shrink-0", className?.includes('m-0') ? "" : "glass-card p-4 mt-6", className)}>
        <div className="flex gap-3 items-center">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(
                "w-full resize-none border border-on-dark/20 rounded-xl px-4 py-3",
                "text-on-dark placeholder-on-dark/40 bg-neutral-900/50 backdrop-blur-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                "min-h-[80px] max-h-48 leading-6",
                "disabled:bg-on-dark/5 disabled:text-on-dark disabled:cursor-not-allowed",
                "transition-colors scrollbar-hide overflow-hidden"
              )}
              rows={2}
            />
            
            {/* Character count for longer prompts */}
            {prompt.length > 100 && (
              <div className="absolute -top-6 right-0 text-xs text-on-dark">
                {prompt.length} characters
              </div>
            )}
          </div>

          {/* Microphone Button - Desktop */}
          <button
            onClick={toggleRecording}
            disabled={disabled || isLoading || !speechServiceAvailable}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isRecording
                ? "bg-error/20 border border-error/40 text-error animate-pulse hover:bg-error/30"
                : speechSupported && speechServiceAvailable
                  ? "bg-on-dark/10 hover:bg-on-dark/20 text-on-dark"
                  : "bg-on-dark/5 text-on-dark/30 cursor-not-allowed"
            )}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
            title={
              !speechSupported 
                ? "Speech recognition not supported" 
                : !speechServiceAvailable
                  ? "Voice input temporarily unavailable"
                : isRecording 
                  ? "Click to stop recording" 
                  : "Click to start voice input"
            }
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Submit/Stop Button - Desktop */}
          <button
            onClick={isLoading && onStop ? onStop : handleSubmit}
            disabled={isLoading ? !onStop : !canSubmit}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              "backdrop-blur-md transition-all duration-300 group",
              "text-white disabled:opacity-50 disabled:cursor-not-allowed",
              "active:scale-95",
              isLoading && onStop
                ? "border-error/60 bg-error/30 shadow-xl shadow-error/30 border hover:bg-error/40"
                : canSubmit 
                  ? "border-primary/60 bg-primary/30 shadow-xl shadow-primary/30 border"
                  : "glass-card border border-on-dark/20 bg-transparent"
            )}
          >
            {isLoading ? (
              onStop ? (
                <Square className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )
            ) : (
              <ArrowUp className={cn(
                "w-5 h-5 transition-transform duration-300",
                canSubmit && "group-hover:scale-110 group-hover:-translate-y-0.5"
              )} />
            )}
          </button>
        </div>

        {/* Helper Text - Desktop only */}
        <div className="flex justify-between items-center mt-2 text-xs font-semibold text-on-dark/50 text-shadow-sm">
          <span>
            {disabled 
              ? "Conversation is complete"
              : isLoading 
                ? "AI is processing..." 
                : isRecording
                  ? "Listening... Click microphone to stop"
                  : !speechServiceAvailable
                    ? speechError === 'Voice input not available in development'
                      ? "Press Enter to send, Shift+Enter for new line (voice input requires HTTPS)"
                      : "Press Enter to send, Shift+Enter for new line (voice input temporarily unavailable)"
                    : "Press Enter to send, Shift+Enter for new line, or use voice input"
            }
          </span>
        </div>
      </div>

      {/* Mobile Version - Full Width Like Reference */}
      <div className="lg:hidden flex-shrink-0 px-4 py-3 bg-background/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center gap-3 bg-on-dark/10 rounded-full p-2">
          {/* Microphone Button */}
          <button
            onClick={toggleRecording}
            disabled={disabled || isLoading || !speechServiceAvailable}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isRecording
                ? "bg-error/20 text-error animate-pulse hover:bg-error/30"
                : speechSupported && speechServiceAvailable
                  ? "hover:bg-on-dark/20 text-on-dark"
                  : "text-on-dark/30 cursor-not-allowed"
            )}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
            title={
              !speechSupported 
                ? "Speech recognition not supported" 
                : !speechServiceAvailable
                  ? "Voice input temporarily unavailable"
                : isRecording 
                  ? "Click to stop recording" 
                  : "Click to start voice input"
            }
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Input Field */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(
                "w-full resize-none bg-transparent border-0 outline-0 px-2 py-2",
                "text-on-dark placeholder-on-dark/60 text-base leading-6",
                "disabled:text-on-dark disabled:cursor-not-allowed",
                "scrollbar-hide overflow-hidden"
              )}
              rows={1}
              style={{ height: '40px', maxHeight: '40px' }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={isLoading && onStop ? onStop : handleSubmit}
            disabled={isLoading ? !onStop : !canSubmit}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              "transition-all duration-300 group",
              "text-white disabled:opacity-50 disabled:cursor-not-allowed",
              "active:scale-95",
              isLoading && onStop
                ? "bg-error hover:bg-error/80"
                : canSubmit 
                  ? "bg-primary hover:bg-primary/80"
                  : "bg-on-dark/20"
            )}
          >
            {isLoading ? (
              onStop ? (
                <Square className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )
            ) : (
              <ArrowUp className={cn(
                "w-4 h-4 transition-transform duration-300",
                canSubmit && "group-hover:scale-110"
              )} />
            )}
          </button>
        </div>
      </div>
    </>
  );
}