"use client";

import { useState } from 'react';
import { X, Mail, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validateEmail } from '@/lib/utils/input-validation';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onSubmit: (email: string) => void;
  onClose: () => void;
  isExistingUser?: boolean;
  onVerificationRequired?: (email: string) => void;
}

// Removed - using comprehensive validation from input-validation.ts

export default function EmailCaptureModal({ 
  isOpen, 
  onSubmit, 
  onClose,
  isExistingUser = false,
  onVerificationRequired
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean | null
    message: string
  }>({ isValid: null, message: '' });

  const validateEmailOnBlur = (email: string) => {
    if (!email.trim()) {
      setEmailValidation({ isValid: null, message: '' })
      return
    }
    
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const isValidFormat = emailRegex.test(email)
    
    // Allow developer@test.local for development
    const isDeveloperTestEmail = email === 'developer@test.local'
    
    // Additional checks for common issues
    const commonIssues = [
      { check: email.includes('+'), message: 'Email addresses with + characters are not allowed' },
      { check: email.includes('..'), message: 'Email cannot contain consecutive dots' },
      { check: email.startsWith('.') || email.endsWith('.'), message: 'Email cannot start or end with a dot' },
      { check: email.includes('@.') || email.includes('.@'), message: 'Invalid format around @' },
      { check: email.split('@').length !== 2, message: 'Email must contain exactly one @' },
      { check: email.length > 254, message: 'Email is too long' },
      { check: !email.split('@')[1]?.includes('.') && !isDeveloperTestEmail, message: 'Domain must contain a dot' }
    ]
    
    const issue = commonIssues.find(({ check }) => check)
    
    if (!isValidFormat && !isDeveloperTestEmail || issue) {
      setEmailValidation({
        isValid: false,
        message: issue?.message || 'Please enter a valid email address'
      })
    } else {
      setEmailValidation({
        isValid: true,
        message: isDeveloperTestEmail ? 'Developer test email' : 'Looks good!'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive email validation
    const emailValidation = validateEmail(email);
    
    if (!emailValidation.isValid) {
      // Show first error message
      toast.error(emailValidation.errors[0] || 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanEmail = emailValidation.sanitized;
      
      // Don't store email in localStorage - users need new email for more conversations
      
      // Send verification email
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      // Handle already verified case first (even with 400 status)
      if (data.alreadyVerified) {
        // Email already verified, proceed directly
        toast.success('Email already verified! Starting conversation...');
        await onSubmit(cleanEmail);
        return; // Exit early since onSubmit handles closing the modal
      } else if (data.success) {
        if (data.devBypass) {
          // Development bypass - proceed directly
          toast.success('Development bypass: Email auto-verified');
          await onSubmit(cleanEmail);
          return; // Exit early since onSubmit handles closing the modal
        } else {
          // Production flow - show verification waiting
          toast.success('Verification email sent! Check your inbox.');
          onVerificationRequired?.(cleanEmail);
        }
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Email submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md mx-auto"
          >
            {/* Glass card */}
            <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-6 pb-0">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-on-dark-muted hover:text-on-dark transition-colors rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-on-dark mb-2">
                    {isExistingUser ? 'Secure Your Progress' : 'Start Your Free AI Collaboration'}
                  </h2>
                  
                  <p className="text-on-dark-muted text-sm leading-relaxed mb-6">
                    {isExistingUser 
                      ? 'Enter your email to continue tracking your conversation usage across devices'
                      : 'Get 3 free conversations to experience Claude + GPT-4 working together'
                    }
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-on-dark-muted" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={(e) => validateEmailOnBlur(e.target.value)}
                      placeholder="Enter your email address"
                      className={cn(
                        "w-full pl-10 py-3 bg-white/5 border border-white/10 rounded-lg",
                        "text-on-dark placeholder-on-dark-muted",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                        "transition-all duration-200",
                        emailValidation.isValid === true && "border-success/50 pr-10",
                        emailValidation.isValid === false && "border-error/50 pr-10",
                        emailValidation.isValid === null && "pr-4"
                      )}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    
                    {/* Validation icon */}
                    {emailValidation.isValid !== null && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {emailValidation.isValid ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-success"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-error"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Validation message */}
                  <AnimatePresence>
                    {emailValidation.message && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "text-xs px-3 py-1 rounded",
                          emailValidation.isValid 
                            ? "text-success bg-success/10" 
                            : "text-error bg-error/10"
                        )}
                      >
                        {emailValidation.message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email.trim() || emailValidation.isValid === false}
                    className={cn(
                      "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200",
                      "bg-primary hover:bg-primary/90 text-white",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent"
                    )}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Setting up...
                      </div>
                    ) : (
                      'Start Free Conversations'
                    )}
                  </button>
                </form>

                {/* Benefits */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="text-on-dark-muted">3 free AI collaboration sessions</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="text-on-dark-muted">Works across all your devices</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="text-on-dark-muted">No spam, just conversation history</span>
                    </div>
                  </div>
                </div>

                {/* Privacy note */}
                <p className="mt-4 text-xs text-on-dark-muted text-center leading-relaxed">
                  We respect your privacy. Your email is only used for conversation tracking and occasional product updates.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}