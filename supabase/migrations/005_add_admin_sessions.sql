-- Admin session management
-- Stores admin verification tokens and session tokens

CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    verification_token TEXT,
    session_token TEXT,
    expires_at TIMESTAMPTZ,
    session_expires_at TIMESTAMPTZ,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Indexes for performance
    CONSTRAINT admin_sessions_email_key UNIQUE (email)
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_verification_token 
ON admin_sessions (verification_token) 
WHERE verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_token 
ON admin_sessions (session_token) 
WHERE session_token IS NOT NULL;

-- Auto-cleanup expired sessions (optional, but good practice)
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions 
    WHERE (expires_at IS NOT NULL AND expires_at < NOW())
       OR (session_expires_at IS NOT NULL AND session_expires_at < NOW());
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up automatic cleanup (runs daily)
-- You can enable this if you want automatic cleanup
-- SELECT cron.schedule('cleanup-admin-sessions', '0 2 * * *', 'SELECT cleanup_expired_admin_sessions();');

-- Row Level Security (RLS) - Admin sessions should only be accessible via service role
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access admin sessions
CREATE POLICY "No public access to admin sessions" 
ON admin_sessions 
FOR ALL 
TO public 
USING (false);

-- Grant access to service role
GRANT ALL ON admin_sessions TO service_role;