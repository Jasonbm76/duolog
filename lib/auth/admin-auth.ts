import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface AdminAuthResult {
  isAuthenticated: boolean;
  email?: string;
  error?: string;
}

/**
 * Admin authentication utility
 * Uses email verification system for admin access
 */
export class AdminAuth {
  
  /**
   * Check if email is authorized admin
   */
  static isAdminEmail(email: string): boolean {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    return adminEmails.includes(email.toLowerCase());
  }

  /**
   * Check if admin email is verified in localStorage (browser-based bypass)
   */
  static isAdminVerifiedLocally(email: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const verifiedAdmins = localStorage.getItem('duolog_verified_admins');
      if (!verifiedAdmins) return false;
      
      const verifiedList: string[] = JSON.parse(verifiedAdmins);
      return verifiedList.includes(email.toLowerCase());
    } catch (error) {
      console.error('Error checking local admin verification:', error);
      return false;
    }
  }

  /**
   * Mark admin email as verified in localStorage
   */
  static markAdminVerifiedLocally(email: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const verifiedAdmins = localStorage.getItem('duolog_verified_admins');
      let verifiedList: string[] = verifiedAdmins ? JSON.parse(verifiedAdmins) : [];
      
      const emailLower = email.toLowerCase();
      if (!verifiedList.includes(emailLower)) {
        verifiedList.push(emailLower);
        localStorage.setItem('duolog_verified_admins', JSON.stringify(verifiedList));
      }
    } catch (error) {
      console.error('Error saving local admin verification:', error);
    }
  }

  /**
   * Clear all locally verified admins (useful for testing or security)
   */
  static clearLocallyVerifiedAdmins(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('duolog_verified_admins');
    } catch (error) {
      console.error('Error clearing local admin verification:', error);
    }
  }

  /**
   * Generate admin verification token
   */
  static async generateAdminToken(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
    if (!this.isAdminEmail(email)) {
      return { success: false, error: 'Email not authorized for admin access' };
    }

    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      // Generate verification token
      const { data: tokenData } = await supabase
        .rpc('generate_verification_token');

      const token = tokenData;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      console.log('Attempting to store admin token:', {
        email: email.toLowerCase(),
        token: token?.substring(0, 10) + '...',
        expiresAt: expiresAt.toISOString()
      });

      // Store admin verification token
      const { error } = await supabase
        .from('admin_sessions')
        .upsert({
          email: email.toLowerCase(),
          verification_token: token,
          expires_at: expiresAt.toISOString(),
          verified: false,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

      if (error) {
        console.error('Error storing admin token:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        return { success: false, error: `Failed to generate admin token: ${error.message}` };
      }

      return { success: true, token };
    } catch (error) {
      console.error('Admin token generation error:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      return { success: false, error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Verify admin token and create session
   */
  static async verifyAdminToken(token: string): Promise<{ success: boolean; email?: string; sessionToken?: string; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      // Find and verify token
      const { data: adminSession, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('verification_token', token)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !adminSession) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Verify email is still admin
      if (!this.isAdminEmail(adminSession.email)) {
        return { success: false, error: 'Email no longer authorized for admin access' };
      }

      // Generate session token
      const { data: sessionTokenData } = await supabase
        .rpc('generate_verification_token');

      const sessionToken = sessionTokenData;
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Mark verification token as used and create session
      const { error: updateError } = await supabase
        .from('admin_sessions')
        .update({
          verified: true,
          session_token: sessionToken,
          session_expires_at: sessionExpiresAt.toISOString(),
          last_login_at: new Date().toISOString()
        })
        .eq('email', adminSession.email);

      if (updateError) {
        console.error('Error creating admin session:', updateError);
        return { success: false, error: 'Failed to create admin session' };
      }

      return { 
        success: true, 
        email: adminSession.email,
        sessionToken 
      };
    } catch (error) {
      console.error('Admin token verification error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Validate admin session
   */
  static async validateSession(sessionToken: string): Promise<AdminAuthResult> {
    if (!sessionToken) {
      return { isAuthenticated: false, error: 'No session token provided' };
    }

    if (!supabase) {
      // Fallback for development without database
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
      if (adminEmails.length > 0) {
        return { 
          isAuthenticated: true, 
          email: adminEmails[0] 
        };
      }
      
      // Development mode fallback - if no admin emails configured, 
      // allow access for development (this should be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Admin access granted in development mode without ADMIN_EMAILS configured');
        return { 
          isAuthenticated: true, 
          email: 'dev@localhost' 
        };
      }
      
      return { isAuthenticated: false, error: 'Database not configured and no admin emails set' };
    }

    try {
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select('email, session_expires_at')
        .eq('session_token', sessionToken)
        .eq('verified', true)
        .gte('session_expires_at', new Date().toISOString())
        .single();

      if (error || !session) {
        return { isAuthenticated: false, error: 'Invalid or expired session' };
      }

      // Double-check email is still admin
      if (!this.isAdminEmail(session.email)) {
        return { isAuthenticated: false, error: 'Email no longer authorized' };
      }

      return { 
        isAuthenticated: true, 
        email: session.email 
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { isAuthenticated: false, error: 'Session validation failed' };
    }
  }

  /**
   * Logout admin session
   */
  static async logout(sessionToken: string): Promise<{ success: boolean }> {
    if (!supabase || !sessionToken) {
      return { success: true }; // Always allow logout
    }

    try {
      await supabase
        .from('admin_sessions')
        .update({ session_token: null, session_expires_at: null })
        .eq('session_token', sessionToken);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: true }; // Don't block logout on errors
    }
  }

  /**
   * Get admin session from request
   */
  static getSessionFromRequest(request: NextRequest): string | null {
    return request.cookies.get('admin_session')?.value || null;
  }

  /**
   * Set admin session cookie
   */
  static setSessionCookie(response: NextResponse, sessionToken: string): void {
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
  }

  /**
   * Clear admin session cookie
   */
  static clearSessionCookie(response: NextResponse): void {
    response.cookies.delete('admin_session');
  }
}