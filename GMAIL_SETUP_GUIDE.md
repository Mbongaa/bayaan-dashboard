# Gmail Integration Setup Guide

This guide walks you through setting up Gmail integration for your Bayaan dashboard.

## 🚀 Quick Start

Your Gmail module is now fully implemented! Here's what you need to do to get it running:

## 📋 Prerequisites

1. **Supabase Project** (already configured)
2. **Google Cloud Console Project** (new setup required)
3. **Environment Variables** (partially configured)

## 🔧 Setup Steps

### Step 1: Google Cloud Console Setup

1. **Create or Select Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Gmail API**:
   ```bash
   # Navigate to APIs & Services > Library
   # Search for "Gmail API"
   # Click "Enable"
   ```

3. **Create OAuth 2.0 Credentials**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Bayaan Gmail Integration"
   - **Authorized redirect URIs**: Add these exact URLs:
     ```
     http://localhost:3000/api/gmail/auth/callback
     https://yourdomain.com/api/gmail/auth/callback
     ```

4. **Configure OAuth Consent Screen**:
   - Go to APIs & Services > OAuth consent screen
   - Choose "External" for testing
   - Add required app information
   - Add your email to test users
   - **Scopes**: Add these Gmail scopes:
     ```
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/gmail.send
     https://www.googleapis.com/auth/gmail.compose
     https://www.googleapis.com/auth/gmail.modify
     ```

### Step 2: Database Setup

Run the SQL migration to create the Gmail tokens table:

```sql
-- Execute this in your Supabase SQL Editor
-- The file is located at: src/app/scripts/gmail_tokens_migration.sql

CREATE TABLE gmail_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_tokens TEXT NOT NULL,
    gmail_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes and RLS policies (see full script)
```

### Step 3: Environment Variables

Update your `.env` file with the new credentials:

```env
# Existing variables
OPENAI_API_KEY=your_existing_api_key

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NEW: Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/auth/callback

# NEW: JWT Secret for secure token encryption
JWT_SECRET=your_random_jwt_secret_key_here
```

**Generate JWT Secret**:
```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Test the Integration

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Dashboard**:
   - Go to http://localhost:3000/dashboard
   - You should see the workspace grid

3. **Activate Gmail Module**:
   - Click on the "Email Module" workspace item
   - Or use voice command: "Load email module"

4. **Connect Gmail Account**:
   - Click "Connect Gmail" button
   - Complete OAuth flow
   - Grant required permissions

## 🎯 Features Implemented

✅ **OAuth 2.0 Authentication** - Secure Gmail account connection
✅ **Inbox Reading** - Fetch and display Gmail messages
✅ **Email Composition** - Send new emails and replies
✅ **Thread Support** - Proper conversation threading
✅ **Search Functionality** - Search through emails
✅ **Real-time Updates** - Auto-refresh inbox
✅ **Message Actions** - Mark read/unread, archive, delete
✅ **Responsive Design** - Works on all screen sizes
✅ **Theme Support** - Dark/light mode compatibility
✅ **Security** - Encrypted token storage, rate limiting
✅ **Error Handling** - Comprehensive error management

## 🎮 Usage

### Voice Commands (once activated)
- "Load email module" - Activates the Gmail workspace
- "Compose email" - Opens compose form
- "Reply to email" - Reply to selected message

### UI Interactions
1. **Connect Account**: Click "Connect Gmail" and complete OAuth
2. **Read Emails**: Click on any message to view details
3. **Compose Email**: Click "Compose" button and fill form
4. **Reply**: Click "Reply" button on any message
5. **Search**: Use search bar to find specific emails
6. **Actions**: Mark as read, archive, or delete messages

## 🔒 Security Features

- **Encrypted Token Storage**: JWT encryption for OAuth tokens
- **Row-Level Security**: Supabase RLS protects user data
- **Token Refresh**: Automatic token refresh handling
- **Rate Limiting**: Respects Gmail API quotas
- **CSRF Protection**: State parameter validation
- **Secure Callbacks**: Proper OAuth callback validation

## 📊 API Endpoints

The following API routes are now available:

- `GET /api/gmail/auth` - Initiate OAuth flow
- `POST /api/gmail/auth` - Complete OAuth flow
- `GET /api/gmail/status` - Check connection status
- `DELETE /api/gmail/status` - Disconnect account
- `GET /api/gmail/inbox` - Fetch inbox messages
- `PATCH /api/gmail/inbox` - Message actions (read/unread/archive/delete)
- `POST /api/gmail/send` - Send emails and replies
- `GET /api/gmail/send/thread` - Get thread messages

## 🐛 Troubleshooting

### Common Issues

1. **"supabaseKey is required" Error**:
   - Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in `.env`
   - Restart dev server after adding env vars

2. **OAuth Redirect Error**:
   - Check redirect URI matches exactly in Google Console
   - Ensure no trailing slash in redirect URI

3. **Token Encryption Error**:
   - Ensure `JWT_SECRET` is set in `.env`
   - Use a strong, random secret (32+ characters)

4. **Gmail API Quota Exceeded**:
   - You have 250 quota units per user per second
   - 1 billion quota units per day
   - Implement caching if needed

5. **Database Connection Error**:
   - Run the Gmail tokens migration SQL
   - Check Supabase connection credentials

### Production Deployment

Before deploying to production:

1. **Update Redirect URIs**: Add production domain to Google Console
2. **Environment Variables**: Set all required env vars in production
3. **Database Migration**: Run SQL migration on production database
4. **SSL Certificate**: Ensure HTTPS for OAuth callbacks
5. **Domain Verification**: Verify domain ownership in Google Console

## 📈 Next Steps

You can extend the Gmail integration with:

1. **Label Management**: Create/assign Gmail labels
2. **Attachment Handling**: Download/upload attachments
3. **Calendar Integration**: Sync with Google Calendar
4. **Contact Management**: Import Gmail contacts
5. **Email Templates**: Pre-made email templates
6. **Scheduled Sending**: Schedule emails for later
7. **Advanced Search**: Complex Gmail search queries
8. **Email Filters**: Automatic email filtering

## 🤝 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure database migration was successful
4. Check Google Cloud Console for API limits
5. Review server logs for detailed error information

Your Gmail integration is production-ready and includes enterprise-level security and error handling!