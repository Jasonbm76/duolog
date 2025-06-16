"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setEmail(data.email);
        toast.success('Email verified successfully!');
      } else {
        setStatus('error');
        setError(data.error || 'Verification failed');
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setError('Network error during verification');
      toast.error('Network error during verification');
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-success" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-error" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying your email...';
      case 'success':
        return 'Email verified!';
      case 'error':
        return 'Verification failed';
    }
  };

  const getMessage = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we verify your email address.';
      case 'success':
        return `Welcome to DuoLog! Your email ${email} has been verified successfully.`;
      case 'error':
        return error || 'The verification link is invalid or has expired.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        {/* Glass card */}
        <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-on-dark mb-4">
            {getTitle()}
          </h1>

          {/* Message */}
          <p className="text-on-dark-muted mb-6 leading-relaxed">
            {getMessage()}
          </p>

          {/* Actions */}
          {status === 'success' && (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-warning/10 border border-warning/20 rounded-lg"
              >
                <div className="text-warning text-sm font-medium mb-2">
                  ✅ Next Steps
                </div>
                <ul className="text-on-dark-muted text-sm text-left space-y-1">
                  <li>• Go back to your original DuoLog tab/window</li>
                  <li>• Your chat should now work without asking for email</li>
                  <li>• You can close this verification tab</li>
                  <li>• Start your AI collaboration session!</li>
                </ul>
              </motion.div>

              <div className="text-xs text-on-dark-muted">
                Your email verification is complete across all browser tabs.
              </div>

              <button
                onClick={() => window.close()}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
              >
                Close This Tab
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                Try requesting a new verification email or contact support if the problem persists.
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full py-3 px-4 bg-on-dark/10 hover:bg-on-dark/20 text-on-dark border border-on-dark/20 rounded-lg font-medium transition-colors"
              >
                Go to DuoLog
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div className="space-y-2">
              <div className="h-1 bg-on-dark/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
              <p className="text-xs text-on-dark-muted">This should only take a moment...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-on-dark-muted">
            Questions? Visit{' '}
            <a href="/" className="text-primary hover:underline">
              duolog.ai
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}