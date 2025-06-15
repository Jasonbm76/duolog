"use client";

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Sparkles, Users, Zap, Home, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import StatusButton from "@/components/StatusButton"

interface UsageStatus {
  used: number;
  limit: number;
  hasOwnKeys: boolean;
}

interface ChatNavigationProps {
  conversationId?: string;
  isMockMode: boolean;
  usageStatus: UsageStatus | null;
  sessionId: string;
  onSettingsClick: () => void;
  onStatusDropdownToggle?: (isOpen: boolean) => void;
}

export default function ChatNavigation({
  conversationId,
  isMockMode,
  usageStatus,
  sessionId,
  onSettingsClick,
  onStatusDropdownToggle
}: ChatNavigationProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/how-it-works", label: "How it Works", icon: Sparkles },
    { href: "/ai-collaboration", label: "AI Collaboration", icon: Users },
  ]

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card backdrop-blur-md bg-neutral-50/5 border border-neutral-50/10 max-w-6xl mx-auto"
        >
          <nav className="px-4 sm:px-8 py-5">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center group">
                <Image
                  src="/logo.svg"
                  alt="DuoLog.ai"
                  width={150}
                  height={40}
                  style={{ height: '40px', width: '150px' }}
                  className="transition-transform group-hover:scale-105 max-w-[120px] sm:max-w-[150px]"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-4">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link 
                    key={href}
                    href={href} 
                    className={`nav-item group ${pathname === href ? 'nav-item-active' : ''}`}
                  >
                    <Icon className="w-4 h-4 transition-colors group-hover:text-primary" />
                    <span>{label}</span>
                  </Link>
                ))}

                {/* Try Chat - Primary CTA */}
                <Link href="/chat" className={`nav-item-primary group ${pathname === '/chat' ? 'nav-item-primary-active' : ''}`}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span>Try Chat</span>
                    <Zap className="w-3 h-3 text-primary/70 transition-colors group-hover:text-primary animate-pulse" />
                  </div>
                </Link>

                {/* Status Button */}
                <StatusButton 
                  conversationId={conversationId}
                  isMockMode={isMockMode}
                  usageStatus={usageStatus}
                  sessionId={sessionId}
                  onSettingsClick={onSettingsClick}
                  onDropdownToggle={onStatusDropdownToggle}
                />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-on-dark" />
                ) : (
                  <Menu className="w-5 h-5 text-on-dark" />
                )}
              </button>
            </div>
          </nav>
        </motion.header>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed top-24 left-4 right-4 z-50 lg:hidden"
            >
              <div className="glass-card backdrop-blur-md bg-neutral-50/10 border border-neutral-50/20 p-6">
                <div className="flex flex-col space-y-4">
                  {navItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`mobile-nav-item group ${pathname === href ? 'mobile-nav-item-active' : ''}`}
                    >
                      <Icon className="w-5 h-5 transition-colors group-hover:text-primary" />
                      <span className="text-base font-medium">{label}</span>
                    </Link>
                  ))}

                  {/* Mobile Try Chat CTA */}
                  <Link 
                    href="/chat" 
                    className={`mobile-nav-item-primary group ${pathname === '/chat' ? 'mobile-nav-item-primary-active' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span className="text-base font-semibold">Try Chat</span>
                      <Zap className="w-4 h-4 text-primary/70 transition-colors group-hover:text-primary animate-pulse ml-auto" />
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 