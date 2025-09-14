-- Create outlook_tokens table for storing Microsoft Outlook/Office 365 OAuth tokens
CREATE TABLE IF NOT EXISTS outlook_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    outlook_email TEXT NOT NULL,
    encrypted_tokens TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add foreign key constraint to auth.users
    CONSTRAINT fk_user
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_outlook_tokens_user_id ON outlook_tokens(user_id);

-- Create index for email lookups
CREATE INDEX idx_outlook_tokens_email ON outlook_tokens(outlook_email);

-- Add RLS (Row Level Security) policies
ALTER TABLE outlook_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tokens
CREATE POLICY "Users can view own outlook tokens" ON outlook_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own outlook tokens" ON outlook_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own outlook tokens" ON outlook_tokens
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete own outlook tokens" ON outlook_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_outlook_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_outlook_tokens_updated_at_trigger
    BEFORE UPDATE ON outlook_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_outlook_tokens_updated_at();

-- Add comment to the table for documentation
COMMENT ON TABLE outlook_tokens IS 'Stores encrypted OAuth tokens for Microsoft Outlook/Office 365 email integration';
COMMENT ON COLUMN outlook_tokens.user_id IS 'Reference to the authenticated user';
COMMENT ON COLUMN outlook_tokens.outlook_email IS 'The Outlook email address associated with these tokens';
COMMENT ON COLUMN outlook_tokens.encrypted_tokens IS 'JWT-encrypted OAuth tokens (access_token, refresh_token, etc.)';
COMMENT ON COLUMN outlook_tokens.expires_at IS 'When the access token expires';