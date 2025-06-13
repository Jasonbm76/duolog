-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  
  -- Credit system for AI usage
  credits_remaining INTEGER DEFAULT 100 NOT NULL,
  credits_total_purchased INTEGER DEFAULT 100 NOT NULL,
  
  -- Subscription tracking
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'canceled')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- User preferences
  default_ai_model_preference VARCHAR(50) DEFAULT 'balanced' CHECK (default_ai_model_preference IN ('chatgpt', 'claude', 'balanced')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conversations table (AI collaboration sessions)
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Conversation metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  topic VARCHAR(100),
  
  -- Conversation settings
  collaboration_mode VARCHAR(20) DEFAULT 'debate' CHECK (collaboration_mode IN ('debate', 'consensus', 'expert_panel', 'creative')),
  max_rounds INTEGER DEFAULT 5 CHECK (max_rounds > 0 AND max_rounds <= 20),
  current_round INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  completion_reason VARCHAR(50) CHECK (completion_reason IN ('max_rounds_reached', 'user_ended', 'consensus_reached', 'timeout')),
  
  -- Cost tracking
  credits_used INTEGER DEFAULT 0 NOT NULL,
  estimated_tokens_used INTEGER DEFAULT 0,
  
  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conversation_rounds table (ChatGPT ↔ Claude exchanges)
CREATE TABLE public.conversation_rounds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  
  -- Round identification
  round_number INTEGER NOT NULL,
  exchange_order INTEGER NOT NULL, -- Order within the round (for multiple exchanges)
  
  -- AI Model information
  ai_model VARCHAR(20) NOT NULL CHECK (ai_model IN ('chatgpt-4', 'chatgpt-3.5', 'claude-3.5-sonnet', 'claude-3-haiku', 'claude-3-opus')),
  ai_role VARCHAR(20) NOT NULL CHECK (ai_role IN ('questioner', 'responder', 'moderator', 'expert')),
  
  -- Message content
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  system_message TEXT,
  
  -- Response metadata
  response_time_ms INTEGER,
  token_count_input INTEGER,
  token_count_output INTEGER,
  
  -- Quality metrics
  relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  creativity_score DECIMAL(3,2) CHECK (creativity_score >= 0 AND creativity_score <= 1),
  helpfulness_score DECIMAL(3,2) CHECK (helpfulness_score >= 0 AND helpfulness_score <= 1),
  
  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique round/exchange combination per conversation
  UNIQUE(conversation_id, round_number, exchange_order)
);

-- Create usage_analytics table (admin dashboard)
CREATE TABLE public.usage_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Analytics dimensions
  date_tracked DATE NOT NULL,
  hour_tracked INTEGER CHECK (hour_tracked >= 0 AND hour_tracked <= 23),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Metrics
  conversations_started INTEGER DEFAULT 0,
  conversations_completed INTEGER DEFAULT 0,
  total_rounds_processed INTEGER DEFAULT 0,
  total_credits_consumed INTEGER DEFAULT 0,
  total_tokens_processed INTEGER DEFAULT 0,
  
  -- AI model usage breakdown
  chatgpt_requests INTEGER DEFAULT 0,
  claude_requests INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_response_time_ms DECIMAL(10,2),
  avg_user_rating DECIMAL(3,2),
  
  -- Feature usage
  collaboration_mode_usage JSONB, -- {"debate": 5, "consensus": 2, etc.}
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique analytics per date/hour combination
  UNIQUE(date_tracked, hour_tracked, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);

CREATE INDEX idx_conversation_rounds_conversation_id ON public.conversation_rounds(conversation_id);
CREATE INDEX idx_conversation_rounds_round_number ON public.conversation_rounds(conversation_id, round_number);
CREATE INDEX idx_conversation_rounds_ai_model ON public.conversation_rounds(ai_model);
CREATE INDEX idx_conversation_rounds_created_at ON public.conversation_rounds(created_at);

CREATE INDEX idx_usage_analytics_date_tracked ON public.usage_analytics(date_tracked);
CREATE INDEX idx_usage_analytics_user_id ON public.usage_analytics(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_analytics_updated_at BEFORE UPDATE ON public.usage_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see rounds from their own conversations
CREATE POLICY "Users can view own conversation rounds" ON public.conversation_rounds
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own conversation rounds" ON public.conversation_rounds
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own conversation rounds" ON public.conversation_rounds
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE user_id = auth.uid()
        )
    );

-- Usage analytics: Users can only see their own data, admins can see all
CREATE POLICY "Users can view own analytics" ON public.usage_analytics
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT id FROM public.users WHERE subscription_tier = 'enterprise'
        )
    );

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();