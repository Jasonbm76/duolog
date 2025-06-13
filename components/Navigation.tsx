"use client"

import { motion } from "framer-motion"

export default function Navigation() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card backdrop-blur-md bg-white/5 border-b border-white/10"
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🧠</div>
            <span className="text-xl font-bold text-white">DuoLog</span>
            <span className="text-sm text-blue-400 font-medium">.ai</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#early-access" className="text-gray-300 hover:text-white transition-colors">
              Early Access
            </a>
          </div>
        </div>
      </nav>
    </motion.header>
  )
}
