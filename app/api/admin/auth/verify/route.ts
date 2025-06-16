import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Check existing admin session
    const sessionToken = AdminAuth.getSessionFromRequest(request);
    const validation = await AdminAuth.validateSession(sessionToken || '');
    
    if (!validation.isAuthenticated) {
      // In development mode, if no admin emails are configured, allow access
      if (process.env.NODE_ENV === 'development') {
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
        if (adminEmails.length === 0) {
          console.warn('⚠️ Admin access granted in development mode without ADMIN_EMAILS configured');
          return NextResponse.json({
            success: true,
            email: 'dev@localhost',
            isAuthenticated: true,
            isDevelopmentMode: true
          });
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error || 'Not authenticated' 
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      email: validation.email,
      isAuthenticated: true
    });

  } catch (error) {
    console.error('Admin session verification error:', error);
    
    // In development mode, if verification fails due to missing config, allow access
    if (process.env.NODE_ENV === 'development') {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
      if (adminEmails.length === 0) {
        console.warn('⚠️ Admin access granted in development mode due to verification error');
        return NextResponse.json({
          success: true,
          email: 'dev@localhost',
          isAuthenticated: true,
          isDevelopmentMode: true
        });
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification token is required' 
        },
        { status: 400 }
      );
    }

    // Verify the admin token and create session
    const verificationResult = await AdminAuth.verifyAdminToken(token);

    if (!verificationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: verificationResult.error || 'Token verification failed' 
        },
        { status: 401 }
      );
    }

    // Create the response and set the session cookie
    const response = NextResponse.json({
      success: true,
      email: verificationResult.email,
      message: 'Admin access granted'
    });

    // Set the admin session cookie
    if (verificationResult.sessionToken) {
      AdminAuth.setSessionCookie(response, verificationResult.sessionToken);
    }

    return response;

  } catch (error) {
    console.error('Admin token verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}