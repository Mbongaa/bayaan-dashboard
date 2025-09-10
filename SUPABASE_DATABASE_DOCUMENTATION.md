# Supabase Database Documentation

## Overview
This document provides comprehensive information about your Supabase database structure, authentication setup, and integration with the application.

## Database Connection
- **URL**: `https://ydvnjufaltgdrqhvsuke.supabase.co`
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key for client-side operations
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations (server-side only)

## Current Database Structure

### Tables

#### 1. **profiles** (Public Schema)
Primary user profile table that extends authentication data.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, matches auth.users.id |
| `email` | String | No | User's email address |
| `full_name` | String | No | User's full name |
| `avatar_url` | String | Yes | URL to profile picture |
| `bio` | String | Yes | User biography |
| `created_at` | Timestamp | No | Profile creation timestamp |
| `updated_at` | Timestamp | No | Last update timestamp |

**Current Data**: 1 profile exists (hassanmosul@hotmail.com)

### Authentication System

#### Auth Schema (Supabase Auth)
- **auth.users**: Core authentication table managed by Supabase
  - Contains user credentials, email verification status, and metadata
  - Current users: 1 (hassanmosul@hotmail.com - verified)

### Relationships
- `profiles.id` → `auth.users.id` (One-to-one relationship)
- Profile is created when user signs up

## File Structure

### Core Files Created

```
src/app/
├── lib/
│   └── supabaseClient.ts       # Supabase client initialization
├── types/
│   └── database.types.ts       # TypeScript interfaces
├── services/
│   └── databaseService.ts      # Database service layer
├── hooks/
│   └── useSupabase.ts          # React hooks for Supabase
└── scripts/
    ├── exploreDatabase.ts       # Database exploration script
    └── exploreTablesDetailed.ts # Detailed table analysis
```

## Usage Examples

### 1. Authentication

```typescript
import { useAuth } from '@/app/hooks/useSupabase';

function LoginComponent() {
  const { signIn, signUp, signOut, user, isAuthenticated } = useAuth();
  
  // Sign up new user
  await signUp({
    email: 'user@example.com',
    password: 'securepassword',
    full_name: 'John Doe'
  });
  
  // Sign in existing user
  await signIn({
    email: 'user@example.com',
    password: 'securepassword'
  });
  
  // Sign out
  await signOut();
}
```

### 2. Profile Management

```typescript
import { useCurrentUserProfile } from '@/app/hooks/useSupabase';

function ProfileComponent() {
  const { profile, updateProfile, uploadAvatar, loading } = useCurrentUserProfile();
  
  // Update profile
  await updateProfile({
    full_name: 'New Name',
    bio: 'Updated bio'
  });
  
  // Upload avatar
  const file = // ... get file from input
  await uploadAvatar(file);
}
```

### 3. Real-time Subscriptions

```typescript
import { useProfiles } from '@/app/hooks/useSupabase';

function ProfilesList() {
  const { profiles, loading, loadMore, hasMore } = useProfiles();
  
  // Profiles automatically update in real-time
  // when changes occur in the database
}
```

### 4. Direct Service Usage

```typescript
import { authService, profileService } from '@/app/services/databaseService';

// Get profile by email
const { data: profile, error } = await profileService.getProfileByEmail('user@example.com');

// Get current session
const { data: session, error } = await authService.getSession();
```

## Security Considerations

1. **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It's only used in server-side code.

2. **Row Level Security (RLS)**: Currently no RLS policies detected. Consider adding:
   - Users can only read/update their own profiles
   - Public profiles can be read by anyone
   - Admin roles for user management

3. **Authentication Flow**:
   - Email verification is enabled (user's email is confirmed)
   - Password reset functionality is implemented
   - OAuth providers can be added (Google, GitHub, Discord)

## Next Steps & Recommendations

### 1. Enable Row Level Security
```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Create Additional Tables
Consider adding these tables based on common application needs:
- `posts` - User-generated content
- `comments` - User comments
- `sessions` - Track user sessions
- `notifications` - User notifications
- `settings` - User preferences

### 3. Set Up Storage Buckets
```typescript
// Create avatars bucket for profile pictures
await supabase.storage.createBucket('avatars', { public: true });
```

### 4. Add Database Triggers
Create a trigger to automatically create a profile when a user signs up:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Testing the Integration

Run the exploration scripts to verify your database structure:

```bash
# Basic exploration
npx tsx src/app/scripts/exploreDatabase.ts

# Detailed table analysis
npx tsx src/app/scripts/exploreTablesDetailed.ts
```

## Troubleshooting

### Common Issues

1. **"Table not found" errors**: Some tables may not exist yet. The exploration found only the `profiles` table.

2. **Authentication errors**: Ensure environment variables are correctly set in `.env`

3. **CORS issues**: Configure Supabase dashboard to allow your domain

4. **Real-time not working**: Check if real-time is enabled in Supabase dashboard

## Support & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Guide](https://supabase.com/docs/guides/auth)