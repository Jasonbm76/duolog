"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { validateEmail } from '@/lib/utils/input-validation';
import { AdminAuth } from '@/lib/auth/admin-auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean | null;
    message: string;
  }>({ isValid: null, message: '' });

  const validateEmailOnBlur = (email: string) => {
    if (!email.trim()) {
      setEmailValidation({ isValid: null, message: '' });
      return;
    }
    
    const validation = validateEmail(email);
    if (validation.isValid) {
      setEmailValidation({
        isValid: true,
        message: 'Valid email format'
      });
    } else {
      setEmailValidation({
        isValid: false,
        message: validation.errors[0] || 'Invalid email format'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateEmail(email);
    if (!validation.isValid) {
      toast.error(validation.errors[0] || 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if admin is already verified locally
      if (AdminAuth.isAdminVerifiedLocally(validation.sanitized)) {
        // Skip email verification and create session directly
        const response = await fetch('/api/admin/auth/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: validation.sanitized }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Welcome back! Redirecting to admin panel...');
          router.push('/admin');
          return;
        } else {
          // Fall back to email verification if session creation fails
          console.warn('Failed to create session for verified admin, falling back to email verification');
        }
      }

      // Send verification email
      const response = await fetch('/api/admin/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: validation.sanitized }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        toast.success('Admin verification email sent! Check your inbox.');
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4 mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl font-bold text-on-dark">
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-on-dark-muted">
                We've sent an admin verification link to:
              </p>
              <p className="font-medium text-on-dark bg-white/5 rounded-lg p-3 border border-white/10">
                {email}
              </p>
              
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-warning text-sm font-medium mb-2">
                  ⚠️ Important Instructions
                </p>
                <ul className="text-on-dark-muted text-sm text-left space-y-1">
                  <li>• Click the link in the email to access admin panel</li>
                  <li>• Keep this tab open - you'll be redirected here after verification</li>
                  <li>• Do NOT navigate away or close this page</li>
                  <li>• Link expires in 30 minutes for security</li>
                </ul>
              </div>
              
              <p className="text-xs text-on-dark-muted">
                After clicking the email link, you'll be automatically redirected to the admin dashboard.
              </p>
              
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full"
                >
                  Send to Different Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-on-dark">
              Admin Access
            </CardTitle>
            <p className="text-on-dark-muted mt-2">
              Enter your admin email to receive a secure login link
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-on-dark-muted">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-on-dark-muted" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => validateEmailOnBlur(e.target.value)}
                    placeholder="your-admin-email@domain.com"
                    className={`pl-10 bg-white/5 border-white/10 text-on-dark placeholder-on-dark-muted focus:border-primary/50 focus:ring-primary/50 ${
                      emailValidation.isValid === true && 'border-success/50 pr-10'
                    } ${
                      emailValidation.isValid === false && 'border-error/50 pr-10'
                    }`}
                    disabled={isSubmitting}
                    autoFocus
                    required
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
                          <CheckCircle className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-error"
                        >
                          <AlertCircle className="w-5 h-5" />
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
                      className={`text-xs px-3 py-2 rounded ${
                        emailValidation.isValid 
                          ? 'text-success bg-success/10 border border-success/20' 
                          : 'text-error bg-error/10 border border-error/20'
                      }`}
                    >
                      {emailValidation.message}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim() || emailValidation.isValid === false}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Verification...
                  </div>
                ) : (
                  'Send Admin Login Link'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-on-dark-muted">
                <Shield className="w-4 h-4" />
                <span>
                  Only authorized admin emails can access this area
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}