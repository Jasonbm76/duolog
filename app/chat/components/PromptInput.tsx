"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Loader2, Square, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import type { FileUploadResult } from '@/lib/supabase-storage';

// Web Speech API TypeScript declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface PromptInputProps {
  onSubmit: (prompt: string, file?: File, fileUploadResult?: FileUploadResult) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  selectedTone?: string;
  onToneChange?: (tone: string) => void;
  toneOptions?: Array<{ value: string; label: string; description: string }>;
  email?: string;
  sessionId?: string;
  onEmailRequired?: () => void;
}

export default function PromptInput({ 
  onSubmit, 
  onStop,
  isLoading = false, 
  placeholder = "Enter your prompt...",
  disabled = false,
  className,
  selectedTone = 'conversational',
  onToneChange,
  toneOptions = [],
  email,
  sessionId,
  onEmailRequired
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [fileUploadResult, setFileUploadResult] = useState<FileUploadResult | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  // Initialize client-side state first (hydration-safe)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize voice recording with Whisper API (only after client hydration)
  useEffect(() => {
    if (isClient) {
      console.log('Initializing voice recording with Whisper API...');
      
      // Check for MediaRecorder support
      if (typeof MediaRecorder !== 'undefined') {
        setSpeechSupported(true);
        console.log('✅ MediaRecorder available - voice recording ready');
      } else {
        setSpeechSupported(false);
        console.warn('❌ MediaRecorder not supported in this browser');
      }
    }
  }, [isClient]);

  // Audio recording for Whisper API
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleRecording = useCallback(async () => {
    console.log('Toggle recording clicked', { 
      speechSupported, 
      isRecording
    });

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Start recording
    try {
      console.log('Getting microphone access for recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimal for Whisper
        } 
      });

      console.log('✅ Microphone access granted');

      // Clear previous audio chunks
      audioChunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        setIsRecording(false);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size > 0) {
          await processAudioWithWhisper(audioBlob);
        } else {
          toast.error('No audio recorded. Please try again.');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
        toast.error('Recording error. Please try again.');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording... Click the microphone again to stop');

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Microphone access is required for voice input');
    }
  }, [isRecording]);

  const processAudioWithWhisper = async (audioBlob: Blob) => {
    try {
      console.log('Sending audio to Whisper API...');
      toast.info('Processing speech...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.transcript && result.transcript.trim()) {
        console.log('✅ Transcription successful:', result.transcript);
        setPrompt(prevPrompt => {
          const newPrompt = prevPrompt + (prevPrompt ? ' ' : '') + result.transcript.trim() + ' ';
          return newPrompt;
        });
        toast.success(`Heard: "${result.transcript}"`);
      } else {
        toast.warning('No speech detected. Please try again.');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process speech. Please try again or type your message.');
    }
  };

  // File upload handlers
  const handleFileSelect = async (file: File, uploadResult: FileUploadResult) => {
    setSelectedFile(file);
    setFileUploadResult(uploadResult);
    
    if (uploadResult.success) {
      // File will be uploaded when message is sent
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(undefined);
    setFileUploadResult(undefined);
  };

  const handleSubmit = async () => {
    if ((!prompt.trim() && !selectedFile) || isLoading || disabled) {
      return;
    }

    // Check if we need email for file upload or message sending
    if (!email && (selectedFile || prompt.trim())) {
      onEmailRequired?.();
      return;
    }

    // If there's a file, upload it first
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (email) formData.append('email', email);
        if (sessionId) formData.append('sessionId', sessionId);
        

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const uploadResult = await response.json();
        setFileUploadResult(uploadResult);
        
        // Show upload success
        toast.success(`✅ File uploaded successfully`);
        
        // Submit with file data
        onSubmit(prompt.trim(), selectedFile, uploadResult);
        
      } catch (error) {
        console.error('File upload error:', error);
        toast.error('Failed to upload file. Please try again.');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else {
      // Submit without file
      onSubmit(prompt.trim());
    }

    // Clear form
    setPrompt('');
    setSelectedFile(undefined);
    setFileUploadResult(undefined);
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

  const canSubmit = (prompt.trim().length > 0 || selectedFile) && !isLoading && !disabled && !isUploading;

  return (
    <>
      {/* Desktop Version */}
      <div className={cn("hidden lg:block flex-shrink-0", className?.includes('m-0') ? "" : "glass-card p-4 mt-6", className)}>
        <div className="flex gap-3 items-center">
          {/* Microphone Button - Desktop (moved to left) */}
          {isClient && (
            <div className="relative">
              <button
                onClick={toggleRecording}
                disabled={disabled || isLoading || !speechSupported}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 relative",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isRecording
                    ? "bg-error/20 border border-error/40 text-error animate-pulse hover:bg-error/30"
                    : speechSupported
                      ? "bg-on-dark/10 hover:bg-on-dark/20 text-on-dark"
                      : "bg-on-dark/5 text-on-dark/30 cursor-not-allowed"
                )}
                aria-label={isRecording ? "Stop AI voice recording" : "Start AI voice recording"}
                title={
                  isRecording 
                    ? "AI is cleaning up your speech - click to stop and process" 
                    : speechSupported
                      ? "AI-powered voice input - your speech will be cleaned up and refined automatically"
                      : "Voice recording not supported in this browser"
                }
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                
              </button>
            </div>
          )}

          {/* Textarea with embedded file upload */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(
                "w-full resize-none border border-on-dark/20 rounded-xl px-4 py-3 pr-12",
                "text-on-dark placeholder-on-dark/40 bg-neutral-900/50 backdrop-blur-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                "min-h-[80px] max-h-48 leading-6",
                "disabled:bg-on-dark/5 disabled:text-on-dark disabled:cursor-not-allowed",
                "transition-colors scrollbar-hide overflow-hidden"
              )}
              rows={2}
            />
            
            {/* File Upload Button - Inside textarea on the right, vertically centered */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                uploadResult={fileUploadResult}
                isUploading={isUploading}
                disabled={disabled || isLoading}
              />
            </div>
            
            {/* Character count for longer prompts */}
            {prompt.length > 100 && (
              <div className="absolute -top-6 right-0 text-xs text-on-dark">
                {prompt.length} characters
              </div>
            )}
          </div>

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

        {/* Helper Text & Tone Selector - Desktop only */}
        <div className="flex justify-between items-center mt-2 text-xs font-semibold text-on-dark/50 text-shadow-sm">
          <span>
            {disabled 
              ? "Conversation is complete"
              : isLoading 
                ? "AI is processing..." 
                : isRecording
                  ? "Recording... Click microphone to stop and transcribe"
                  : !isClient || !speechSupported
                    ? "Press Enter to send, Shift+Enter for new line"
                    : "Press Enter to send, Shift+Enter for new line, or record voice input"
            }
          </span>
          
          {/* Tone Selector - Desktop only */}
          {toneOptions.length > 0 && onToneChange && (
            <div className="flex items-center gap-2">
              <span className="text-on-dark/40 text-xs">Tone:</span>
              <select
                value={selectedTone}
                onChange={(e) => onToneChange(e.target.value)}
                className="bg-on-dark/10 border border-on-dark/20 rounded-md px-2 py-1 text-xs text-on-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                disabled={disabled || isLoading}
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Version - Full Width Like Reference */}
      <div className="lg:hidden flex-shrink-0 px-4 py-3">
        <div className="flex items-center gap-3 bg-on-dark/10 rounded-full p-2">

          {/* Microphone Button - Mobile (moved to left) */}
          {isClient && (
            <div className="relative">
              <button
                onClick={toggleRecording}
                disabled={disabled || isLoading || !speechSupported}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 relative",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isRecording
                    ? "bg-error/20 text-error animate-pulse hover:bg-error/30"
                    : speechSupported
                      ? "hover:bg-on-dark/20 text-on-dark"
                      : "text-on-dark/30 cursor-not-allowed"
                )}
                aria-label={isRecording ? "Stop AI voice recording" : "Start AI voice recording"}
                title={
                  isRecording 
                    ? "AI is cleaning up your speech - tap to stop and process" 
                    : speechSupported
                      ? "AI-powered voice input - your speech will be cleaned up and refined automatically"
                      : "Voice recording not supported in this browser"
                }
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                
              </button>
            </div>
          )}

          {/* Input Field with embedded file upload */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(
                "w-full resize-none bg-transparent border-0 outline-0 px-2 py-2 pr-10",
                "text-on-dark placeholder-on-dark/60 text-base leading-6",
                "disabled:text-on-dark disabled:cursor-not-allowed",
                "scrollbar-hide overflow-hidden"
              )}
              rows={1}
              style={{ height: '40px', maxHeight: '40px' }}
            />
            
            {/* File Upload Button - Inside textarea on the right, vertically centered */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                uploadResult={fileUploadResult}
                isUploading={isUploading}
                disabled={disabled || isLoading}
              />
            </div>
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