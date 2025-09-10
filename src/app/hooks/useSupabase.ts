import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { authService, profileService, realtimeService } from '../services/databaseService';
import type { Profile, SignInData, SignUpData } from '../types/database.types';

// Hook for authentication state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await authService.getSession();
        if (error) throw error;
        
        setSession(data);
        setUser(data?.user ?? null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (credentials: SignInData) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await authService.signIn(credentials);
    
    if (error) {
      setError(error);
      setLoading(false);
      return { success: false, error };
    }
    
    setLoading(false);
    return { success: true, data };
  }, []);

  const signUp = useCallback(async (credentials: SignUpData) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await authService.signUp(credentials);
    
    if (error) {
      setError(error);
      setLoading(false);
      return { success: false, error };
    }
    
    setLoading(false);
    return { success: true, data };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await authService.signOut();
    
    if (error) {
      setError(error);
    }
    
    setLoading(false);
    return !error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await authService.resetPassword(email);
    
    if (error) {
      setError(error);
      setLoading(false);
      return { success: false, error };
    }
    
    setLoading(false);
    return { success: true, data };
  }, []);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword
  };
}

// Hook for profile operations
export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch profile
  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await profileService.getProfile(id);
    
    if (error) {
      setError(error);
    } else {
      setProfile(data);
    }
    
    setLoading(false);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile?.id) {
      setError(new Error('No profile to update'));
      return { success: false };
    }
    
    setLoading(true);
    setError(null);
    
    const { data, error } = await profileService.updateProfile(profile.id, updates);
    
    if (error) {
      setError(error);
      setLoading(false);
      return { success: false, error };
    }
    
    setProfile(data);
    setLoading(false);
    return { success: true, data };
  }, [profile]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    if (!profile?.id) {
      setError(new Error('No profile to update'));
      return { success: false };
    }
    
    setLoading(true);
    setError(null);
    
    const { data, error } = await profileService.uploadAvatar(profile.id, file);
    
    if (error) {
      setError(error);
      setLoading(false);
      return { success: false, error };
    }
    
    // Refresh profile to get updated avatar URL
    await fetchProfile(profile.id);
    
    setLoading(false);
    return { success: true, data };
  }, [profile, fetchProfile]);

  // Fetch profile on mount or when userId changes
  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId, fetchProfile]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!userId) return;
    
    const channel = realtimeService.subscribeToProfile(userId, (payload) => {
      console.log('Profile change received:', payload);
      
      if (payload.eventType === 'UPDATE') {
        setProfile(payload.new as Profile);
      } else if (payload.eventType === 'DELETE') {
        setProfile(null);
      }
    });
    
    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, [userId]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar
  };
}

// Hook for listing profiles
export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProfiles = useCallback(async (pageNum = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await profileService.getProfiles(pageNum, limit);
    
    if (error) {
      setError(error);
    } else {
      if (pageNum === 1) {
        setProfiles(data || []);
      } else {
        setProfiles(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data?.length || 0) === limit);
      setPage(pageNum);
    }
    
    setLoading(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProfiles(page + 1);
    }
  }, [loading, hasMore, page, fetchProfiles]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = realtimeService.subscribeToProfiles((payload) => {
      console.log('Profiles change received:', payload);
      
      if (payload.eventType === 'INSERT') {
        setProfiles(prev => [payload.new as Profile, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setProfiles(prev => 
          prev.map(p => p.id === payload.new.id ? payload.new as Profile : p)
        );
      } else if (payload.eventType === 'DELETE') {
        setProfiles(prev => prev.filter(p => p.id !== payload.old.id));
      }
    });
    
    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, []);

  // Fetch initial profiles
  useEffect(() => {
    fetchProfiles(1);
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    page,
    hasMore,
    fetchProfiles,
    loadMore
  };
}

// Hook for current user's profile
export function useCurrentUserProfile() {
  const { user } = useAuth();
  const profile = useProfile(user?.id);
  
  return {
    ...profile,
    userId: user?.id,
    email: user?.email
  };
}