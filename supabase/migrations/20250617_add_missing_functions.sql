-- Create missing functions for abuse detection and conversation logging

-- Create usage_abuse_log table for tracking suspicious activity
CREATE TABLE IF NOT EXISTS usage_abuse_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    fingerprint TEXT,
    ip_address TEXT,
    abuse_type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create conversation_log table for analytics
CREATE TABLE IF NOT EXISTS conversation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    conversation_id TEXT,
    user_prompt_length INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_abuse_log_email ON usage_abuse_log(email);
CREATE INDEX IF NOT EXISTS idx_usage_abuse_log_created ON usage_abuse_log(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_log_email ON conversation_log(email);
CREATE INDEX IF NOT EXISTS idx_conversation_log_created ON conversation_log(created_at);

-- Create check_suspicious_activity function
CREATE OR REPLACE FUNCTION public.check_suspicious_activity(
    p_email TEXT, 
    p_fingerprint TEXT, 
    p_ip_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    abuse_count INTEGER;
    rate_limit_window INTERVAL := '24 hours';
    max_abuse_attempts INTEGER := 10;
    abuse_detected BOOLEAN := false;
BEGIN
    -- Count abuse attempts in the last 24 hours for this email/fingerprint/IP
    SELECT COUNT(*)
    INTO abuse_count
    FROM usage_abuse_log
    WHERE (email = p_email OR fingerprint = p_fingerprint OR ip_address = p_ip_address)
    AND created_at > NOW() - rate_limit_window;
    
    -- Determine if this looks suspicious
    abuse_detected := abuse_count >= max_abuse_attempts;
    
    -- Log if this looks suspicious
    IF abuse_detected THEN
        INSERT INTO usage_abuse_log (email, fingerprint, ip_address, abuse_type, details)
        VALUES (p_email, p_fingerprint, p_ip_address, 'rate_limit_exceeded', 
                format('Exceeded %s attempts in %s', max_abuse_attempts, rate_limit_window));
    END IF;
    
    RETURN json_build_object(
        'abuse_detected', abuse_detected,
        'abuse_count', abuse_count,
        'max_attempts', max_abuse_attempts,
        'time_window', rate_limit_window::text
    );
END;
$$;

-- Create log_conversation_start function
CREATE OR REPLACE FUNCTION public.log_conversation_start(
    p_email TEXT,
    p_conversation_id TEXT DEFAULT NULL,
    p_user_prompt_length INTEGER DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO conversation_log (
        email, 
        conversation_id, 
        user_prompt_length, 
        ip_address, 
        user_agent,
        created_at
    )
    VALUES (
        p_email, 
        p_conversation_id, 
        p_user_prompt_length, 
        p_ip_address, 
        p_user_agent,
        NOW()
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_suspicious_activity(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_suspicious_activity(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.log_conversation_start(TEXT, TEXT, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_conversation_start(TEXT, TEXT, INTEGER, TEXT, TEXT) TO anon;

-- Grant table permissions
GRANT SELECT, INSERT ON usage_abuse_log TO authenticated;
GRANT SELECT, INSERT ON usage_abuse_log TO anon;
GRANT SELECT, INSERT ON conversation_log TO authenticated;
GRANT SELECT, INSERT ON conversation_log TO anon;