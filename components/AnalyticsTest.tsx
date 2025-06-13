"use client"

import { useEffect, useState } from "react"
import { trackEvent } from "@/lib/analytics"

export default function AnalyticsTest() {
  const [isReady, setIsReady] = useState(false)
  const [hasAdBlocker, setHasAdBlocker] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if plausible loaded (indicating no ad blocker interference)
    const checkAnalytics = () => {
      if (typeof window !== 'undefined') {
        const plausibleLoaded = !!window.plausible
        setHasAdBlocker(!plausibleLoaded)
        setIsReady(true)
        
        // Track that analytics loaded successfully
        if (plausibleLoaded) {
          trackEvent('Page Load')
        }
      }
    }

    // Wait a bit for the script to load
    const timer = setTimeout(checkAnalytics, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !isReady) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-neutral-900/90 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${hasAdBlocker ? 'bg-error' : 'bg-success'}`} />
        <span>
          Analytics: {hasAdBlocker ? 'Blocked (using proxy)' : 'Direct connection'}
        </span>
      </div>
      {hasAdBlocker && (
        <div className="text-neutral-400 mt-1">
          Ad blocker detected - events routed through proxy
        </div>
      )}
    </div>
  )
} 