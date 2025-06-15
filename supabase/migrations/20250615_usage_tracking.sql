-- Create usage tracking table for robust anti-abuse protection
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-layer user identification
  user_identifier TEXT NOT NULL, -- Primary composite identifier
  ip_address INET NOT NULL,
  browser_fingerprint TEXT,
  persistent_id TEXT,
  session_id TEXT,
  
  -- Usage tracking
  conversation_count INTEGER DEFAULT 0 NOT NULL,
  daily_limit INTEGER DEFAULT 5 NOT NULL,
  
  -- Timestamps
  first_conversation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_conversation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional security fields
  user_agent TEXT,
  country_code TEXT,
  is_vpn BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT valid_conversation_count CHECK (conversation_count >= 0),
  CONSTRAINT valid_daily_limit CHECK (daily_limit >= 0)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_identifier ON usage_tracking(user_identifier);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_ip_address ON usage_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_browser_fingerprint ON usage_tracking(browser_fingerprint);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_persistent_id ON usage_tracking(persistent_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_last_conversation_at ON usage_tracking(last_conversation_at);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);

-- Create composite index for multi-factor lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_composite ON usage_tracking(ip_address, browser_fingerprint, persistent_id);

-- Create partial index for active users (not blocked)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_active ON usage_tracking(user_identifier, last_conversation_at) 
WHERE is_blocked = FALSE;

-- Enable Row Level Security
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for API access (service role only)
CREATE POLICY "usage_tracking_api_access" ON usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old usage records (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_usage_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete records older than 30 days
    DELETE FROM usage_tracking 
    WHERE last_conversation_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset daily usage counts (call this daily via cron)
CREATE OR REPLACE FUNCTION reset_daily_usage_counts()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    -- Reset conversation counts for records where last conversation was more than 24 hours ago
    UPDATE usage_tracking 
    SET conversation_count = 0,
        updated_at = NOW()
    WHERE last_conversation_at < NOW() - INTERVAL '24 hours'
    AND conversation_count > 0;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for analytics (optional) - renamed to avoid conflict with existing table
CREATE OR REPLACE VIEW usage_tracking_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as unique_users,
    SUM(conversation_count) as total_conversations,
    AVG(conversation_count) as avg_conversations_per_user,
    COUNT(*) FILTER (WHERE conversation_count >= daily_limit) as users_at_limit,
    COUNT(*) FILTER (WHERE is_blocked = TRUE) as blocked_users
FROM usage_tracking
GROUP BY DATE(created_at)
ORDER BY date DESC;