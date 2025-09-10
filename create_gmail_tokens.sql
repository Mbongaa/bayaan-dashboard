-- Gmail Tokens Table Creation Script
-- Run this in Supabase SQL Editor

-- Create gmail_tokens table
CREATE TABLE IF NOT EXISTS public.gmail_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_tokens TEXT NOT NULL,
    gmail_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_active_user UNIQUE(user_id, is_active) WHERE is_active = true,
    CONSTRAINT check_email_length CHECK (char_length(gmail_email) > 0),
    CONSTRAINT check_tokens_length CHECK (char_length(encrypted_tokens) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON public.gmail_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_active ON public.gmail_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_email ON public.gmail_tokens(gmail_email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own Gmail tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Users can insert their own Gmail tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Users can update their own Gmail tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Users can delete their own Gmail tokens" ON public.gmail_tokens;

-- Policy: Users can only view their own Gmail tokens
CREATE POLICY "Users can view their own Gmail tokens" ON public.gmail_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own Gmail tokens
CREATE POLICY "Users can insert their own Gmail tokens" ON public.gmail_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own Gmail tokens
CREATE POLICY "Users can update their own Gmail tokens" ON public.gmail_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own Gmail tokens
CREATE POLICY "Users can delete their own Gmail tokens" ON public.gmail_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gmail_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists
DROP TRIGGER IF EXISTS gmail_tokens_updated_at_trigger ON public.gmail_tokens;

-- Create trigger to automatically update updated_at
CREATE TRIGGER gmail_tokens_updated_at_trigger
    BEFORE UPDATE ON public.gmail_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_gmail_tokens_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.gmail_tokens TO authenticated;
GRANT ALL ON public.gmail_tokens TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.gmail_tokens IS 'Stores encrypted Gmail OAuth tokens for users';
COMMENT ON COLUMN public.gmail_tokens.user_id IS 'Reference to the user who owns this Gmail token';
COMMENT ON COLUMN public.gmail_tokens.encrypted_tokens IS 'JWT-encrypted Gmail OAuth tokens (access_token, refresh_token, etc.)';
COMMENT ON COLUMN public.gmail_tokens.gmail_email IS 'The Gmail email address associated with these tokens';
COMMENT ON COLUMN public.gmail_tokens.is_active IS 'Whether this token record is currently active (only one active per user)';

-- Verify the table was created
SELECT 
    'Table created successfully!' as status,
    COUNT(*) as row_count 
FROM public.gmail_tokens;