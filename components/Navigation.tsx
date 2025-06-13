"use client"

import { motion } from "framer-motion"
import Image from "next/image"


export default function Navigation() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card backdrop-blur-md bg-neutral-50/5 border-b border-neutral-50/10"
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Image
            src="/logo.svg"
            alt="DuoLog.ai"
            width={150}
            height={40}
            style={{ height: '40px', width: '150px' }}
          />

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-on-dark hover:text-on-dark transition-colors">
              Features
            </a>
            <a href="#early-access" className="text-on-dark hover:text-on-dark transition-colors">
              Early Access
            </a>
          </div>
        </div>
      </nav>
    </motion.header>
  )
}
