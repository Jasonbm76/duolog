"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, CheckCircle } from "lucide-react"

interface FormData {
  email: string
}

export default function EmailForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    //console.log("Email captured:", data.email)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <motion.div
        className="glass-card p-8 max-w-md mx-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center space-x-3">
          <CheckCircle className="w-6 h-6 text-success" />
          <p className="text-on-dark font-medium">Thanks! We'll be in touch soon.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="glass-card p-8 max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-on-dark" />
          <Input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            type="email"
            placeholder="Enter your email for early access"
            className="pl-10 bg-neutral-50/10 border-neutral-50/20 text-on-dark placeholder:text-on-dark focus:border-primary focus:ring-primary/20"
          />
          {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full glow-button bg-primary hover:bg-primary/90 text-on-dark font-semibold py-3 px-6 rounded-lg transition-all duration-300"
        >
          {isSubmitting ? "Joining..." : "Get Early Access"}
        </Button>
      </form>
    </div>
  )
}
