-- Add email column to existing usage tracking table
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_email ON usage_tracking(email);

-- Create composite index for email + browser_fingerprint fraud detection (production has browser_fingerprint, not fingerprint)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_email_fingerprint ON usage_tracking(email, browser_fingerprint);

-- Create a dedicated user_usage table for cleaner email-based tracking
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  conversations_used INTEGER DEFAULT 0,
  max_conversations INTEGER DEFAULT 3,
  fingerprint TEXT,
  ip_address TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_own_keys BOOLEAN DEFAULT false,
  last_conversation_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_usage_email ON user_usage(email);
CREATE INDEX IF NOT EXISTS idx_user_usage_fingerprint ON user_usage(fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_usage_session ON user_usage(session_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_updated_at();

-- Create abuse tracking table for fraud detection
CREATE TABLE IF NOT EXISTS usage_abuse_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  fingerprint TEXT,
  ip_address TEXT,
  abuse_type TEXT, -- 'multiple_emails', 'multiple_fingerprints', 'suspicious_pattern'
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_log_email ON usage_abuse_log(email);
CREATE INDEX IF NOT EXISTS idx_abuse_log_fingerprint ON usage_abuse_log(fingerprint);
CREATE INDEX IF NOT EXISTS idx_abuse_log_created_at ON usage_abuse_log(created_at);

-- Function to check and flag suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity(
  p_email TEXT,
  p_fingerprint TEXT,
  p_ip_address TEXT
) RETURNS JSONB AS $$
DECLARE
  multiple_emails INTEGER;
  multiple_fingerprints INTEGER;
  result JSONB;
BEGIN
  -- Check how many emails this fingerprint has used
  SELECT COUNT(DISTINCT email) INTO multiple_emails
  FROM user_usage 
  WHERE fingerprint = p_fingerprint AND email IS NOT NULL;
  
  -- Check how many fingerprints this email has used
  SELECT COUNT(DISTINCT fingerprint) INTO multiple_fingerprints
  FROM user_usage 
  WHERE email = p_email AND fingerprint IS NOT NULL;
  
  result := jsonb_build_object(
    'suspicious', false,
    'multiple_emails', multiple_emails,
    'multiple_fingerprints', multiple_fingerprints,
    'abuse_detected', false
  );
  
  -- Flag if suspicious patterns detected
  IF multiple_emails > 3 OR multiple_fingerprints > 3 THEN
    result := jsonb_set(result, '{suspicious}', 'true');
    result := jsonb_set(result, '{abuse_detected}', 'true');
    
    -- Log the abuse
    INSERT INTO usage_abuse_log (email, fingerprint, ip_address, abuse_type, details)
    VALUES (
      p_email, 
      p_fingerprint, 
      p_ip_address,
      CASE 
        WHEN multiple_emails > 3 THEN 'multiple_emails'
        WHEN multiple_fingerprints > 3 THEN 'multiple_fingerprints'
        ELSE 'suspicious_pattern'
      END,
      jsonb_build_object(
        'multiple_emails', multiple_emails,
        'multiple_fingerprints', multiple_fingerprints,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;