"use client"

import { motion } from "framer-motion"
import { Brain, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Footer() {
  return (
    <div className="mt-20 p-4">
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-card border border-neutral-50/10 max-w-6xl mx-auto"
      >
        <div className="px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Logo & Description */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-8 h-8 text-primary" />
                  <span className="text-xl font-bold text-on-dark">DuoLog.ai</span>
                </div>
              </div>
              <p className="text-on-dark-muted text-sm">
                Two AI minds collaborate to give you the perfect response. Better answers for everything.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4 md:col-span-1">
              <h3 className="font-semibold text-on-dark">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/how-it-works" className="text-on-dark-muted hover:text-primary transition-colors text-sm">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/ai-collaboration" className="text-on-dark-muted hover:text-primary transition-colors text-sm">
                    AI Collaboration
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="text-on-dark-muted hover:text-primary transition-colors text-sm">
                    Try Chat
                  </Link>
                </li>
              </ul>
            </div>

            {/* CTA Section */}
            <div className="space-y-4 md:col-span-1">
              <h3 className="font-semibold text-on-dark">Get Started</h3>
              <p className="text-on-dark-muted text-sm">
                Experience the power of AI collaboration today.
              </p>
              <Link href="/chat">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-transparent border-on-dark/20 text-on-dark hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Try AI Collaboration
                </Button>
              </Link>
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
    </div>
  )
} 