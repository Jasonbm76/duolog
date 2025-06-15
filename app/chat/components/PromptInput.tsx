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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

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
              const newPrompt = prevPrompt + finalTranscript;
              return newPrompt;
            });
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          
          switch (event.error) {
            case 'network':
              toast.error('Network error during speech recognition');
              break;
            case 'not-allowed':
              toast.error('Microphone access denied. Please allow microphone access.');
              break;
            case 'no-speech':
              toast.error('No speech detected. Please try again.');
              break;
            default:
              toast.error('Speech recognition failed. Please try again.');
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
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (!speechSupported) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast.error('Failed to start speech recognition');
      }
    }
  }, [isRecording, speechSupported]);

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
            disabled={disabled || isLoading}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isRecording
                ? "bg-error/20 border border-error/40 text-error animate-pulse hover:bg-error/30"
                : speechSupported
                  ? "bg-on-dark/10 hover:bg-on-dark/20 text-on-dark"
                  : "bg-on-dark/5 text-on-dark/30 cursor-not-allowed"
            )}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
            title={
              !speechSupported 
                ? "Speech recognition not supported" 
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
            disabled={disabled || isLoading}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isRecording
                ? "bg-error/20 text-error animate-pulse hover:bg-error/30"
                : speechSupported
                  ? "hover:bg-on-dark/20 text-on-dark"
                  : "text-on-dark/30 cursor-not-allowed"
            )}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
            title={
              !speechSupported 
                ? "Speech recognition not supported" 
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