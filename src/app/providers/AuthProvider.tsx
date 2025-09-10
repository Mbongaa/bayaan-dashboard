'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/databaseService';
import type { SignInData, SignUpData } from '../types/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  signIn: (credentials: SignInData) => Promise<{ success: boolean; error?: Error; data?: any }>;
  signUp: (credentials: SignUpData) => Promise<{ success: boolean; error?: Error; data?: any }>;
  signOut: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: Error; data?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔐 AuthProvider: Getting initial session...');
        const { data, error } = await authService.getSession();
        
        if (error) {
          console.error('🔐 AuthProvider: Error getting session:', error);
          throw error;
        }
        
        console.log('🔐 AuthProvider: Session data:', {
          hasSession: !!data,
          hasUser: !!data?.user,
          userId: data?.user?.id,
          userEmail: data?.user?.email
        });
        
        setSession(data);
        setUser(data?.user ?? null);
      } catch (err) {
        console.error('🔐 AuthProvider: Failed to get session:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthProvider: Auth state changed:', event, {
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('🔐 User signed in:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 User signed out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: SignInData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await authService.signIn(credentials);
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: SignUpData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await authService.signUp(credentials);
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        setError(error);
        return false;
      }
      
      return true;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await authService.resetPassword(email);
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}