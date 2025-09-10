import { supabase, supabaseAdmin, isServer } from '../lib/supabaseClient';
import type { 
  Profile, 
  ProfileInsert, 
  ProfileUpdate, 
  SignUpData, 
  SignInData,
  ApiResponse 
} from '../types/database.types';

// Gmail Token Types
export interface GmailToken {
  id: string;
  user_id: string;
  encrypted_tokens: string;
  gmail_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GmailTokenInsert {
  user_id: string;
  encrypted_tokens: string;
  gmail_email: string;
  is_active?: boolean;
}

export interface GmailTokenUpdate {
  encrypted_tokens?: string;
  gmail_email?: string;
  is_active?: boolean;
}

// Profile Service
export const profileService = {
  // Get a single profile by ID
  async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get profile by email
  async getProfileByEmail(email: string): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching profile by email:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get all profiles (with optional pagination)
  async getProfiles(page = 1, limit = 10): Promise<ApiResponse<Profile[]>> {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .range(start, end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return { data: null, error: error as Error };
    }
  },

  // Create a new profile
  async createProfile(profile: ProfileInsert): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { data: null, error: error as Error };
    }
  },

  // Update an existing profile
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error: error as Error };
    }
  },

  // Delete a profile
  async deleteProfile(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting profile:', error);
      return { data: false, error: error as Error };
    }
  },

  // Upload avatar
  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<string>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage (create bucket if needed)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes('not found')) {
          const { error: bucketError } = await supabase.storage
            .createBucket('avatars', { public: true });
          
          if (!bucketError) {
            // Retry upload
            const { error: retryError } = await supabase.storage
              .from('avatars')
              .upload(filePath, file);
            
            if (retryError) throw retryError;
          }
        } else {
          throw uploadError;
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      await profileService.updateProfile(userId, { avatar_url: publicUrl });

      return { data: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { data: null, error: error as Error };
    }
  }
};

// Authentication Service
export const authService = {
  // Sign up a new user
  async signUp({ email, password, full_name }: SignUpData) {
    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from signup');

      // 2. Create profile
      const { error: profileError } = await profileService.createProfile({
        id: authData.user.id,
        email,
        full_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (profileError) {
        // Rollback auth user if profile creation fails
        console.error('Profile creation failed, consider cleanup:', profileError);
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error: error as Error };
    }
  },

  // Sign in an existing user
  async signIn({ email, password }: SignInData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error: error as Error };
    }
  },

  // Sign out the current user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { data: false, error: error as Error };
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data: data.session, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { data: null, error: error as Error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { data: user, error: null };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { data: null, error: error as Error };
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { data: false, error: error as Error };
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error updating password:', error);
      return { data: false, error: error as Error };
    }
  },

  // OAuth sign in (Google, GitHub, etc.)
  async signInWithOAuth(provider: 'google' | 'github' | 'discord') {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      return { data: false, error: error as Error };
    }
  }
};

// Real-time subscriptions
export const realtimeService = {
  // Subscribe to profile changes
  subscribeToProfiles(callback: (payload: any) => void) {
    return supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        callback
      )
      .subscribe();
  },

  // Subscribe to specific profile changes
  subscribeToProfile(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  // Unsubscribe from a channel
  async unsubscribe(channel: any) {
    await supabase.removeChannel(channel);
  }
};

// Gmail Token Service
export const gmailTokenService = {
  // Get Gmail token for user
  async getGmailToken(userId: string): Promise<ApiResponse<GmailToken>> {
    try {
      // Use admin client for server-side operations to bypass RLS
      const client = isServer && supabaseAdmin ? supabaseAdmin : supabase;
      console.log('📧 Gmail token fetch - Using client:', isServer ? 'admin (server)' : 'regular (client)');
      
      const { data, error } = await client
        .from('gmail_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Error fetching Gmail token:', error);
      return { data: null, error: error as Error };
    }
  },

  // Store Gmail tokens for user
  async storeGmailToken(tokenData: GmailTokenInsert): Promise<ApiResponse<GmailToken>> {
    try {
      // Use admin client for server-side operations to bypass RLS
      const client = isServer && supabaseAdmin ? supabaseAdmin : supabase;
      console.log('📧 Gmail token store - Using client:', isServer ? 'admin (server)' : 'regular (client)');
      
      // First, deactivate any existing tokens for this user
      await client
        .from('gmail_tokens')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', tokenData.user_id);

      // Insert new token
      const { data, error } = await client
        .from('gmail_tokens')
        .insert([{
          ...tokenData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error storing Gmail token:', error);
      return { data: null, error: error as Error };
    }
  },

  // Update Gmail tokens for user
  async updateGmailToken(userId: string, updates: GmailTokenUpdate): Promise<ApiResponse<GmailToken>> {
    try {
      // Use admin client for server-side operations to bypass RLS
      const client = isServer && supabaseAdmin ? supabaseAdmin : supabase;
      
      const { data, error } = await client
        .from('gmail_tokens')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating Gmail token:', error);
      return { data: null, error: error as Error };
    }
  },

  // Delete Gmail token for user (revoke access)
  async deleteGmailToken(userId: string): Promise<ApiResponse<boolean>> {
    try {
      // Use admin client for server-side operations to bypass RLS
      const client = isServer && supabaseAdmin ? supabaseAdmin : supabase;
      
      const { error } = await client
        .from('gmail_tokens')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting Gmail token:', error);
      return { data: false, error: error as Error };
    }
  },

  // Check if user has active Gmail connection
  async hasActiveGmailConnection(userId: string): Promise<ApiResponse<boolean>> {
    try {
      // Use admin client for server-side operations to bypass RLS
      const client = isServer && supabaseAdmin ? supabaseAdmin : supabase;
      console.log('📧 Gmail connection check - Using client:', isServer ? 'admin (server)' : 'regular (client)');
      
      const { data, error } = await client
        .from('gmail_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { data: !!data, error: null };
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      return { data: false, error: error as Error };
    }
  },

  // Get all Gmail connections for admin/debugging
  async getAllGmailTokens(page = 1, limit = 10): Promise<ApiResponse<GmailToken[]>> {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error } = await supabase
        .from('gmail_tokens')
        .select('*')
        .eq('is_active', true)
        .range(start, end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching Gmail tokens:', error);
      return { data: null, error: error as Error };
    }
  }
};