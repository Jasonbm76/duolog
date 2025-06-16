"use client";

import { useState, useEffect } from 'react';
import { Mail, Clock, RefreshCw, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EmailVerificationWaitingProps {
  email: string;
  onResendEmail: () => void;
  onVerificationComplete: () => void;
  className?: string;
}

export default function EmailVerificationWaiting({ 
  email, 
  onResendEmail, 
  onVerificationComplete,
  className 
}: EmailVerificationWaitingProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Start resend cooldown (60 seconds)
  useEffect(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check verification status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsCheckingStatus(true);
        const response = await fetch(`/api/chat/email-usage?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.emailVerified) {
            toast.success('Email verified! You can now start chatting.');
            onVerificationComplete();
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    // Check immediately, then every 10 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [email, onVerificationComplete]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verification email sent!');
        onResendEmail();
        // Restart cooldown
        setResendCooldown(60);
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error('Network error - please try again');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Glass card */}
      <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-on-dark mb-2">
              Check your email
            </h2>
            
            <p className="text-on-dark-muted text-sm leading-relaxed">
              We've sent a verification link to:
            </p>
            
            <p className="font-mono text-on-dark text-sm mt-1 mb-4 break-all">
              {email}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="p-6 pt-0">
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {isCheckingStatus ? (
                  <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Clock className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-on-dark">
                  {isCheckingStatus ? 'Checking verification status...' : 'Waiting for verification'}
                </p>
                <p className="text-xs text-on-dark-muted mt-1">
                  Click the link in your email to verify and start chatting
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-on-dark-muted">
                Check your inbox (and spam folder) for an email from DuoLog
              </p>
            </div>
            
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p className="text-on-dark-muted">
                Click the "Verify Email Address" button in the email
              </p>
            </div>
            
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 bg-warning/10 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-warning">3</span>
              </div>
              <p className="text-on-dark-muted">
                <strong>Stay on this page</strong> - don't navigate away or close this tab
              </p>
            </div>
            
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 bg-success/10 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircle className="w-3 h-3 text-success" />
              </div>
              <p className="text-on-dark-muted">
                After verification, you can close the email tab and start chatting here
              </p>
            </div>
          </div>

          {/* Resend button */}
          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={resendCooldown > 0 || isResending}
              className={cn(
                "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200",
                resendCooldown > 0 || isResending
                  ? "bg-on-dark/5 text-on-dark-muted cursor-not-allowed"
                  : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              )}
            >
              {isResending ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </div>
              ) : resendCooldown > 0 ? (
                `Resend email in ${resendCooldown}s`
              ) : (
                'Resend verification email'
              )}
            </button>
            
            <p className="text-xs text-on-dark-muted text-center">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </div>

        {/* Footer tip */}
        <div className="bg-warning/5 border-t border-warning/10 p-4">
          <div className="flex items-center gap-2 text-warning text-sm">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <p>
              <span className="font-medium">Pro tip:</span> Add noreply@duolog.ai to your contacts to ensure delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}