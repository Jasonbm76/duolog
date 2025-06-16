import { NextRequest, NextResponse } from 'next/server';
import { emailUsageTracker } from '@/lib/services/email-usage-tracker';

export const runtime = 'edge';

interface ResetRequest {
  email?: string;
  action: 'reset_counts';
}

export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body: ResetRequest = await request.json();
    const { email, action } = body;

    if (action !== 'reset_counts') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get email from request or localStorage (since this is dev only)
    let targetEmail = email;
    if (!targetEmail) {
      // In development, try to get from a header or use a default
      const storedEmail = request.headers.get('x-user-email');
      if (!storedEmail) {
        return NextResponse.json({ 
          error: 'Email required for reset',
          success: false 
        }, { status: 400 });
      }
      targetEmail = storedEmail;
    }

    // Reset usage for the email
    const success = await emailUsageTracker.resetUsage(targetEmail);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Usage reset for ${targetEmail}`,
        email: targetEmail
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database not configured or reset failed',
        email: targetEmail
      });
    }
  } catch (error) {
    console.error('Error resetting email usage:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false
    }, { status: 500 });
  }
}