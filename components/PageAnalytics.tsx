"use client"

import { useEffect, useRef } from "react"
import { 
  trackScrollDepth, 
  trackTimeOnPage, 
  trackDeviceType, 
  trackTrafficSource, 
  trackExitIntent, 
  trackError, 
  trackWebVital,
  trackPageLoad,
  throttle 
} from "@/lib/analytics"

export default function PageAnalytics() {
  const scrollTracked = useRef({
    '25%': false,
    '50%': false,
    '75%': false,
    '100%': false
  })

  const timeTracked = useRef({
    '30s': false,
    '60s': false,
    '2min': false,
    '5min': false
  })

  useEffect(() => {
    // Track page load
    trackPageLoad()

    // Track device type
    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    trackDeviceType(deviceType)

    // Track traffic source
    const referrer = document.referrer
    let source = 'direct'
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer)
        const hostname = referrerUrl.hostname.toLowerCase()
        
        // Categorize traffic sources
        if (hostname.includes('google')) source = 'google'
        else if (hostname.includes('bing')) source = 'bing'
        else if (hostname.includes('yahoo')) source = 'yahoo'
        else if (hostname.includes('duckduckgo')) source = 'duckduckgo'
        else if (hostname.includes('facebook')) source = 'facebook'
        else if (hostname.includes('twitter') || hostname.includes('x.com')) source = 'twitter'
        else if (hostname.includes('linkedin')) source = 'linkedin'
        else if (hostname.includes('reddit')) source = 'reddit'
        else if (hostname.includes('youtube')) source = 'youtube'
        else if (hostname.includes('github')) source = 'github'
        else source = hostname
      } catch (e) {
        source = 'unknown'
      }
    }
    
    // Check for UTM parameters
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    if (utmSource) {
      source = `utm_${utmSource}`
    }

    trackTrafficSource(source)

    // Time on page tracking
    const timeTimers = [
      setTimeout(() => {
        if (!timeTracked.current['30s']) {
          trackTimeOnPage('30s')
          timeTracked.current['30s'] = true
        }
      }, 30000),
      setTimeout(() => {
        if (!timeTracked.current['60s']) {
          trackTimeOnPage('60s')
          timeTracked.current['60s'] = true
        }
      }, 60000),
      setTimeout(() => {
        if (!timeTracked.current['2min']) {
          trackTimeOnPage('2min')
          timeTracked.current['2min'] = true
        }
      }, 120000),
      setTimeout(() => {
        if (!timeTracked.current['5min']) {
          trackTimeOnPage('5min')
          timeTracked.current['5min'] = true
        }
      }, 300000),
    ]

    // Scroll depth tracking
    const handleScroll = throttle(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const scrollPercent = Math.round((scrolled / scrollHeight) * 100)

      if (scrollPercent >= 25 && !scrollTracked.current['25%']) {
        trackScrollDepth('25%')
        scrollTracked.current['25%'] = true
      }
      if (scrollPercent >= 50 && !scrollTracked.current['50%']) {
        trackScrollDepth('50%')
        scrollTracked.current['50%'] = true
      }
      if (scrollPercent >= 75 && !scrollTracked.current['75%']) {
        trackScrollDepth('75%')
        scrollTracked.current['75%'] = true
      }
      if (scrollPercent >= 95 && !scrollTracked.current['100%']) {
        trackScrollDepth('100%')
        scrollTracked.current['100%'] = true
      }
    }, 1000)

    // Exit intent tracking (desktop only)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isMobile) {
        trackExitIntent()
      }
    }

    // Error tracking
    const handleError = (event: ErrorEvent) => {
      trackError(event.message || 'Unknown error')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(`Promise rejection: ${event.reason}`)
    }

    // Web Vitals tracking (if available)
    const trackWebVitals = async () => {
      try {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')
        
        getCLS((metric: any) => trackWebVital('CLS', metric.value))
        getFID((metric: any) => trackWebVital('FID', metric.value))
        getFCP((metric: any) => trackWebVital('FCP', metric.value))
        getLCP((metric: any) => trackWebVital('LCP', metric.value))
        getTTFB((metric: any) => trackWebVital('TTFB', metric.value))
      } catch (e) {
        // web-vitals not available, skip
      }
    }

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Track web vitals
    trackWebVitals()

    // Cleanup
    return () => {
      timeTimers.forEach(timer => clearTimeout(timer))
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Component doesn't render anything
  return null
} 