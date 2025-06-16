import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase configuration for email usage tracking');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface UserIdentifiers {
  email: string;
  fingerprint?: string;
  ip?: string;
  sessionId?: string;
}

interface UsageStatus {
  allowed: boolean;
  used: number;
  limit: number;
  hasOwnKeys: boolean;
  email?: string;
  isNewUser?: boolean;
  suspiciousActivity?: boolean;
  emailVerified?: boolean;
  verificationRequired?: boolean;
}

interface UsageRecord {
  id: string;
  email: string;
  conversations_used: number;
  max_conversations: number;
  fingerprint?: string;
  ip_address?: string;
  session_id?: string;
  has_own_keys: boolean;
  email_verified: boolean;
  verification_token?: string;
  verification_expires_at?: string;
  created_at: string;
  updated_at: string;
  last_conversation_at?: string;
}

class EmailUsageTracker {
  private fallbackLimit = 3;

  async checkLimit(
    _request: NextRequest, 
    identifiers: UserIdentifiers,
    userKeys?: { openai?: string; anthropic?: string }
  ): Promise<UsageStatus> {
    // SECURITY: Require email for all users (prevent bypass by not providing email)
    if (!identifiers.email || identifiers.email.trim() === '') {
      return {
        allowed: false,
        used: 0,
        limit: this.fallbackLimit,
        hasOwnKeys: false,
        email: ''
      };
    }

    // Users with their own keys get unlimited access
    const hasOwnKeys = !!(userKeys?.openai || userKeys?.anthropic);
    if (hasOwnKeys) {
      return {
        allowed: true,
        used: 0,
        limit: 999,
        hasOwnKeys: true,
        email: identifiers.email
      };
    }

    // If no database, use fallback
    if (!supabase) {
      console.warn('No Supabase connection - using fallback limits');
      return {
        allowed: true,
        used: 0,
        limit: this.fallbackLimit,
        hasOwnKeys: false,
        email: identifiers.email
      };
    }

    try {
      // Check existing usage by email
      const { data: existingUsage, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('email', identifiers.email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Database error checking usage:', error);
        return {
          allowed: true,
          used: 0,
          limit: this.fallbackLimit,
          hasOwnKeys: false,
          email: identifiers.email
        };
      }

      let usage: UsageRecord;
      let isNewUser = false;

      if (!existingUsage) {
        // Create new user record
        const { data: newUsage, error: createError } = await supabase
          .from('user_usage')
          .insert({
            email: identifiers.email,
            conversations_used: 0,
            max_conversations: this.fallbackLimit,
            fingerprint: identifiers.fingerprint,
            ip_address: identifiers.ip,
            session_id: identifiers.sessionId,
            has_own_keys: hasOwnKeys
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user usage record:', createError);
          return {
            allowed: true,
            used: 0,
            limit: this.fallbackLimit,
            hasOwnKeys: false,
            email: identifiers.email
          };
        }

        usage = newUsage;
        isNewUser = true;
      } else {
        usage = existingUsage;
        
        // Update fingerprint and IP if they've changed
        if (identifiers.fingerprint !== usage.fingerprint || 
            identifiers.ip !== usage.ip_address) {
          await supabase
            .from('user_usage')
            .update({
              fingerprint: identifiers.fingerprint,
              ip_address: identifiers.ip,
              session_id: identifiers.sessionId
            })
            .eq('email', identifiers.email);
        }
      }

      // Check for suspicious activity
      let suspiciousActivity = false;
      if (identifiers.fingerprint) {
        const { data: suspiciousCheck } = await supabase
          .rpc('check_suspicious_activity', {
            p_email: identifiers.email,
            p_fingerprint: identifiers.fingerprint,
            p_ip_address: identifiers.ip || ''
          });

        suspiciousActivity = suspiciousCheck?.abuse_detected || false;
      }

      // Check if email verification is required (for non-BYOK users)
      const verificationRequired = !hasOwnKeys && !usage.email_verified;
      const allowed = !verificationRequired && usage.conversations_used < usage.max_conversations;

      return {
        allowed,
        used: usage.conversations_used,
        limit: usage.max_conversations,
        hasOwnKeys: usage.has_own_keys,
        email: identifiers.email,
        isNewUser,
        suspiciousActivity,
        emailVerified: usage.email_verified,
        verificationRequired
      };

    } catch (error) {
      console.error('Error in email usage tracker:', error);
      return {
        allowed: true,
        used: 0,
        limit: this.fallbackLimit,
        hasOwnKeys: false,
        email: identifiers.email
      };
    }
  }

  async increment(
    request: NextRequest,
    identifiers: UserIdentifiers,
    userKeys?: { openai?: string; anthropic?: string },
    conversationData?: { conversationId?: string; promptLength?: number }
  ): Promise<boolean> {
    const hasOwnKeys = !!(userKeys?.openai || userKeys?.anthropic);
    
    // Don't increment for users with their own keys
    if (hasOwnKeys) {
      return true;
    }

    if (!supabase) {
      console.warn('No Supabase connection - cannot increment usage');
      return false;
    }

    try {
      // First get current count, then increment
      const { data: currentData, error: fetchError } = await supabase
        .from('user_usage')
        .select('conversations_used')
        .eq('email', identifiers.email)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current usage: ${fetchError.message}`);
      }

      const newCount = (currentData?.conversations_used || 0) + 1;

      // Update usage tracking
      const { error } = await supabase
        .from('user_usage')
        .update({
          conversations_used: newCount,
          last_conversation_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', identifiers.email)
        .select();

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      // Log conversation for analytics
      const ip = this.extractIPAddress(request);
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      
      await supabase.rpc('log_conversation_start', {
        p_email: identifiers.email,
        p_conversation_id: conversationData?.conversationId,
        p_user_prompt_length: conversationData?.promptLength,
        p_ip_address: ip,
        p_user_agent: userAgent
      });

      return true;
    } catch (error) {
      console.error('Error incrementing email usage:', error);
      return false;
    }
  }

  async resetUsage(email: string): Promise<boolean> {
    if (!supabase) {
      console.warn('No Supabase connection - cannot reset usage');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_usage')
        .update({
          conversations_used: 0,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) {
        console.error('Error resetting usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error resetting email usage:', error);
      return false;
    }
  }

  async getUserUsage(email: string): Promise<UsageStatus | null> {
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error getting user usage:', error);
        return null;
      }

      return {
        allowed: data.conversations_used < data.max_conversations,
        used: data.conversations_used,
        limit: data.max_conversations,
        hasOwnKeys: data.has_own_keys,
        email: data.email
      };
    } catch (error) {
      console.error('Error getting user email usage:', error);
      return null;
    }
  }

  async getAbuseStats(): Promise<{
    totalUsers: number;
    suspiciousUsers: number;
    averageConversations: number;
  }> {
    if (!supabase) {
      return { totalUsers: 0, suspiciousUsers: 0, averageConversations: 0 };
    }

    try {
      const [usersResult, abuseResult, avgResult] = await Promise.all([
        supabase.from('user_usage').select('id'),
        supabase.from('usage_abuse_log').select('email', { count: 'exact' }),
        supabase.from('user_usage').select('conversations_used')
      ]);

      const totalUsers = usersResult.data?.length || 0;
      const suspiciousUsers = abuseResult.count || 0;
      const avgConversations = avgResult.data && avgResult.data.length > 0 
        ? avgResult.data.reduce((sum: number, u: any) => sum + u.conversations_used, 0) / avgResult.data.length
        : 0;

      return {
        totalUsers,
        suspiciousUsers,
        averageConversations: Math.round(avgConversations * 100) / 100
      };
    } catch (error) {
      console.error('Error getting abuse stats:', error);
      return { totalUsers: 0, suspiciousUsers: 0, averageConversations: 0 };
    }
  }

  async sendVerificationEmail(email: string, ip?: string): Promise<{ success: boolean; error?: string; alreadyVerified?: boolean }> {
    if (!supabase) {
      console.warn('No Supabase connection - cannot send verification');
      return { success: false, error: 'Database not configured' };
    }

    try {
      // Check if email is already verified
      const { data: existingUser } = await supabase
        .from('user_usage')
        .select('email_verified')
        .eq('email', email)
        .single();

      if (existingUser?.email_verified) {
        return { success: false, alreadyVerified: true };
      }

      // Check rate limits
      const { data: rateLimitCheck, error: rateLimitError } = await supabase
        .rpc('can_send_verification', {
          p_email: email,
          p_ip_address: ip || ''
        });

      console.log('Rate limit check:', { rateLimitCheck, rateLimitError, email, ip });

      if (rateLimitError) {
        console.error('Rate limit check failed:', rateLimitError);
        return { 
          success: false, 
          error: `Error checking rate limits: ${rateLimitError.message}` 
        };
      }

      if (!rateLimitCheck?.allowed) {
        console.log('Rate limit exceeded:', rateLimitCheck);
        return { 
          success: false, 
          error: `Too many verification attempts. Please wait before requesting another.` 
        };
      }

      // Generate verification token and expiration
      const { data: tokenData } = await supabase
        .rpc('generate_verification_token');

      const verificationToken = tokenData;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Create or update user with verification token
      const { error: upsertError } = await supabase
        .from('user_usage')
        .upsert({
          email: email,
          email_verified: false,
          verification_token: verificationToken,
          verification_expires_at: expiresAt.toISOString(),
          conversations_used: 0,
          max_conversations: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });

      if (upsertError) {
        console.error('Error creating/updating user with verification token:', upsertError);
        return { success: false, error: 'Failed to generate verification token' };
      }

      // Record the attempt
      await supabase.rpc('record_verification_attempt', {
        p_email: email,
        p_ip_address: ip || ''
      });

      // Send verification email
      const { emailService } = await import('./email-service');
      const baseUrl = process.env.APP_URL || 
                     process.env.NEXT_PUBLIC_APP_URL || 
                     'https://duolog.ai';
      const verificationUrl = `${baseUrl}/verify?token=${verificationToken}`;
      
      const emailResult = await emailService.sendVerificationEmail({
        email,
        verificationUrl,
        isExistingUser: !!existingUser
      });

      return emailResult;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { data: result } = await supabase
        .rpc('verify_email_token', { p_token: token });

      if (result?.success) {
        return { 
          success: true, 
          email: result.email 
        };
      } else {
        return { 
          success: false, 
          error: result?.error || 'Invalid verification token' 
        };
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export const emailUsageTracker = new EmailUsageTracker();