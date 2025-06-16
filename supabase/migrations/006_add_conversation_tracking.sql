-- Create conversation tracking table for analytics
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  conversation_id TEXT, -- frontend conversation ID if available
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  rounds_completed INTEGER DEFAULT 0,
  user_prompt_length INTEGER,
  total_response_length INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_conversation_history_email ON conversation_history(email);
CREATE INDEX IF NOT EXISTS idx_conversation_history_started_at ON conversation_history(started_at);
-- Remove the date index for now - it requires an immutable function
-- CREATE INDEX IF NOT EXISTS idx_conversation_history_date ON conversation_history(DATE(started_at));

-- Create a function to get daily conversation counts
CREATE OR REPLACE FUNCTION get_daily_conversation_counts(
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  date DATE,
  conversation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ch.started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York') as date,
    COUNT(*) as conversation_count
  FROM conversation_history ch
  WHERE ch.started_at >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
    AND ch.started_at <= (CURRENT_DATE + INTERVAL '1 day')
  GROUP BY DATE(ch.started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York')
  ORDER BY DATE(ch.started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York');
END;
$$ LANGUAGE plpgsql;

-- Create function to log conversation start
CREATE OR REPLACE FUNCTION log_conversation_start(
  p_email TEXT,
  p_conversation_id TEXT DEFAULT NULL,
  p_user_prompt_length INTEGER DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  conversation_log_id UUID;
BEGIN
  INSERT INTO conversation_history (
    email,
    conversation_id,
    user_prompt_length,
    ip_address,
    user_agent
  ) VALUES (
    p_email,
    p_conversation_id,
    p_user_prompt_length,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO conversation_log_id;
  
  RETURN conversation_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update conversation completion
CREATE OR REPLACE FUNCTION log_conversation_complete(
  p_conversation_log_id UUID,
  p_rounds_completed INTEGER DEFAULT NULL,
  p_total_response_length INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE conversation_history 
  SET 
    completed_at = NOW(),
    rounds_completed = COALESCE(p_rounds_completed, rounds_completed),
    total_response_length = COALESCE(p_total_response_length, total_response_length)
  WHERE id = p_conversation_log_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;