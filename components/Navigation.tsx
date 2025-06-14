"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Sparkles, Users, Zap, Home } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card backdrop-blur-md bg-neutral-50/5 border border-neutral-50/10 max-w-6xl mx-auto"
      >
        <nav className="px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/logo.svg"
                alt="DuoLog.ai"
                width={150}
                height={40}
                style={{ height: '40px', width: '150px' }}
                className="transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center gap-8">
              {/* Home */}
              <Link href="/" className={`nav-item group ${pathname === '/' ? 'nav-item-active' : ''}`}>
                <Home className="w-4 h-4 transition-colors group-hover:text-primary" />
                <span>Home</span>
              </Link>

              {/* How it Works */}
              <Link href="/how-it-works" className={`nav-item group ${pathname === '/how-it-works' ? 'nav-item-active' : ''}`}>
                <Sparkles className="w-4 h-4 transition-colors group-hover:text-primary" />
                <span>How it Works</span>
              </Link>

              {/* Collaboration */}
              <Link href="/ai-collaboration" className={`nav-item group ${pathname === '/ai-collaboration' ? 'nav-item-active' : ''}`}>
                <Users className="w-4 h-4 transition-colors group-hover:text-care" />
                <span>AI Collaboration</span>
              </Link>

              {/* Try Chat - Primary CTA */}
              <Link href="/chat" className={`nav-item-primary group ${pathname === '/chat' ? 'nav-item-primary-active' : ''}`}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Try Chat</span>
                  <Zap className="w-3 h-3 text-primary/70 transition-colors group-hover:text-primary animate-pulse" />
                </div>
              </Link>
            </div>
          </div>
        </nav>
      </motion.header>
    </div>
  )
}
