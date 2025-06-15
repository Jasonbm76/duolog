import { createClient } from '@supabase/supabase-js';
import { extractIPAddress, isPrivateIP, isLikelyVPN, getCountryCodeFromIP, globalRateLimiter } from '@/lib/utils/ip-utils';
import { NextRequest } from 'next/server';

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface UsageResult {
  allowed: boolean;
  used: number;
  limit: number;
  reason?: string;
}

interface UserIdentifiers {
  composite: string;
  ip: string;
  fingerprint?: string;
  persistentId?: string;
  sessionId?: string;
}

interface UsageRecord {
  id: string;
  user_identifier: string;
  ip_address: string;
  browser_fingerprint?: string;
  persistent_id?: string;
  session_id?: string;
  conversation_count: number;
  daily_limit: number;
  first_conversation_at: string;
  last_conversation_at: string;
  created_at: string;
  updated_at: string;
  user_agent?: string;
  country_code?: string;
  is_vpn: boolean;
  is_blocked: boolean;
}

class RobustUsageTracker {
  private readonly maxFreeConversations = 5;
  private readonly maxDailyRequests = 50; // Additional protection

  // Create composite user identifier from multiple factors
  private createCompositeIdentifier(identifiers: UserIdentifiers): string {
    const { ip, fingerprint, persistentId } = identifiers;
    
    // Combine multiple identifiers for robust tracking
    const parts = [];
    
    // Add IP if it's valid
    if (ip && ip !== 'unknown') parts.push(ip);
    
    // Add fingerprint if available
    if (fingerprint && fingerprint !== 'server-side' && fingerprint !== 'fingerprint-error') {
      parts.push(fingerprint);
    }
    
    // Add persistent ID if available
    if (persistentId && persistentId !== 'server-side' && persistentId !== 'localStorage-disabled') {
      parts.push(persistentId);
    }
    
    // If we have no valid identifiers, use a fallback
    if (parts.length === 0) {
      parts.push(`fallback-${Date.now()}`);
    }
    
    return this.hashString(parts.join('|'));
  }

  // Hash function for creating identifiers
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }

  // Check if user has exceeded rate limits
  async checkRateLimit(request: NextRequest): Promise<{ allowed: boolean; reason?: string }> {
    const ip = extractIPAddress(request);
    
    // Check IP rate limiting first
    if (globalRateLimiter.isRateLimited(ip)) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    // Check if IP is blocked or suspicious
    if (isLikelyVPN(ip)) {
      console.warn(`Suspicious IP detected: ${ip}`);
      // Don't block VPNs entirely, but log them
    }

    return { allowed: true };
  }

  // Get or create usage record
  private async getOrCreateUsageRecord(
    identifiers: UserIdentifiers,
    userAgent?: string
  ): Promise<UsageRecord | null> {
    const { composite, ip, fingerprint, persistentId, sessionId } = identifiers;

    try {
      // First, try to find existing record by composite identifier
      let { data: existing, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_identifier', composite)
        .order('last_conversation_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Database error:', error);
        return null;
      }

      if (existing) {
        // Return existing record without any daily reset
        return existing as UsageRecord;
      }

      // If no composite match found, try to find by IP address as fallback
      if (ip && ip !== 'unknown') {
        const { data: ipMatch } = await supabase
          .from('usage_tracking')
          .select('*')
          .eq('ip_address', ip)
          .order('last_conversation_at', { ascending: false })
          .limit(1)
          .single();

        if (ipMatch) {
          console.log(`Found existing user by IP fallback: ${ip}`);
          // Update the record with new identifiers to improve future matching
          const { data: updated } = await supabase
            .from('usage_tracking')
            .update({
              user_identifier: composite,
              browser_fingerprint: fingerprint || ipMatch.browser_fingerprint,
              persistent_id: persistentId || ipMatch.persistent_id,
              session_id: sessionId || ipMatch.session_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', ipMatch.id)
            .select()
            .single();

          return updated as UsageRecord || ipMatch as UsageRecord;
        }
      }

      // No existing record found, create new one
      const newRecord = {
        user_identifier: composite,
        ip_address: ip || 'unknown',
        browser_fingerprint: fingerprint || null,
        persistent_id: persistentId || null,
        session_id: sessionId || null,
        conversation_count: 0,
        daily_limit: this.maxFreeConversations,
        user_agent: userAgent || null,
        country_code: (ip && ip !== 'unknown') ? getCountryCodeFromIP(ip) : 'unknown',
        is_vpn: (ip && ip !== 'unknown') ? isLikelyVPN(ip) : false,
        is_blocked: false,
      };

      const { data: created, error: createError } = await supabase
        .from('usage_tracking')
        .insert(newRecord)
        .select()
        .single();

      if (createError) {
        console.error('Error creating usage record:', createError);
        return null;
      }

      return created as UsageRecord;
    } catch (error) {
      console.error('Unexpected error in getOrCreateUsageRecord:', error);
      return null;
    }
  }

  // Check if user can start a new conversation
  async checkLimit(
    request: NextRequest,
    identifiers: UserIdentifiers,
    email?: string
  ): Promise<UsageResult> {
    try {
      // First check rate limiting
      const rateLimitCheck = await this.checkRateLimit(request);
      if (!rateLimitCheck.allowed) {
        return {
          allowed: false,
          used: 0,
          limit: this.maxFreeConversations,
          reason: rateLimitCheck.reason,
        };
      }

      // Create composite identifier
      const composite = this.createCompositeIdentifier(identifiers);
      identifiers.composite = composite;

      // Get usage record
      const userAgent = request.headers.get('user-agent') || undefined;
      const record = await this.getOrCreateUsageRecord(identifiers, userAgent);

      if (!record) {
        // Database error, allow but log
        console.error('Could not retrieve usage record, allowing request');
        return {
          allowed: true,
          used: 0,
          limit: this.maxFreeConversations,
          reason: 'Database error',
        };
      }

      // Check if user is blocked
      if (record.is_blocked) {
        return {
          allowed: false,
          used: record.conversation_count,
          limit: record.daily_limit,
          reason: 'User blocked',
        };
      }

      // Check conversation limit
      const allowed = record.conversation_count < record.daily_limit;

      return {
        allowed,
        used: record.conversation_count,
        limit: record.daily_limit,
        reason: allowed ? undefined : 'Daily conversation limit reached',
      };
    } catch (error) {
      console.error('Error in checkLimit:', error);
      // On error, deny access to be safe
      return {
        allowed: false,
        used: 0,
        limit: this.maxFreeConversations,
        reason: 'System error',
      };
    }
  }

  // Increment conversation count
  async increment(
    request: NextRequest,
    identifiers: UserIdentifiers,
    email?: string
  ): Promise<void> {
    try {
      const composite = this.createCompositeIdentifier(identifiers);
      identifiers.composite = composite;

      const userAgent = request.headers.get('user-agent') || undefined;
      const record = await this.getOrCreateUsageRecord(identifiers, userAgent);

      if (!record) {
        console.error('Could not retrieve usage record for increment');
        return;
      }

      // Increment conversation count
      const { error } = await supabase
        .from('usage_tracking')
        .update({
          conversation_count: record.conversation_count + 1,
          last_conversation_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (error) {
        console.error('Error incrementing conversation count:', error);
      }
    } catch (error) {
      console.error('Error in increment:', error);
    }
  }

  // Get current usage
  async getUsage(
    request: NextRequest,
    identifiers: UserIdentifiers,
    email?: string
  ): Promise<{ used: number; limit: number }> {
    try {
      const composite = this.createCompositeIdentifier(identifiers);
      identifiers.composite = composite;

      const userAgent = request.headers.get('user-agent') || undefined;
      const record = await this.getOrCreateUsageRecord(identifiers, userAgent);

      if (!record) {
        return {
          used: 0,
          limit: this.maxFreeConversations,
        };
      }

      return {
        used: record.conversation_count,
        limit: record.daily_limit,
      };
    } catch (error) {
      console.error('Error in getUsage:', error);
      return {
        used: 0,
        limit: this.maxFreeConversations,
      };
    }
  }

  // Block a user (admin function)
  async blockUser(userIdentifier: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usage_tracking')
        .update({ is_blocked: true, updated_at: new Date().toISOString() })
        .eq('user_identifier', userIdentifier);

      return !error;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  // Unblock a user (admin function)
  async unblockUser(userIdentifier: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usage_tracking')
        .update({ is_blocked: false, updated_at: new Date().toISOString() })
        .eq('user_identifier', userIdentifier);

      return !error;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }

  // Get usage analytics (admin function)
  async getAnalytics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('usage_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching analytics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      return null;
    }
  }
}

export const robustUsageTracker = new RobustUsageTracker();