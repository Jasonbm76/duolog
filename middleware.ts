import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Update Supabase session
  const supabaseResponse = await updateSession(request);

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
    return supabaseResponse;
  }

  // For non-admin routes, continue with Supabase session
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all admin routes except API routes and static files
     */
    '/admin/:path*',
  ],
};