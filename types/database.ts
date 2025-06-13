export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          credits_remaining: number
          credits_total_purchased: number
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'canceled'
          subscription_expires_at: string | null
          default_ai_model_preference: 'chatgpt' | 'claude' | 'balanced'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          credits_remaining?: number
          credits_total_purchased?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'canceled'
          subscription_expires_at?: string | null
          default_ai_model_preference?: 'chatgpt' | 'claude' | 'balanced'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          credits_remaining?: number
          credits_total_purchased?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'canceled'
          subscription_expires_at?: string | null
          default_ai_model_preference?: 'chatgpt' | 'claude' | 'balanced'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          topic: string | null
          collaboration_mode: 'debate' | 'consensus' | 'expert_panel' | 'creative'
          max_rounds: number
          current_round: number
          status: 'active' | 'paused' | 'completed' | 'archived'
          completion_reason: 'max_rounds_reached' | 'user_ended' | 'consensus_reached' | 'timeout' | null
          credits_used: number
          estimated_tokens_used: number
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          topic?: string | null
          collaboration_mode?: 'debate' | 'consensus' | 'expert_panel' | 'creative'
          max_rounds?: number
          current_round?: number
          status?: 'active' | 'paused' | 'completed' | 'archived'
          completion_reason?: 'max_rounds_reached' | 'user_ended' | 'consensus_reached' | 'timeout' | null
          credits_used?: number
          estimated_tokens_used?: number
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          topic?: string | null
          collaboration_mode?: 'debate' | 'consensus' | 'expert_panel' | 'creative'
          max_rounds?: number
          current_round?: number
          status?: 'active' | 'paused' | 'completed' | 'archived'
          completion_reason?: 'max_rounds_reached' | 'user_ended' | 'consensus_reached' | 'timeout' | null
          credits_used?: number
          estimated_tokens_used?: number
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_rounds: {
        Row: {
          id: string
          conversation_id: string
          round_number: number
          exchange_order: number
          ai_model: 'chatgpt-4' | 'chatgpt-3.5' | 'claude-3.5-sonnet' | 'claude-3-haiku' | 'claude-3-opus'
          ai_role: 'questioner' | 'responder' | 'moderator' | 'expert'
          prompt: string
          response: string
          system_message: string | null
          response_time_ms: number | null
          token_count_input: number | null
          token_count_output: number | null
          relevance_score: number | null
          creativity_score: number | null
          helpfulness_score: number | null
          user_rating: number | null
          user_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          round_number: number
          exchange_order: number
          ai_model: 'chatgpt-4' | 'chatgpt-3.5' | 'claude-3.5-sonnet' | 'claude-3-haiku' | 'claude-3-opus'
          ai_role: 'questioner' | 'responder' | 'moderator' | 'expert'
          prompt: string
          response: string
          system_message?: string | null
          response_time_ms?: number | null
          token_count_input?: number | null
          token_count_output?: number | null
          relevance_score?: number | null
          creativity_score?: number | null
          helpfulness_score?: number | null
          user_rating?: number | null
          user_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          round_number?: number
          exchange_order?: number
          ai_model?: 'chatgpt-4' | 'chatgpt-3.5' | 'claude-3.5-sonnet' | 'claude-3-haiku' | 'claude-3-opus'
          ai_role?: 'questioner' | 'responder' | 'moderator' | 'expert'
          prompt?: string
          response?: string
          system_message?: string | null
          response_time_ms?: number | null
          token_count_input?: number | null
          token_count_output?: number | null
          relevance_score?: number | null
          creativity_score?: number | null
          helpfulness_score?: number | null
          user_rating?: number | null
          user_feedback?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_rounds_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_analytics: {
        Row: {
          id: string
          date_tracked: string
          hour_tracked: number | null
          user_id: string | null
          conversations_started: number
          conversations_completed: number
          total_rounds_processed: number
          total_credits_consumed: number
          total_tokens_processed: number
          chatgpt_requests: number
          claude_requests: number
          avg_response_time_ms: number | null
          avg_user_rating: number | null
          collaboration_mode_usage: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date_tracked: string
          hour_tracked?: number | null
          user_id?: string | null
          conversations_started?: number
          conversations_completed?: number
          total_rounds_processed?: number
          total_credits_consumed?: number
          total_tokens_processed?: number
          chatgpt_requests?: number
          claude_requests?: number
          avg_response_time_ms?: number | null
          avg_user_rating?: number | null
          collaboration_mode_usage?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date_tracked?: string
          hour_tracked?: number | null
          user_id?: string | null
          conversations_started?: number
          conversations_completed?: number
          total_rounds_processed?: number
          total_credits_consumed?: number
          total_tokens_processed?: number
          chatgpt_requests?: number
          claude_requests?: number
          avg_response_time_ms?: number | null
          avg_user_rating?: number | null
          collaboration_mode_usage?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type ConversationRound = Database['public']['Tables']['conversation_rounds']['Row']
export type ConversationRoundInsert = Database['public']['Tables']['conversation_rounds']['Insert']
export type ConversationRoundUpdate = Database['public']['Tables']['conversation_rounds']['Update']

export type UsageAnalytics = Database['public']['Tables']['usage_analytics']['Row']
export type UsageAnalyticsInsert = Database['public']['Tables']['usage_analytics']['Insert']
export type UsageAnalyticsUpdate = Database['public']['Tables']['usage_analytics']['Update']

// Extended types for UI components
export type ConversationWithRounds = Conversation & {
  conversation_rounds: ConversationRound[]
}

export type CollaborationMode = 'debate' | 'consensus' | 'expert_panel' | 'creative'
export type ConversationStatus = 'active' | 'paused' | 'completed' | 'archived'
export type AIModel = 'chatgpt-4' | 'chatgpt-3.5' | 'claude-3.5-sonnet' | 'claude-3-haiku' | 'claude-3-opus'
export type AIRole = 'questioner' | 'responder' | 'moderator' | 'expert'
export type SubscriptionTier = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled'