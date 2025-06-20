import { NextRequest } from 'next/server';
import { robustUsageTracker } from '@/lib/services/robust-usage-tracker';
import { extractIPAddress } from '@/lib/utils/ip-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      sessionId, 
      fingerprint, 
      persistentId, 
      email,
      userKeys,
      file 
    } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Valid prompt is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract IP address
    const ip = extractIPAddress(request);

    // Check if user has their own API keys - if so, bypass usage limits
    const hasOwnKeys = Boolean(userKeys?.openai || userKeys?.anthropic);
    
    if (!hasOwnKeys) {
      // Create user identifiers for usage tracking
      const identifiers = {
        composite: '', // Will be set by tracker
        ip,
        fingerprint: fingerprint || undefined,
        persistentId: persistentId || undefined,
        sessionId: sessionId || undefined,
      };

      // Check if user can start a conversation
      const limitCheck = await robustUsageTracker.checkLimit(request, identifiers, email);

      if (!limitCheck.allowed) {
        return new Response(JSON.stringify({
          error: 'Conversation limit reached',
          reason: limitCheck.reason,
          used: limitCheck.used,
          limit: limitCheck.limit,
        }), {
          status: 429, // Too Many Requests
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '86400', // 24 hours
          },
        });
      }

      // Increment usage counter for users without their own keys
      await robustUsageTracker.increment(request, identifiers, email, {
        conversationId: sessionId,
        promptLength: prompt.length
      });

      // Return success response with usage tracking
      return new Response(JSON.stringify({
        success: true,
        sessionId: sessionId,
        message: 'Conversation started successfully',
        usage: {
          used: limitCheck.used + 1,
          limit: limitCheck.limit,
        },
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } else {
      // User has their own keys - no usage limits
      console.log('User provided their own API keys - bypassing usage limits');
      
      // Return success response without usage tracking
      return new Response(JSON.stringify({
        success: true,
        sessionId: sessionId,
        message: 'Conversation started successfully with your API keys',
        usage: {
          used: 0,
          limit: 999, // Unlimited for users with their own keys
        },
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

  } catch (error) {
    console.error('Conversation start API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}