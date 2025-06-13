-- Create early_access table for email signups
CREATE TABLE IF NOT EXISTS public.early_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    source TEXT DEFAULT 'landing_page',
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    confirmed BOOLEAN DEFAULT false,
    confirmation_token UUID DEFAULT gen_random_uuid(),
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Create index on email for faster lookups
CREATE INDEX idx_early_access_email ON public.early_access(email);
CREATE INDEX idx_early_access_confirmation_token ON public.early_access(confirmation_token);

-- Enable Row Level Security
ALTER TABLE public.early_access ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows insert from everyone (for signups)
CREATE POLICY "Allow public inserts" ON public.early_access
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);

-- Create a policy that allows read for service role only
CREATE POLICY "Service role can read all" ON public.early_access
    FOR SELECT
    TO service_role
    USING (true);

-- Create a policy that allows updates for service role only
CREATE POLICY "Service role can update all" ON public.early_access
    FOR UPDATE
    TO service_role
    USING (true);

-- Add comment to the table
COMMENT ON TABLE public.early_access IS 'Stores early access email signups for Duolog.ai';