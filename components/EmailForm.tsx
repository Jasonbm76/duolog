"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, CheckCircle, AlertCircle, Check } from "lucide-react"
import { toast } from "sonner"
import { trackEvent, trackFormField } from "@/lib/analytics"

interface EmailFormData {
  email: string
}

export default function EmailForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean | null
    message: string
  }>({ isValid: null, message: '' })
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>()
  
  const validateEmailOnBlur = (email: string) => {
    if (!email.trim()) {
      setEmailValidation({ isValid: null, message: '' })
      return
    }
    
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const isValidFormat = emailRegex.test(email)
    
    // Additional checks for common issues
    const commonIssues = [
      { check: email.includes('..'), message: 'Email cannot contain consecutive dots' },
      { check: email.startsWith('.') || email.endsWith('.'), message: 'Email cannot start or end with a dot' },
      { check: email.includes('@.') || email.includes('.@'), message: 'Invalid format around @' },
      { check: email.split('@').length !== 2, message: 'Email must contain exactly one @' },
      { check: email.length > 254, message: 'Email is too long' },
      { check: !email.split('@')[1]?.includes('.'), message: 'Domain must contain a dot' }
    ]
    
    const issue = commonIssues.find(({ check }) => check)
    
    if (!isValidFormat || issue) {
      setEmailValidation({
        isValid: false,
        message: issue?.message || 'Please enter a valid email address'
      })
    } else {
      setEmailValidation({
        isValid: true,
        message: 'Looks good!'
      })
    }
  }

  const onSubmit = async (data: EmailFormData) => {
    setErrorMessage(null)
    
    // Track submit attempt
    trackEvent('Email Form Submit', {
      email_domain: data.email.split('@')[1] || 'unknown'
    })
    
    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Too many requests. Please try again later.')
          setErrorMessage('Too many requests. Please try again later.')
          // Track rate limit error
          trackEvent('Email Form Error', {
            error_type: 'rate_limit'
          })
        } else if (response.status === 409) {
          toast.info('This email is already registered!')
          setErrorMessage('This email is already registered!')
          // Track duplicate email
          trackEvent('Email Form Error', {
            error_type: 'duplicate_email'
          })
        } else {
          toast.error(result.error || 'Something went wrong')
          setErrorMessage(result.error || 'Something went wrong')
          // Track generic error
          trackEvent('Email Form Error', {
            error_type: 'generic_error'
          })
        }
        return
      }
      
      toast.success('Success! Check your email for confirmation.')
      setIsSubmitted(true)
      
      // Track successful submission
      trackEvent('Email Form Success', {
        email_domain: data.email.split('@')[1] || 'unknown'
      })
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Network error. Please try again.')
      setErrorMessage('Network error. Please try again.')
      
      // Track network error
      trackEvent('Email Form Error', {
        error_type: 'network_error'
      })
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-md mx-auto"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-success/20 p-3 rounded-full">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-on-dark">You're on the list!</h3>
            <p className="text-on-dark">Check your email to confirm your spot for early access to DuoLog.ai</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 max-w-md mx-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
            <p className="text-error text-sm">{errorMessage}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-dark-muted w-5 h-5" />
            {/* Validation icon */}
            {emailValidation.isValid !== null && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {emailValidation.isValid ? (
                  <Check className="w-5 h-5 text-success" aria-label="Valid email" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-error" aria-label="Invalid email" />
                )}
              </div>
            )}
            <Input
              {...register("email", {
                required: "Email is required",
                onBlur: (e) => {
                  validateEmailOnBlur(e.target.value)
                  trackFormField('blur', !!e.target.value)
                }
              })}
              type="email"
              placeholder="Enter your email for early access"
              aria-invalid={emailValidation.isValid === false}
              aria-describedby="email-validation-message"
              onFocus={() => trackFormField('focus')}
              className={`pl-12 ${emailValidation.isValid !== null ? 'pr-12' : ''} h-12 bg-neutral-800/40 border-neutral-600/50 text-on-dark placeholder:text-on-dark-muted focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors ${
                emailValidation.isValid === false ? 'border-error/70 focus:border-error focus:ring-error/30' : 
                emailValidation.isValid === true ? 'border-success/70 focus:border-success focus:ring-success/30' : ''
              }`}
              disabled={isSubmitting}
            />
          </div>
          
          {/* Custom validation message */}
          <AnimatePresence>
            {emailValidation.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                id="email-validation-message"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                  emailValidation.isValid ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'
                }`}
                role={emailValidation.isValid ? 'status' : 'alert'}
                aria-live="polite"
              >
                {emailValidation.isValid ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{emailValidation.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* React Hook Form validation (backup) */}
          {errors.email && !emailValidation.message && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-error/10 text-error border border-error/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={() => {
            // Track button click separately from form submission
            trackEvent('Email Form Button Click')
          }}
          className="w-full h-12 bg-gradient-to-r from-primary-600 to-care-600 hover:from-primary-700 hover:to-care-700 text-on-dark font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
        >
          {isSubmitting ? "Joining..." : "Get Early Access"}
        </Button>
      </form>
    </motion.div>
  )
}
