import { NextRequest, NextResponse } from 'next/server';
import { emailUsageTracker } from '@/lib/services/email-usage-tracker';
import { validateEmail } from '@/lib/utils/input-validation';

export const runtime = 'edge';

interface SendVerificationRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendVerificationRequest = await request.json();
    const { email } = body;

    // Comprehensive email validation with XSS protection
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ 
        error: emailValidation.errors[0] || 'Invalid email address',
        details: emailValidation.errors
      }, { status: 400 });
    }

    const cleanEmail = emailValidation.sanitized;

    // Extract IP for rate limiting
    const { extractIPAddress } = await import('@/lib/utils/ip-utils');
    const ip = extractIPAddress(request);

    // Development bypass - auto-verify developer@test.local (localhost only)
    // This email only works on localhost and is safe for frontend exposure
    // In production, this will be treated as a regular email
    const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                       request.headers.get('host')?.includes('127.0.0.1');
    const isDeveloperEmail = cleanEmail === 'developer@test.local';
    
    if (isLocalhost && isDeveloperEmail) {
      console.log(`🚀 Development bypass: Auto-verifying ${cleanEmail}`);
      
      // Manually verify the email in the database
      const { emailUsageTracker } = await import('@/lib/services/email-usage-tracker');
      
      // First ensure user exists (create if needed)
      await emailUsageTracker.checkLimit(request, {
        email: cleanEmail,
        fingerprint: 'dev-bypass',
        ip
      });

      // Then verify via SQL update (bypassing token system)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('user_usage')
          .update({ email_verified: true })
          .eq('email', cleanEmail);
      }

      return NextResponse.json({
        success: true,
        message: 'Development bypass: Email auto-verified',
        devBypass: true
      });
    }

    // Send verification email
    const result = await emailUsageTracker.sendVerificationEmail(cleanEmail, ip);

    if (result.alreadyVerified) {
      return NextResponse.json({
        success: false,
        error: 'Email is already verified',
        alreadyVerified: true
      }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send verification email'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      email: cleanEmail
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}