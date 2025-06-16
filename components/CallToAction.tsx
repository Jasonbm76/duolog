"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Mail } from "lucide-react"
import Link from "next/link"
import EmailForm from "./EmailForm"

export default function CallToAction() {
  const [showEmailForm, setShowEmailForm] = useState(false)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  }

  if (showEmailForm) {
    return (
      <motion.div variants={fadeInUp} className="pt-8">
        <EmailForm />
        <div className="text-center mt-4">
          <button
            onClick={() => setShowEmailForm(false)}
            className="text-on-dark hover:text-primary transition-colors text-sm underline"
          >
            ← Back to options
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={fadeInUp} className="pt-8 space-y-6">
      {/* Main CTA - Try Now */}
      <div className="glass-card p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-on-dark">
            Try the Free Demo
          </h3>
          <p className="text-on-dark-muted text-sm pb-3">
            Experience AI collaboration with 3 free conversations.
          </p>
          <Link href="/chat">
            <Button className="w-full h-12 bg-gradient-to-r from-primary-600 to-care-600 hover:from-primary-700 hover:to-care-700 text-on-dark font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25">
              <Sparkles className="w-5 h-5 mr-2" />
              Try Free Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-on-dark opacity-75">
            Quick email verification • 3 conversations included • Email signup required and demo users are automatically added to the waitlist.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 max-w-md mx-auto">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-on-dark/20"></div>
        <span className="text-on-dark-muted text-sm">or</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-on-dark/20"></div>
      </div>

      {/* Secondary CTA - Full Product Access */}
      <div className="glass-card p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-on-dark">
            Want unlimited access?
          </h3>
          <p className="text-on-dark-muted text-sm">
            Join the waitlist for our full product launch with <br />paid tiers & unlimited conversations. <br />Demo users are automatically added.
          </p>
          <Button
            onClick={() => setShowEmailForm(true)}
            variant="outline"
            className="w-full h-12 border-on-dark/20 text-on-dark hover:bg-on-dark/10 transition-colors"
          >
            <Mail className="w-5 h-5 mr-2" />
            Join Waitlist
          </Button>
        </div>
      </div>

      {/* Feature hint */}
      <div className="text-center max-w-lg mx-auto">
        <p className="text-on-dark-muted text-sm">
          Try example prompts like "Help me write a product launch email" or "Fix React memory leaks"
        </p>
      </div>
    </motion.div>
  )
}