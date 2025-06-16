"use client"

import type React from "react"

import { motion } from "framer-motion"
import { MessageSquare, RefreshCw, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"


interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: <MessageSquare className="w-6 h-6 text-primary" />,
    title: "AI Pair Programming",
    description: "Watch ChatGPT and Claude refine your prompts through structured conversation",
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-care" />,
    title: "Smarter Refinement",
    description: "3-round collaboration ensures every response is thoroughly considered and optimized",
  },
  {
    icon: <Zap className="w-6 h-6 text-success" />,
    title: "Better Results, Faster",
    description: "Two AI minds, better answers for everything. One prompt, perfect output every time",
  },
]

export default function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
    },
  }

  return (
    <section id="features" className="py-20 px-0 md:px-6">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-on-dark mb-6">How It Works</h2>
          <p className="text-xl text-on-dark max-w-2xl mx-auto">
            Experience the power of collaborative AI that thinks, refines, and delivers exceptional results
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="glass-card p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-neutral-50/10 to-neutral-50/5 group-hover:from-neutral-50/20 group-hover:to-neutral-50/10 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-on-dark group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
              </div>
              <p className="text-on-dark leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <Link href="/chat">
            <Button className="h-14 px-8 bg-gradient-to-r from-primary-600 to-care-600 hover:from-primary-700 hover:to-care-700 text-on-dark font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25">
              Try Free Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-on-dark opacity-75 mt-2">
            3 free conversations • Email signup required and demo users are automatically added to the waitlist.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
