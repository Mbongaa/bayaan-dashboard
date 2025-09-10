-- Gmail Tokens Table Migration
-- This script creates the necessary table for storing encrypted Gmail OAuth tokens

-- Create gmail_tokens table
CREATE TABLE IF NOT EXISTS gmail_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_tokens TEXT NOT NULL,
    gmail_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, is_active) WHERE is_active = true,
    CHECK (char_length(gmail_email) > 0),
    CHECK (char_length(encrypted_tokens) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON gmail_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_active ON gmail_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_email ON gmail_tokens(gmail_email);

-- Row Level Security (RLS)
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own Gmail tokens
CREATE POLICY gmail_tokens_user_policy ON gmail_tokens
    FOR ALL USING (
        auth.uid() = user_id
    );

-- Policy: Allow insert for authenticated users
CREATE POLICY gmail_tokens_insert_policy ON gmail_tokens
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gmail_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER gmail_tokens_updated_at_trigger
    BEFORE UPDATE ON gmail_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_gmail_tokens_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON gmail_tokens TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE gmail_tokens_id_seq TO authenticated;

-- Comments for documentation
COMMENT ON TABLE gmail_tokens IS 'Stores encrypted Gmail OAuth tokens for users';
COMMENT ON COLUMN gmail_tokens.user_id IS 'Reference to the user who owns this Gmail token';
COMMENT ON COLUMN gmail_tokens.encrypted_tokens IS 'JWT-encrypted Gmail OAuth tokens (access_token, refresh_token, etc.)';
COMMENT ON COLUMN gmail_tokens.gmail_email IS 'The Gmail email address associated with these tokens';
COMMENT ON COLUMN gmail_tokens.is_active IS 'Whether this token record is currently active (only one active per user)';

-- Example usage (for testing):
/*
-- Insert a test token (replace with actual encrypted token)
INSERT INTO gmail_tokens (user_id, encrypted_tokens, gmail_email)
VALUES (
    auth.uid(),
    'encrypted_token_here',
    'user@gmail.com'
);

-- Query user's active Gmail token
SELECT * FROM gmail_tokens 
WHERE user_id = auth.uid() AND is_active = true;

-- Deactivate old tokens when adding new one
UPDATE gmail_tokens 
SET is_active = false 
WHERE user_id = auth.uid() AND is_active = true;
*/