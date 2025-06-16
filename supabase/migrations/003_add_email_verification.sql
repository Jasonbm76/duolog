-- Add email verification columns to user_usage table
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_verification_token ON user_usage(verification_token);

-- Create verification_attempts table to track and limit verification emails
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempts_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_attempts_email ON verification_attempts(email);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_ip ON verification_attempts(ip_address);

-- Function to generate secure verification token
CREATE OR REPLACE FUNCTION generate_verification_token() 
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to check verification attempt limits (max 5 per email per hour)
CREATE OR REPLACE FUNCTION can_send_verification(
  p_email TEXT,
  p_ip_address TEXT
) RETURNS JSONB AS $$
DECLARE
  email_attempts INTEGER;
  ip_attempts INTEGER;
  result JSONB;
BEGIN
  -- Check email attempts in last hour
  SELECT COALESCE(SUM(attempts_count), 0) INTO email_attempts
  FROM verification_attempts 
  WHERE email = p_email 
  AND last_attempt_at > NOW() - INTERVAL '1 hour';
  
  -- Check IP attempts in last hour
  SELECT COALESCE(SUM(attempts_count), 0) INTO ip_attempts
  FROM verification_attempts 
  WHERE ip_address = p_ip_address 
  AND last_attempt_at > NOW() - INTERVAL '1 hour';
  
  result := jsonb_build_object(
    'allowed', (email_attempts < 5 AND ip_attempts < 10),
    'email_attempts', email_attempts,
    'ip_attempts', ip_attempts,
    'email_limit', 5,
    'ip_limit', 10
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to record verification attempt
CREATE OR REPLACE FUNCTION record_verification_attempt(
  p_email TEXT,
  p_ip_address TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO verification_attempts (email, ip_address, attempts_count, last_attempt_at)
  VALUES (p_email, p_ip_address, 1, NOW())
  ON CONFLICT (email) 
  DO UPDATE SET 
    attempts_count = verification_attempts.attempts_count + 1,
    last_attempt_at = NOW(),
    ip_address = p_ip_address;
END;
$$ LANGUAGE plpgsql;

-- Function to verify email token
CREATE OR REPLACE FUNCTION verify_email_token(
  p_token TEXT
) RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  result JSONB;
BEGIN
  -- Find user with matching token that hasn't expired
  SELECT * INTO user_record
  FROM user_usage 
  WHERE verification_token = p_token 
  AND verification_expires_at > NOW()
  AND email_verified = false;
  
  IF NOT FOUND THEN
    result := jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired verification token'
    );
  ELSE
    -- Mark email as verified and clear token
    UPDATE user_usage 
    SET 
      email_verified = true,
      verification_token = NULL,
      verification_expires_at = NULL,
      updated_at = NOW()
    WHERE id = user_record.id;
    
    result := jsonb_build_object(
      'success', true,
      'email', user_record.email,
      'user_id', user_record.id
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired verification tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE user_usage 
  SET 
    verification_token = NULL,
    verification_expires_at = NULL,
    updated_at = NOW()
  WHERE verification_expires_at < NOW()
  AND email_verified = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;