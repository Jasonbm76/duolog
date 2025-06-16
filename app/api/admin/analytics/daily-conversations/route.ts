import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url);
    const daysBack = parseInt(url.searchParams.get('days') || '30');

    // Get daily conversation counts
    const { data, error } = await supabase.rpc('get_daily_conversation_counts', {
      days_back: daysBack
    });

    if (error) {
      console.error('Error fetching daily conversation data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversation data' },
        { status: 500 }
      );
    }

    // Fill in missing dates with 0 counts
    const result = [];
    // Use local timezone to ensure we include today properly
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingData = data?.find((d: any) => d.date === dateStr);
      result.push({
        date: dateStr,
        conversation_count: existingData ? parseInt(existingData.conversation_count) : 0
      });
    }
    
    // Debug logging to help troubleshoot
    console.log('Daily conversations date range:', {
      today: today.toISOString().split('T')[0],
      daysBack,
      firstDate: result[0]?.date,
      lastDate: result[result.length - 1]?.date,
      resultCount: result.length
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Daily conversations API error:', error);
    
    // In development mode with missing admin config, don't fail completely
    if (process.env.NODE_ENV === 'development') {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
      if (adminEmails.length === 0 && error.message?.includes('auth')) {
        console.warn('⚠️ Authentication error bypassed in development mode');
        // Return empty data rather than error
        return NextResponse.json({
          success: true,
          data: [],
          developmentMode: true
        });
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}