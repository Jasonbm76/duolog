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
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  const [googleServiceDown, setGoogleServiceDown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastErrorRef = useRef<number>(0);

  // 🔍 DIAGNOSTIC FUNCTIONS - Find the exact technical issue
  const checkSecureContext = () => {
    console.log('🔍 Security Context Check:');
    console.log('- isSecureContext:', window.isSecureContext);
    console.log('- protocol:', window.location.protocol);
    console.log('- hostname:', window.location.hostname);
    console.log('- port:', window.location.port);
    
    // Even though localhost is considered "secure context", Web Speech API might still require HTTPS
    if (window.location.protocol === 'http:') {
      console.warn('⚠️ WARNING: Running on HTTP, not HTTPS');
      console.warn('While localhost is treated as secure context, Web Speech API may still require HTTPS');
      console.warn('Google\'s demo works because it\'s on https://cloud.google.com');
    }
    
    if (!window.isSecureContext) {
      console.error('❌ ISSUE FOUND: Not a secure context!');
      toast.error("🚨 FOUND THE PROBLEM: Voice input requires HTTPS!");
      return false;
    }
    console.log('✅ Secure context OK (but Web Speech may still need HTTPS)');
    return true;
  };

  const checkBrowserSupport = () => {
    console.log('🔍 Browser Support Check:');
    console.log('- User Agent:', navigator.userAgent);
    console.log('- Platform:', navigator.platform);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ ISSUE FOUND: SpeechRecognition not available');
      const isChrome = navigator.userAgent.includes('Chrome');
      const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
      const isFirefox = navigator.userAgent.includes('Firefox');
      
      let browserMsg = 'this browser';
      if (isChrome) browserMsg = 'this Chrome version';
      else if (isSafari) browserMsg = 'Safari (use Chrome instead)';
      else if (isFirefox) browserMsg = 'Firefox (use Chrome instead)';
      
      toast.error(`🚨 FOUND THE PROBLEM: Speech recognition not supported in ${browserMsg}`);
      return null;
    }
    
    console.log('✅ Browser support OK - SpeechRecognition available');
    console.log('- Constructor:', SpeechRecognition.name);
    console.log('- Is webkit:', !!window.webkitSpeechRecognition);
    console.log('- Is standard:', !!window.SpeechRecognition);
    return SpeechRecognition;
  };

  const testMicrophoneAccess = async () => {
    console.log('🔍 Microphone Access Check:');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ ISSUE FOUND: getUserMedia not available');
      toast.error("🚨 FOUND THE PROBLEM: Microphone API not available in this browser");
      return false;
    }
    
    try {
      console.log('- Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      console.log('- Audio tracks:', stream.getAudioTracks().length);
      
      // Clean up immediately
      stream.getTracks().forEach(track => {
        console.log('- Stopping track:', track.label);
        track.stop();
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ ISSUE FOUND: Microphone access failed:', error);
      
      let errorMsg = 'Unknown microphone error';
      switch(error.name) {
        case 'NotAllowedError':
          errorMsg = 'Microphone permission denied - click Allow when prompted';
          break;
        case 'NotFoundError':
          errorMsg = 'No microphone found on this device';
          break;
        case 'NotReadableError':
          errorMsg = 'Microphone is being used by another application';
          break;
        case 'OverconstrainedError':
          errorMsg = 'Microphone constraints not supported';
          break;
        default:
          errorMsg = `Microphone error: ${error.message}`;
      }
      
      toast.error(`🚨 FOUND THE PROBLEM: ${errorMsg}`);
      return false;
    }
  };

  const setupDiagnosticSpeechRecognition = (SpeechRecognition: any) => {
    console.log('🔍 Speech Recognition Setup Check:');
    
    try {
      const recognition = new SpeechRecognition();
      console.log('✅ Recognition instance created');
      
      // Set proper configuration
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      console.log('- Configuration set:', {
        lang: recognition.lang,
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        maxAlternatives: recognition.maxAlternatives
      });
      
      // Add additional event handlers to debug
      recognition.onspeechstart = () => {
        console.log('🎤 Speech has been detected');
      };
      
      recognition.onspeechend = () => {
        console.log('🔇 Speech has stopped being detected');
      };
      
      recognition.onaudiostart = () => {
        console.log('🔊 Audio capturing started');
      };
      
      recognition.onaudioend = () => {
        console.log('🔈 Audio capturing ended');
      };
      
      recognition.onnomatch = () => {
        console.log('❓ Speech was detected but no match');
      };
      
      // Set up comprehensive error handling
      recognition.onerror = (event: any) => {
        console.error('❌ ISSUE FOUND: Speech Recognition Error:', event);
        console.error('- Error type:', event.error);
        console.error('- Error message:', event.message);
        console.error('- Timestamp:', event.timeStamp);
        console.error('- Full event:', event);
        
        let specificError = 'Unknown speech error';
        switch(event.error) {
          case 'network':
            if (window.location.hostname === 'localhost') {
              specificError = 'Web Speech API is blocked on "localhost" - use 127.0.0.1 instead';
              console.error('🚨 ROOT CAUSE: Google blocks "localhost" origins');
              console.error('💡 SOLUTION: Use 127.0.0.1 instead of localhost');
              const fixedUrl = window.location.href.replace('localhost', '127.0.0.1');
              console.error('🔗 Working URL:', fixedUrl);
            } else if (window.location.protocol === 'http:') {
              specificError = 'Web Speech API requires HTTPS';
              console.error('🚨 ROOT CAUSE: Must use HTTPS protocol');
            } else {
              specificError = 'Network error connecting to Google Speech Service';
              console.error('🚨 Network error - might be rate limited or blocked origin');
            }
            break;
          case 'not-allowed':
            specificError = 'Microphone permission not granted';
            break;
          case 'no-speech':
            specificError = 'No speech detected - try speaking louder';
            break;
          case 'aborted':
            specificError = 'Recognition aborted by user';
            break;
          case 'audio-capture':
            specificError = 'Audio capture failed - check microphone';
            break;
          case 'service-not-allowed':
            specificError = 'Speech service not allowed by browser';
            break;
          default:
            specificError = `Speech recognition error: ${event.error}`;
        }
        
        if (event.error === 'network') {
          setGoogleServiceDown(true);
          setSpeechServiceAvailable(false);
          toast.error(`🚨 Google Speech Service Issue: Voice input is currently unavailable due to Google's speech service being unreachable. This is not a bug in our app.`, { 
            duration: 10000,
            description: "You can still type your message normally. Voice input will work when Google's service comes back online."
          });
        } else {
          toast.error(`🚨 EXACT ERROR: ${specificError}`, { duration: 8000 });
        }
        
        setIsRecording(false);
        setDiagnosticMode(false);
      };
      
      recognition.onstart = () => {
        console.log('✅ Speech recognition started successfully!');
        toast.success('🎤 Speech recognition is working! Say something now...', { duration: 3000 });
        setIsRecording(true);
      };
      
      recognition.onresult = (event: any) => {
        console.log('✅ Speech result received:', event);
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        console.log('- Transcript:', transcript);
        console.log('- Confidence:', confidence);
        
        toast.success(`🎉 SUCCESS! Heard: "${transcript}" (${Math.round(confidence * 100)}% confidence)`);
        
        // Add to prompt
        setPrompt(prevPrompt => {
          const newPrompt = prevPrompt + (prevPrompt ? ' ' : '') + transcript.trim() + ' ';
          return newPrompt;
        });
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        setDiagnosticMode(false);
      };
      
      return recognition;
    } catch (error) {
      console.error('❌ ISSUE FOUND: Failed to create recognition instance:', error);
      toast.error(`🚨 FOUND THE PROBLEM: Cannot create speech recognition: ${error}`);
      return null;
    }
  };

  const runFullDiagnostic = async () => {
    console.log('🚀 Starting comprehensive voice diagnostic...');
    console.log('==================================================');
    setDiagnosticMode(true);
    
    // Step 1: Check secure context
    if (!checkSecureContext()) {
      setDiagnosticMode(false);
      return;
    }
    
    // Step 2: Check browser support
    const SpeechRecognition = checkBrowserSupport();
    if (!SpeechRecognition) {
      setDiagnosticMode(false);
      return;
    }
    
    // Step 3: Test microphone access FIRST and KEEP THE STREAM ACTIVE
    console.log('🎤 Getting microphone stream for speech recognition...');
    let audioStream: MediaStream | null = null;
    
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      console.log('✅ Microphone stream active');
      console.log('- Audio tracks:', audioStream.getAudioTracks().length);
      console.log('- Track settings:', audioStream.getAudioTracks()[0].getSettings());
    } catch (error) {
      console.error('❌ Failed to get microphone stream:', error);
      toast.error('Microphone access required for voice input');
      setDiagnosticMode(false);
      return;
    }
    
    // Step 4: Test actual speech recognition WITH ACTIVE STREAM
    console.log('🎤 Testing speech recognition with active audio stream...');
    
    // Add a small delay to ensure audio stream is fully initialized
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const recognition = setupDiagnosticSpeechRecognition(SpeechRecognition);
    
    if (!recognition) {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      setDiagnosticMode(false);
      return;
    }
    
    // Store the stream reference for cleanup
    const originalOnEnd = recognition.onend;
    recognition.onend = () => {
      console.log('Speech recognition ended - cleaning up audio stream');
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (originalOnEnd) originalOnEnd.call(recognition);
    };
    
    try {
      console.log('- Starting recognition with active microphone...');
      recognition.start();
      console.log('✅ Recognition started - waiting for speech...');
      console.log('🎯 Try speaking now - the microphone is already active!');
      toast.success('Microphone is active - speak now!', { duration: 3000 });
    } catch (error) {
      console.error('❌ ISSUE FOUND: Recognition start failed:', error);
      toast.error(`🚨 FOUND THE PROBLEM: Failed to start recognition: ${error}`);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      setDiagnosticMode(false);
    }
  };

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
      console.log('Location protocol:', window.location.protocol);
      console.log('Location hostname:', window.location.hostname);
      
      // Warn about localhost issue
      if (window.location.hostname === 'localhost') {
        console.warn('⚠️ WARNING: Web Speech API is blocked on "localhost"');
        console.warn('💡 Use 127.0.0.1 instead: ' + window.location.href.replace('localhost', '127.0.0.1'));
        toast.warning('Voice input is blocked on "localhost". Use 127.0.0.1 instead!', {
          duration: 8000,
          action: {
            label: 'Switch to 127.0.0.1',
            onClick: () => {
              window.location.href = window.location.href.replace('localhost', '127.0.0.1');
            }
          }
        });
      }
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        
        // Try to create and configure recognition instance
        try {
          const recognition = new SpeechRecognition();
          
          // More conservative settings for better reliability
          recognition.continuous = false;
          recognition.interimResults = false; // Disable interim results to reduce complexity
          recognition.lang = 'en-US';
          recognition.maxAlternatives = 1;
          
          // Add some Chrome-specific optimizations
          if (recognition.serviceURI !== undefined) {
            // This is a Chrome-specific property
            console.log('Chrome speech recognition detected');
          }
          
          console.log('Speech recognition configured:', {
            continuous: recognition.continuous,
            interimResults: recognition.interimResults,
            lang: recognition.lang,
            serviceURI: recognition.serviceURI
          });

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event) => {
          console.log('Speech recognition result received:', event);
          let finalTranscript = '';

          // Since we disabled interimResults, we only need to handle final results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            console.log('Processing result:', {
              index: i,
              isFinal: result.isFinal,
              transcript: result[0].transcript,
              confidence: result[0].confidence
            });
            
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            }
          }

          // Update the prompt with final transcript
          if (finalTranscript.trim()) {
            console.log('Adding transcript to prompt:', finalTranscript);
            setPrompt(prevPrompt => {
              const newPrompt = prevPrompt + (prevPrompt ? ' ' : '') + finalTranscript.trim() + ' ';
              return newPrompt;
            });
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error details:', {
            error: event.error,
            message: event.message,
            timeStamp: event.timeStamp,
            type: event.type,
            currentTarget: event.currentTarget
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
              // Network errors are unfortunately common with Web Speech API
              // This happens due to various reasons: Chrome policies, Google service issues, network connectivity
              setSpeechServiceAvailable(false);
              setSpeechError('Voice input temporarily unavailable');
              
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              
              if (isLocalhost) {
                toast.error('Voice input not available in development environment. Please type your message.', {
                  duration: 4000,
                });
                console.warn('Speech recognition network error in development - expected due to Chrome security policies');
              } else {
                toast.error('Voice input is experiencing issues. This is a common problem with browser speech recognition. Please type your message instead.', {
                  duration: 6000,
                });
                console.warn('Speech recognition network error in production - this is unfortunately common with Web Speech API');
                
                // Only retry after a longer period in production
                setTimeout(() => {
                  console.log('Re-enabling speech service for retry after network error');
                  setSpeechServiceAvailable(true);
                  setSpeechError(null);
                }, 5 * 60 * 1000); // 5 minutes instead of 1 minute
              }
              break;
            case 'not-allowed':
              setSpeechError('Microphone access denied');
              setSpeechServiceAvailable(false);
              console.warn('Speech recognition permission denied');
              toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
              break;
            case 'no-speech':
              // Don't show error for no speech, just stop recording
              setSpeechError(null);
              console.warn('Speech recognition - no speech detected');
              break;
            case 'aborted':
              // User intentionally stopped, don't show error
              setSpeechError(null);
              console.warn('Speech recognition aborted by user');
              break;
            case 'service-not-allowed':
              setSpeechServiceAvailable(false);
              setSpeechError('Speech service blocked');
              toast.error('Speech recognition service is blocked. Please check your browser settings.');
              break;
            default:
              setSpeechError('Speech recognition failed');
              setSpeechServiceAvailable(false);
              console.warn('Speech recognition error:', event.error);
              toast.error('Voice input encountered an error. Please try typing instead.');
              
              // Re-enable after a short delay for unknown errors
              setTimeout(() => {
                setSpeechServiceAvailable(true);
                setSpeechError(null);
              }, 30000);
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        
        } catch (initError) {
          console.error('Error initializing speech recognition:', initError);
          setSpeechSupported(false);
          setSpeechError('Failed to initialize speech recognition');
        }
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

    if (isRecording) {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsRecording(false);
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
        setIsRecording(false);
      }
      return;
    }

    // Get microphone permission first and keep stream active
    let audioStream: MediaStream | null = null;
    try {
      console.log('Getting microphone stream first...');
      audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      console.log('✅ Microphone stream obtained');
    } catch (error) {
      console.error('Microphone permission error:', error);
      toast.error('Microphone access is required for voice input');
      return;
    }

    // Wait a moment for audio to stabilize
    await new Promise(resolve => setTimeout(resolve, 300));

    // Try to reinitialize speech recognition each time to avoid network errors
    try {
      console.log('Creating fresh speech recognition instance...');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error('Speech recognition is not supported in this browser');
        if (audioStream) audioStream.getTracks().forEach(track => track.stop());
        return;
      }

      // Create a fresh instance with simplified settings
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true; // Changed back to true for better feedback
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Set up event handlers
      recognition.onstart = () => {
        console.log('Speech recognition started successfully');
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        console.log('Speech recognition result received:', event);
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          console.log('Adding transcript to prompt:', finalTranscript);
          setPrompt(prevPrompt => {
            const newPrompt = prevPrompt + (prevPrompt ? ' ' : '') + finalTranscript.trim() + ' ';
            return newPrompt;
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        if (event.error === 'network') {
          // Try one more time immediately for network errors
          console.log('Network error detected, attempting immediate retry...');
          setTimeout(() => {
            try {
              const retryRecognition = new SpeechRecognition();
              retryRecognition.continuous = false;
              retryRecognition.interimResults = false;
              retryRecognition.lang = 'en-US';
              retryRecognition.maxAlternatives = 1;
              
              retryRecognition.onstart = () => {
                console.log('Retry speech recognition started');
                setIsRecording(true);
              };
              
              retryRecognition.onresult = recognition.onresult;
              
              retryRecognition.onerror = (retryEvent) => {
                console.error('Retry also failed:', retryEvent.error);
                setIsRecording(false);
                setSpeechServiceAvailable(false);
                toast.error('Voice input is having connectivity issues. Please try typing your message instead.');
              };
              
              retryRecognition.onend = () => {
                setIsRecording(false);
              };
              
              recognitionRef.current = retryRecognition;
              retryRecognition.start();
            } catch (retryError) {
              console.error('Retry attempt failed:', retryError);
              toast.error('Voice input is not working. Please type your message instead.');
            }
          }, 1000);
        } else {
          toast.error(`Voice input error: ${event.error}. Please try typing instead.`);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        // Clean up audio stream
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
        }
      };

      // Also clean up stream on error
      const originalOnError = recognition.onerror;
      recognition.onerror = (event) => {
        if (originalOnError) originalOnError.call(recognition, event);
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
        }
      };

      // Store the new instance and start
      recognitionRef.current = recognition;
      console.log('Starting speech recognition with active microphone...');
      recognition.start();
      
      // Keep the audio stream reference alive
      console.log('Speech recognition started with active audio stream');

    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Unable to start voice input. Please check your microphone permissions.');
      setSpeechServiceAvailable(false);
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

          {/* Diagnostic Button - Temporary for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={runFullDiagnostic}
              disabled={disabled || isLoading || diagnosticMode}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50"
              title="🔍 Run comprehensive voice diagnostic"
            >
              🔍
            </button>
          )}

          {/* Extension Check Button */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                console.log('🔍 Checking for potential blockers...');
                
                // Check for common signs of extensions
                const checks = {
                  'Ad Blocker detected': document.querySelector('[id*="adblock"]') !== null,
                  'Plausible blocked': window.location.href.includes('ERR_BLOCKED_BY_CLIENT'),
                  'Canvas fingerprinting': (() => {
                    try {
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      return !ctx;
                    } catch {
                      return true;
                    }
                  })(),
                  'WebRTC blocked': !window.RTCPeerConnection,
                  'Battery API blocked': !navigator.getBattery,
                };
                
                console.log('Extension checks:', checks);
                
                // Try incognito mode suggestion
                toast.info('Try in Incognito/Private mode to bypass extensions', {
                  duration: 10000,
                  description: 'Extensions might be blocking Web Speech API. Test in incognito mode (Cmd+Shift+N)',
                  action: {
                    label: 'Copy instructions',
                    onClick: () => {
                      navigator.clipboard.writeText('1. Open Incognito mode (Cmd+Shift+N)\n2. Navigate to https://127.0.0.1:5001\n3. Test voice input');
                      toast.success('Instructions copied!');
                    }
                  }
                });
              }}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all duration-200"
              title="🔍 Check for blocking extensions"
            >
              🛡️
            </button>
          )}

          {/* Final Working Test Button */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={async () => {
                console.log('🧪 Testing what actually works...');
                
                // Get microphone permission and stream first
                let stream: MediaStream | null = null;
                try {
                  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  console.log('✅ Got microphone stream');
                } catch (e) {
                  console.error('Failed to get microphone:', e);
                  return;
                }
                
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) {
                  console.error('No speech recognition');
                  return;
                }
                
                // Create recognition with absolute minimal config
                const recognition = new SpeechRecognition();
                
                // Set up all event handlers BEFORE setting any properties
                recognition.onstart = () => {
                  console.log('✅ Recognition started');
                  toast.success('Listening... speak now!');
                };
                
                recognition.onaudiostart = () => console.log('🔊 Audio started');
                recognition.onsoundstart = () => console.log('🔈 Sound detected');
                recognition.onspeechstart = () => console.log('🗣️ Speech detected');
                
                recognition.onresult = (event) => {
                  const text = event.results[0][0].transcript;
                  console.log('✅ WORKING! Result:', text);
                  setPrompt(prev => prev + text + ' ');
                  toast.success(`Heard: "${text}"`);
                  // Keep the stream alive
                };
                
                recognition.onerror = (event) => {
                  console.error('❌ Error:', event.error);
                  if (stream) stream.getTracks().forEach(t => t.stop());
                };
                
                recognition.onend = () => {
                  console.log('Recognition ended');
                  if (stream) stream.getTracks().forEach(t => t.stop());
                };
                
                // Now set properties AFTER handlers
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';
                
                // Small delay then start
                setTimeout(() => {
                  try {
                    console.log('Starting recognition...');
                    recognition.start();
                  } catch (e) {
                    console.error('Start failed:', e);
                    if (stream) stream.getTracks().forEach(t => t.stop());
                  }
                }, 100);
              }}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all duration-200"
              title="🧪 Simple speech test"
            >
              🧪
            </button>
          )}

          {/* Microphone Button - Desktop */}
          <button
            onClick={toggleRecording}
            disabled={disabled || isLoading || !speechServiceAvailable || diagnosticMode}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isRecording || diagnosticMode
                ? "bg-error/20 border border-error/40 text-error animate-pulse hover:bg-error/30"
                : speechSupported && speechServiceAvailable
                  ? "bg-on-dark/10 hover:bg-on-dark/20 text-on-dark"
                  : "bg-on-dark/5 text-on-dark/30 cursor-not-allowed"
            )}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
            title={
              diagnosticMode
                ? "Diagnostic mode active"
                : !speechSupported 
                  ? "Speech recognition not supported in this browser" 
                  : !speechServiceAvailable
                    ? googleServiceDown
                      ? "Voice input unavailable: Google Speech Service is down (external issue)"
                      : `Voice input unavailable: ${speechError || 'Service temporarily down'}`
                  : isRecording 
                    ? "Click to stop recording" 
                    : "Click to start voice input"
            }
          >
            {isRecording || diagnosticMode ? (
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
                : diagnosticMode
                  ? "🔍 Running voice diagnostic - check console for details"
                : isRecording
                  ? "Listening... Click microphone to stop"
                  : !speechServiceAvailable
                    ? googleServiceDown
                      ? "Press Enter to send, Shift+Enter for new line (Google Speech Service is down)"
                      : speechError === 'Voice input not available in development'
                        ? "Press Enter to send, Shift+Enter for new line (voice unavailable in dev)"
                        : speechError === 'Voice input temporarily unavailable'
                          ? "Press Enter to send, Shift+Enter for new line (voice temporarily unavailable)"
                          : speechError === 'Microphone access denied'
                            ? "Press Enter to send, Shift+Enter for new line (microphone access needed)"
                            : "Press Enter to send, Shift+Enter for new line (voice input unavailable)"
                    : process.env.NODE_ENV === 'development'
                      ? "Press Enter to send, Shift+Enter for new line, or use voice input (🔍 = diagnostic)"
                      : "Press Enter to send, Shift+Enter for new line, or use voice input"
            }
          </span>
        </div>
      </div>

      {/* Mobile Version - Full Width Like Reference */}
      <div className="lg:hidden flex-shrink-0 px-4 py-3 bg-background/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center gap-3 bg-on-dark/10 rounded-full p-2">
          {/* Diagnostic Button - Mobile (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={runFullDiagnostic}
              disabled={disabled || isLoading || diagnosticMode}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50"
              title="🔍 Run voice diagnostic"
            >
              🔍
            </button>
          )}

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
                ? "Speech recognition not supported in this browser" 
                : !speechServiceAvailable
                  ? `Voice input unavailable: ${speechError || 'Service temporarily down'}`
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