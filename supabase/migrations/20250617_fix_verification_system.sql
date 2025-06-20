-- Create verification_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS verification_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_verification_attempts_email_created 
ON verification_attempts(email, created_at);

CREATE INDEX IF NOT EXISTS idx_verification_attempts_ip_created 
ON verification_attempts(ip_address, created_at);

-- Fix the can_send_verification function to return the expected format
CREATE OR REPLACE FUNCTION public.can_send_verification(p_email TEXT, p_ip_address TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recent_attempts INTEGER;
    rate_limit_window INTERVAL := '1 hour';
    max_attempts INTEGER := 3;
    is_allowed BOOLEAN;
BEGIN
    -- Count recent verification attempts for this email/IP combination
    SELECT COUNT(*)
    INTO recent_attempts
    FROM verification_attempts
    WHERE (email = p_email OR ip_address = p_ip_address)
    AND created_at > NOW() - rate_limit_window;
    
    -- Check if under the limit
    is_allowed := recent_attempts < max_attempts;
    
    -- Return JSON object with allowed flag and attempt count
    RETURN json_build_object(
        'allowed', is_allowed,
        'recent_attempts', recent_attempts,
        'max_attempts', max_attempts,
        'time_window', '1 hour'
    );
END;
$$;

-- Create function to record verification attempts
CREATE OR REPLACE FUNCTION public.record_verification_attempt(p_email TEXT, p_ip_address TEXT DEFAULT '')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO verification_attempts (email, ip_address, created_at)
    VALUES (p_email, p_ip_address, NOW());
END;
$$;

-- Create function to generate verification token
CREATE OR REPLACE FUNCTION public.generate_verification_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Generate a random 32-character token
    RETURN encode(gen_random_bytes(24), 'base64');
END;
$$;

-- Create function to verify email token
CREATE OR REPLACE FUNCTION public.verify_email_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    is_expired BOOLEAN;
BEGIN
    -- Find user with this token
    SELECT email, verification_expires_at, email_verified
    INTO user_record
    FROM user_usage
    WHERE verification_token = p_token;
    
    -- Check if token exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid verification token'
        );
    END IF;
    
    -- Check if already verified
    IF user_record.email_verified THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Email already verified'
        );
    END IF;
    
    -- Check if token is expired
    is_expired := user_record.verification_expires_at < NOW();
    IF is_expired THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Verification token has expired'
        );
    END IF;
    
    -- Verify the email
    UPDATE user_usage 
    SET 
        email_verified = true,
        verification_token = NULL,
        verification_expires_at = NULL,
        updated_at = NOW()
    WHERE verification_token = p_token;
    
    RETURN json_build_object(
        'success', true,
        'email', user_record.email
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.can_send_verification(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_send_verification(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_verification_attempt(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_verification_attempt(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_verification_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_verification_token() TO anon;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO anon;

-- Grant table permissions
GRANT INSERT ON verification_attempts TO authenticated;
GRANT INSERT ON verification_attempts TO anon;
GRANT SELECT ON verification_attempts TO authenticated;
GRANT SELECT ON verification_attempts TO anon;