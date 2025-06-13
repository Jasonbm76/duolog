// Declare global plausible function
declare global {
  var plausible: (event: string, options?: { props?: Record<string, string | number> }) => void
}

// Simple tracking function
export const trackEvent = (event: string, props?: Record<string, string | number>) => {
  try {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(event, props ? { props } : undefined)
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error)
  }
} 