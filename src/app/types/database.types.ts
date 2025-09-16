// Database type definitions based on Supabase schema exploration

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
  auth: {
    Tables: {
      users: {
        Row: AuthUser;
      };
    };
  };
}

// Profile table types
export interface Profile {
  id: string; // UUID - matches auth.users.id
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ProfileInsert {
  id: string; // Must match auth.users.id
  email: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  updated_at?: string;
}

// Auth user types (from Supabase Auth)
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  email_confirmed_at?: string | null;
  phone?: string | null;
  confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

// Session types
export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: AuthUser;
}

// Helper types for authentication
export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Response types for API calls
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}