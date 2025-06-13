import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Create the main Supabase client for client-side operations
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Server-side client with service role (for admin operations)
export const createServerClient = () => {
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper functions for common operations
export const auth = supabase.auth;

// User management helpers
export const userHelpers = {
  getCurrentUser: async () => {
    const { data: { user }, error } = await auth.getUser();
    if (error) throw error;
    return user;
  },

  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signUpWithEmail: async (email: string, password: string, displayName?: string) => {
    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await auth.signOut();
    if (error) throw error;
  },

  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  updateUserProfile: async (userId: string, updates: Partial<Database['public']['Tables']['users']['Update']>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Conversation helpers
export const conversationHelpers = {
  createConversation: async (conversation: Database['public']['Tables']['conversations']['Insert']) => {
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getUserConversations: async (userId: string, limit = 20, offset = 0) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  getConversation: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_rounds (*)
      `)
      .eq('id', conversationId)
      .single();
    
    if (error) throw error;
    return data;
  },

  updateConversation: async (conversationId: string, updates: Database['public']['Tables']['conversations']['Update']) => {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  addConversationRound: async (round: Database['public']['Tables']['conversation_rounds']['Insert']) => {
    const { data, error } = await supabase
      .from('conversation_rounds')
      .insert(round)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Analytics helpers
export const analyticsHelpers = {
  recordUsage: async (analytics: Database['public']['Tables']['usage_analytics']['Insert']) => {
    const { data, error } = await supabase
      .from('usage_analytics')
      .upsert(analytics, { 
        onConflict: 'date_tracked,hour_tracked,user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getUsageAnalytics: async (startDate: string, endDate: string, userId?: string) => {
    let query = supabase
      .from('usage_analytics')
      .select('*')
      .gte('date_tracked', startDate)
      .lte('date_tracked', endDate);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('date_tracked', { ascending: true });
    
    if (error) throw error;
    return data;
  },
};

// Real-time subscription helpers
export const subscriptions = {
  subscribeToConversationUpdates: (conversationId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_rounds',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToUserUpdates: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};