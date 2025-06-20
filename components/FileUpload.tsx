'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize, getFileTypeIcon, type FileUploadResult } from '@/lib/supabase-storage';

interface FileUploadProps {
  onFileSelect: (file: File, uploadResult: FileUploadResult) => void;
  onFileRemove: () => void;
  selectedFile?: File;
  uploadResult?: FileUploadResult;
  isUploading?: boolean;
  disabled?: boolean;
  className?: string;
}

interface DragState {
  isDragOver: boolean;
  isDragActive: boolean;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  uploadResult,
  isUploading = false,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragOver: false,
    isDragActive: false
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Simulate upload progress (since Supabase doesn't provide real progress)
  useEffect(() => {
    if (isUploading) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setUploadProgress(0);
    }
  }, [isUploading]);

  // Complete progress when upload finishes
  useEffect(() => {
    if (!isUploading && uploadResult?.success) {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [isUploading, uploadResult]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    const file = files[0];
    const validation = validateFile(file);

    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    // Don't show toast here - let PromptInput handle the success message
    // const fileSize = formatFileSize(file.size);
    // const fileIcon = getFileTypeIcon(file.type, file.name);
    // toast.success(`${fileIcon} File selected: ${file.name} (${fileSize})`);

    onFileSelect(file, { success: true });
  }, [onFileSelect, disabled]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragState({
        isDragOver: true,
        isDragActive: true
      });
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setDragState({
        isDragOver: false,
        isDragActive: false
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current = 0;
    setDragState({
      isDragOver: false,
      isDragActive: false
    });

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleUploadClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleRemoveFile = useCallback(() => {
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileRemove]);

  // Render selected file preview
  const renderFilePreview = () => {
    if (!selectedFile) return null;

    const fileIcon = getFileTypeIcon(selectedFile.type, selectedFile.name);
    const fileSize = formatFileSize(selectedFile.size);
    const isError = uploadResult && !uploadResult.success;
    const isSuccess = uploadResult?.success && !isUploading;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-3 p-3 bg-background/50 backdrop-blur-sm border border-primary/20 rounded-lg"
      >
        <div className="flex-shrink-0 text-2xl">
          {fileIcon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-on-dark truncate">
              {selectedFile.name}
            </p>
            {isSuccess && (
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            )}
            {isError && (
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
            )}
            {isUploading && (
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-on-dark-muted">
            {fileSize}
          </p>

          {isUploading && (
            <div className="mt-2">
              <Progress value={uploadProgress} className="h-1" />
              <p className="text-xs text-on-dark-muted mt-1">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {isError && (
            <p className="text-xs text-error mt-1">
              {uploadResult.error}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveFile}
          disabled={isUploading}
          className="flex-shrink-0 h-8 w-8 p-0 hover:bg-error/10 hover:text-error"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInput}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.js,.ts,.json,.html,.css,.py"
        className="hidden"
        disabled={disabled}
      />

      {/* File upload button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUploadClick}
        disabled={disabled || isUploading}
        className={cn(
          "h-8 w-8 p-0 transition-colors relative bg-transparent hover:bg-transparent",
          selectedFile 
            ? "text-white" 
            : "text-white hover:text-white/80"
        )}
        title={selectedFile ? `File attached: ${selectedFile.name}` : "Attach document"}
      >
        <Paperclip className="w-4 h-4" />
        {selectedFile && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
        )}
      </Button>

      {/* Drag overlay */}
      <AnimatePresence>
        {dragState.isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background/95 backdrop-blur-md border-2 border-dashed border-primary rounded-xl p-8 text-center max-w-md mx-4"
              >
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-on-dark mb-2">
                  Drop your file here
                </h3>
                <p className="text-sm text-on-dark-muted">
                  Support for PDFs, images, text files, and code files
                </p>
                <p className="text-xs text-on-dark-muted mt-1">
                  Maximum file size: 10MB
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File preview - hidden to keep chat layout clean */}
      {/* File status shown via toast notifications instead */}
    </div>
  );
}