import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes (excluding login and verify pages)
  if (pathname.startsWith('/admin') && 
      !pathname.startsWith('/admin/login') && 
      !pathname.startsWith('/admin/verify')) {
    
    // Get session token from cookies
    const sessionToken = AdminAuth.getSessionFromRequest(request);

    if (!sessionToken) {
      // No session token - redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Validate the session
    const validation = await AdminAuth.validateSession(sessionToken);

    if (!validation.isAuthenticated) {
      // Invalid session - redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      AdminAuth.clearSessionCookie(response);
      return response;
    }

    // Session is valid - allow access
    return NextResponse.next();
  }

  // For non-admin routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all admin routes except API routes and static files
     */
    '/admin/:path*',
  ],
};