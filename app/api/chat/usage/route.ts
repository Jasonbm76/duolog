import { NextRequest } from 'next/server';
import { robustUsageTracker } from '@/lib/services/robust-usage-tracker';
import { extractIPAddress } from '@/lib/utils/ip-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const fingerprint = searchParams.get('fingerprint');
    const persistentId = searchParams.get('persistentId');
    const email = searchParams.get('email');
    const userKeysParam = searchParams.get('userKeys');

    // Extract IP address
    const ip = extractIPAddress(request);

    // Create user identifiers
    const identifiers = {
      composite: '', // Will be set by tracker
      ip,
      fingerprint: fingerprint || undefined,
      persistentId: persistentId || undefined,
      sessionId: sessionId || undefined,
    };

    // Get usage information
    const usage = await robustUsageTracker.getUsage(request, identifiers, email || undefined);

    // Check if user has their own API keys
    let hasOwnKeys = false;
    if (userKeysParam) {
      try {
        const userKeys = JSON.parse(userKeysParam);
        hasOwnKeys = !!(userKeys.openai || userKeys.anthropic);
      } catch (error) {
        console.error('Error parsing user keys:', error);
        hasOwnKeys = false;
      }
    }

    return new Response(JSON.stringify({
      used: usage.used,
      limit: usage.limit,
      hasOwnKeys,
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}