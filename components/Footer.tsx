"use client"

import { motion } from "framer-motion"
import { Brain } from "lucide-react"

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass-card border-t border-neutral-50/10 mt-20"
    >
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-center">
          {/* Logo & Description */}
          <div className="space-y-4 text-center max-w-md">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold text-on-dark">DuoLog.ai</span>
              </div>
            </div>
            <p className="text-on-dark-muted">
              Two AI minds collaborate to give you the perfect response. Two AI minds, better answers for everything.
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-neutral-50/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-dark-muted text-sm">
            © 2025 DuoLog.ai - Two AI minds. One perfect response.
          </p>
          <div className="flex items-center gap-2 text-on-dark-muted text-sm">
            <span>Powered by</span>
            <Brain className="w-4 h-4 text-primary" />
            <span>&</span>
            <Brain className="w-4 h-4 text-care" />
          </div>
        </div>
      </div>
    </motion.footer>
  )
} 