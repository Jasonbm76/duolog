import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the event data from the request
    const body = await request.text()
    
    // Get the original headers we need to forward
    const headers = new Headers()
    headers.set('Content-Type', request.headers.get('Content-Type') || 'application/json')
    headers.set('User-Agent', request.headers.get('User-Agent') || 'DuoLog Proxy')
    
    // Forward client IP if available
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'
    headers.set('X-Forwarded-For', clientIP)
    
    // Forward other important headers
    const referer = request.headers.get('referer')
    if (referer) {
      headers.set('Referer', referer)
    }
    
    // Proxy the request to Plausible
    const response = await fetch('https://plausible.io/api/event', {
      method: 'POST',
      headers,
      body,
    })
    
    if (!response.ok) {
      console.error('Plausible API error:', response.status, await response.text())
      return new NextResponse('Analytics service unavailable', { status: 503 })
    }
    
    // Return success response
    return new NextResponse('OK', { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {
    console.error('Analytics event proxy error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 