import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';
import { validateEmail } from '@/lib/utils/input-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: emailValidation.errors[0] || 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    const cleanEmail = emailValidation.sanitized;

    // Verify this is an admin email
    if (!AdminAuth.isAdminEmail(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email not authorized for admin access' },
        { status: 403 }
      );
    }

    // Generate session token directly (bypass email verification)
    const result = await AdminAuth.generateAdminToken(cleanEmail);
    
    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create session' },
        { status: 500 }
      );
    }

    // Mark as verified and create session immediately
    const sessionResult = await AdminAuth.verifyAdminToken(result.token);
    
    if (!sessionResult.success || !sessionResult.sessionToken) {
      return NextResponse.json(
        { success: false, error: sessionResult.error || 'Failed to create session' },
        { status: 500 }
      );
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session created successfully'
    });

    AdminAuth.setSessionCookie(response, sessionResult.sessionToken);

    return response;

  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}