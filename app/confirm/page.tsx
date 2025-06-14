"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type ConfirmationState = 'loading' | 'success' | 'error' | 'invalid'

function ConfirmContent() {
  const [state, setState] = useState<ConfirmationState>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setState('invalid')
        setMessage('Invalid confirmation link. Please check your email for the correct link.')
        return
      }

      try {
        const response = await fetch('/api/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()

        if (response.ok) {
          setState('success')
          setMessage(result.message || 'Your email has been confirmed successfully!')
        } else {
          setState('error')
          setMessage(result.error || 'Failed to confirm email. Please try again.')
        }
      } catch (error) {
        console.error('Confirmation error:', error)
        setState('error')
        setMessage('Network error. Please check your connection and try again.')
      }
    }

    confirmEmail()
  }, [token])

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-4"
          >
            <div className="bg-primary/20 p-4 rounded-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-on-dark">Confirming your email...</h1>
              <p className="text-on-dark-muted">Please wait while we verify your confirmation.</p>
            </div>
          </motion.div>
        )

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="bg-success/20 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-on-dark">Email Confirmed! 🎉</h1>
              <p className="text-on-dark-muted max-w-md">{message}</p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
                <p className="text-primary font-medium text-sm">
                  You're all set! We'll notify you as soon as DuoLog.ai is ready to launch.
                </p>
              </div>
            </div>
            <Button asChild className="bg-gradient-to-r from-primary-600 to-care-600 hover:from-primary-700 hover:to-care-700">
              <Link href="/">Return to Home</Link>
            </Button>
          </motion.div>
        )

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="bg-error/20 p-4 rounded-full">
              <AlertCircle className="w-12 h-12 text-error" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-on-dark">Confirmation Failed</h1>
              <p className="text-on-dark-muted max-w-md">{message}</p>
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 mt-6">
                <p className="text-error font-medium text-sm">
                  If you continue to have issues, please contact support or try signing up again.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary-600 to-care-600 hover:from-primary-700 hover:to-care-700">
                <Link href="/#early-access">Try Again</Link>
              </Button>
            </div>
          </motion.div>
        )

      case 'invalid':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="bg-warning/20 p-4 rounded-full">
              <Mail className="w-12 h-12 text-warning" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-on-dark">Invalid Link</h1>
              <p className="text-on-dark-muted max-w-md">{message}</p>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mt-6">
                <p className="text-warning font-medium text-sm">
                  Please check your email for the correct confirmation link or sign up again.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary-600 to-care-600 hover:from-primary-700 hover:to-care-700">
                <Link href="/#early-access">Sign Up Again</Link>
              </Button>
            </div>
          </motion.div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 mt-16">
      <div className="glass-card p-8 max-w-lg mx-auto">
        {renderContent()}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 mt-16">
      <div className="glass-card p-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <div className="bg-primary/20 p-4 rounded-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-dark">Loading...</h1>
            <p className="text-on-dark-muted">Please wait while we load the confirmation page.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmContent />
    </Suspense>
  )
} 