-- Create user_usage table for email-based usage tracking
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    conversations_used INTEGER DEFAULT 0 NOT NULL,
    max_conversations INTEGER DEFAULT 3 NOT NULL,
    fingerprint TEXT,
    ip_address TEXT,
    session_id TEXT,
    has_own_keys BOOLEAN DEFAULT false NOT NULL,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    verification_token TEXT,
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_conversation_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_usage_email ON user_usage(email);
CREATE INDEX IF NOT EXISTS idx_user_usage_fingerprint ON user_usage(fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_usage_verification_token ON user_usage(verification_token);
CREATE INDEX IF NOT EXISTS idx_user_usage_created_at ON user_usage(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read their own usage data" ON user_usage
    FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update their own usage data" ON user_usage
    FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Allow service role to manage all user usage" ON user_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy for anonymous users (for email verification flow)
CREATE POLICY "Allow anonymous access for email verification" ON user_usage
    FOR ALL TO anon USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_usage TO anon;
GRANT ALL ON user_usage TO service_role;