import { NextRequest, NextResponse } from 'next/server';
import { emailUsageTracker } from '@/lib/services/email-usage-tracker';
import { validateText } from '@/lib/utils/input-validation';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Validate and sanitize token
    const tokenValidation = validateText(token, {
      maxLength: 64,
      minLength: 32,
      allowHtml: false,
      allowSpecialChars: false
    });

    if (!tokenValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid verification token format' 
      }, { status: 400 });
    }

    // Verify the email token
    const result = await emailUsageTracker.verifyEmail(tokenValidation.sanitized);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Invalid verification token'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      email: result.email,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Validate and sanitize token
    const tokenValidation = validateText(token, {
      maxLength: 64,
      minLength: 32,
      allowHtml: false,
      allowSpecialChars: false
    });

    if (!tokenValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid verification token format' 
      }, { status: 400 });
    }

    // Verify the email token
    const result = await emailUsageTracker.verifyEmail(tokenValidation.sanitized);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Invalid verification token'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      email: result.email,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}