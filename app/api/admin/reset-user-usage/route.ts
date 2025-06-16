import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const sessionToken = AdminAuth.getSessionFromRequest(request);
    const validation = await AdminAuth.validateSession(sessionToken || '');
    
    if (!validation.isAuthenticated) {
      // In development mode, if no admin emails are configured, allow access
      if (process.env.NODE_ENV === 'development') {
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
        if (adminEmails.length === 0) {
          console.warn('⚠️ Admin API access granted in development mode without ADMIN_EMAILS configured');
          // Continue with the request - bypass authentication for development
        } else {
          console.error('Admin authentication failed:', validation.error);
          return NextResponse.json(
            { success: false, error: 'Unauthorized - Admin access required', details: validation.error },
            { status: 401 }
          );
        }
      } else {
        console.error('Admin authentication failed:', validation.error);
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin access required', details: validation.error },
          { status: 401 }
        );
      }
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Reset user's conversation count
    const { error: resetError } = await supabase
      .from('user_usage')
      .update({
        conversations_used: 0,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (resetError) {
      console.error('Error resetting user usage:', resetError);
      return NextResponse.json(
        { success: false, error: 'Failed to reset user usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reset usage for ${email}`
    });

  } catch (error) {
    console.error('Reset user usage API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}