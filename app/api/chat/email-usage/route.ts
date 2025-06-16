import { NextRequest, NextResponse } from 'next/server';
import { emailUsageTracker } from '@/lib/services/email-usage-tracker';
import { validateEmail, validateText, validateSessionId } from '@/lib/utils/input-validation';

export const runtime = 'edge';

interface UsageRequest {
  email: string;
  fingerprint?: string;
  sessionId?: string;
  userKeys?: {
    openai?: string;
    anthropic?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const fingerprint = url.searchParams.get('fingerprint');
    const sessionId = url.searchParams.get('sessionId');
    const userKeysParam = url.searchParams.get('userKeys');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate and sanitize inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ 
        error: emailValidation.errors[0] || 'Invalid email address'
      }, { status: 400 });
    }

    let sanitizedFingerprint = '';
    if (fingerprint) {
      const fingerprintValidation = validateText(fingerprint, {
        maxLength: 100,
        allowHtml: false,
        allowSpecialChars: false
      });
      if (fingerprintValidation.isValid) {
        sanitizedFingerprint = fingerprintValidation.sanitized;
      }
    }

    let sanitizedSessionId = '';
    if (sessionId) {
      if (validateSessionId(sessionId)) {
        sanitizedSessionId = sessionId;
      }
    }

    // Parse user keys if provided
    let userKeys;
    if (userKeysParam) {
      try {
        userKeys = JSON.parse(userKeysParam);
      } catch (error) {
        console.error('Error parsing user keys:', error);
      }
    }

    // Extract IP address
    const { extractIPAddress } = await import('@/lib/utils/ip-utils');
    const ip = extractIPAddress(request);

    const identifiers = {
      email: emailValidation.sanitized,
      fingerprint: sanitizedFingerprint,
      ip,
      sessionId: sanitizedSessionId
    };

    const usageStatus = await emailUsageTracker.checkLimit(request, identifiers, userKeys);

    return NextResponse.json(usageStatus);
  } catch (error) {
    console.error('Error checking email usage:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      allowed: true,
      used: 0,
      limit: 5,
      hasOwnKeys: false
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: UsageRequest = await request.json();
    const { email, fingerprint, sessionId, userKeys } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Extract IP address
    const { extractIPAddress } = await import('@/lib/utils/ip-utils');
    const ip = extractIPAddress(request);

    const identifiers = {
      email,
      fingerprint,
      ip,
      sessionId
    };

    // Check current status
    const usageStatus = await emailUsageTracker.checkLimit(request, identifiers, userKeys);
    
    if (!usageStatus.allowed) {
      return NextResponse.json({
        error: 'Usage limit exceeded',
        ...usageStatus
      }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      ...usageStatus
    });
  } catch (error) {
    console.error('Error in email usage POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PATCH method removed - usage should only be incremented in the collaborate endpoint
// to prevent double-counting conversations