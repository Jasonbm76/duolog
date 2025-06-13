export async function GET() {
  try {
    const response = await fetch('https://plausible.io/js/script.pageview-props.revenue.tagged-events.js', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DuoLog Proxy)',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${response.status}`)
    }
    
    const script = await response.text()
    
    return new Response(script, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    })
  } catch (error) {
    console.error('Analytics script proxy error:', error)
    
    // Return a minimal no-op script if Plausible is unavailable
    const fallbackScript = `
      window.plausible = window.plausible || function() { 
        console.log('Analytics:', arguments) 
      };
    `
    
    return new Response(fallbackScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache',
      },
    })
  }
} 