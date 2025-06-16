import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = AdminAuth.getSessionFromRequest(request);

    // Logout the session (this handles null tokens gracefully)
    await AdminAuth.logout(sessionToken || '');

    // Create response and clear the session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    AdminAuth.clearSessionCookie(response);

    return response;

  } catch (error) {
    console.error('Admin logout error:', error);
    
    // Even if there's an error, clear the cookie and respond success
    // We don't want to prevent logout due to server errors
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    AdminAuth.clearSessionCookie(response);

    return response;
  }
}