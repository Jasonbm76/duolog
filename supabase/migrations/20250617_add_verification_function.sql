-- Create the can_send_verification function for rate limiting
CREATE OR REPLACE FUNCTION public.can_send_verification(p_email TEXT, p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recent_attempts INTEGER;
    rate_limit_window INTERVAL := '1 hour';
    max_attempts INTEGER := 3;
BEGIN
    -- Count recent verification attempts for this email/IP combination
    SELECT COUNT(*)
    INTO recent_attempts
    FROM verification_attempts
    WHERE (email = p_email OR ip_address = p_ip_address)
    AND created_at > NOW() - rate_limit_window;
    
    -- Return true if under the limit, false if over
    RETURN recent_attempts < max_attempts;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.can_send_verification(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_send_verification(TEXT, TEXT) TO anon;