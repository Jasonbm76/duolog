"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AdminAuth } from '@/lib/auth/admin-auth';

type VerificationState = 'verifying' | 'success' | 'error' | 'expired';

export default function AdminVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [state, setState] = useState<VerificationState>('verifying');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setError('No verification token provided');
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setState('success');
        setEmail(data.email);
        
        // Mark admin as verified locally to bypass future email verification
        if (data.email) {
          AdminAuth.markAdminVerifiedLocally(data.email);
        }
        
        toast.success('Admin access granted! Redirecting...');
        
        // Redirect to admin dashboard after a brief delay
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setState('error');
        setError(data.error || 'Verification failed');
        
        if (data.error?.includes('expired')) {
          setState('expired');
        }
      }
    } catch (error) {
      console.error('Admin verification error:', error);
      setState('error');
      setError('Network error during verification');
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'verifying':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-on-dark mb-4">
              Verifying Admin Access
            </CardTitle>
            <p className="text-on-dark-muted">
              Please wait while we verify your admin credentials...
            </p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4 mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl font-bold text-on-dark mb-4">
              Admin Access Granted
            </CardTitle>
            <p className="text-on-dark-muted mb-4">
              Welcome back, admin! You have been successfully verified.
            </p>
            {email && (
              <p className="font-medium text-on-dark bg-white/5 rounded-lg p-3 border border-white/10 mb-4">
                {email}
              </p>
            )}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
              <p className="text-warning text-sm font-medium">
                🔒 Admin Session Active
              </p>
              <p className="text-on-dark-muted text-sm mt-1">
                Your admin session will remain active across all browser tabs until you logout or it expires in 7 days.
              </p>
            </div>
            <p className="text-sm text-on-dark-muted">
              Redirecting you to the admin dashboard...
            </p>
          </motion.div>
        );

      case 'expired':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/10 rounded-full mb-4 mx-auto">
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
            <CardTitle className="text-2xl font-bold text-on-dark mb-4">
              Verification Link Expired
            </CardTitle>
            <p className="text-on-dark-muted mb-6">
              This admin verification link has expired for security reasons. Admin links are only valid for 30 minutes.
            </p>
            <Button
              onClick={() => router.push('/admin/login')}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              Request New Admin Link
            </Button>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-error/10 rounded-full mb-4 mx-auto">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <CardTitle className="text-2xl font-bold text-on-dark mb-4">
              Verification Failed
            </CardTitle>
            <p className="text-on-dark-muted mb-4">
              {error || 'Unable to verify admin access. The link may be invalid or expired.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/admin/login')}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                Request New Admin Link
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary mr-2" />
              <span className="text-sm font-medium text-primary">ADMIN VERIFICATION</span>
            </div>
          </CardHeader>
          
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}