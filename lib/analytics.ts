// Declare global plausible function
declare global {
  var plausible: (event: string, options?: { props?: Record<string, string | number> }) => void
}

// Analytics event types for better type safety
export type AnalyticsEvent = 
  | 'Navigation Click'
  | 'Scroll Depth'
  | 'Feature Hover'
  | 'Feature Click'
  | 'Time on Page'
  | 'Device Type'
  | 'Email Field Focus'
  | 'Email Field Blur'
  | 'Traffic Source'
  | 'Exit Intent'
  | 'JavaScript Error'
  | 'Web Vital'
  | 'Page Load'
  | 'Email Form Submit'
  | 'Email Form Success'
  | 'Email Form Error'
  | 'Email Form Button Click'

// Utility function to safely track events
export const trackEvent = (event: AnalyticsEvent, props?: Record<string, string | number>) => {
  try {
    if (typeof window !== 'undefined') {
      // Wait for plausible to be available (max 5 seconds)
      const waitForPlausible = (retries = 50) => {
        if (window.plausible) {
          window.plausible(event, props ? { props } : undefined)
        } else if (retries > 0) {
          setTimeout(() => waitForPlausible(retries - 1), 100)
        } else {
          console.warn(`Analytics: plausible not available for event "${event}"`)
        }
      }
      
      waitForPlausible()
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error)
  }
}

// Specific tracking functions
export const trackNavigation = (target: string) => {
  trackEvent('Navigation Click', { target })
}

export const trackScrollDepth = (depth: string) => {
  trackEvent('Scroll Depth', { depth })
}

export const trackFeatureInteraction = (feature: string, type: 'hover' | 'click') => {
  trackEvent(type === 'hover' ? 'Feature Hover' : 'Feature Click', { feature })
}

export const trackTimeOnPage = (duration: string) => {
  trackEvent('Time on Page', { duration })
}

export const trackDeviceType = (device: string) => {
  trackEvent('Device Type', { device })
}

export const trackFormField = (action: 'focus' | 'blur', hasValue?: boolean) => {
  trackEvent(action === 'focus' ? 'Email Field Focus' : 'Email Field Blur', 
    hasValue !== undefined ? { has_value: hasValue ? 'yes' : 'no' } : undefined)
}

export const trackTrafficSource = (source: string) => {
  trackEvent('Traffic Source', { source })
}

export const trackExitIntent = () => {
  trackEvent('Exit Intent')
}

export const trackError = (error: string) => {
  trackEvent('JavaScript Error', { error: error.substring(0, 100) }) // Limit error length
}

export const trackWebVital = (metric: string, value: number) => {
  trackEvent('Web Vital', { metric, value: Math.round(value) })
}

export const trackPageLoad = () => {
  trackEvent('Page Load')
}

// Throttle utility for scroll events
export const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  let lastExecTime = 0
  return function (this: any, ...args: any[]) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
} 