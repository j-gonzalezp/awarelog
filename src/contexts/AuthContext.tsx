import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import React from 'react';
import type { AppUser } from '../types/auth';
import supabase from '../assets/supabase/client';
import type { User as SupabaseApiUser } from '@supabase/supabase-js';

const toAppUser = (supabaseUser: SupabaseApiUser | null | undefined): AppUser | null => {
  if (!supabaseUser) {
    return null;
  }
  const appUserCandidate = {
    ...supabaseUser,
    updated_at: supabaseUser.updated_at ?? supabaseUser.created_at,
  };
  return appUserCandidate as AppUser;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let listenerSubscription: { unsubscribe: () => void } | undefined;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error fetching session:', sessionError.message);
        }
        const initialUser = toAppUser(session?.user ?? null);
        setUser(initialUser);

        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (_event, currentSession) => {
            const changedUser = toAppUser(currentSession?.user ?? null);
            setUser(changedUser);
            setLoading(false);
          }
        );
        listenerSubscription = authListener?.subscription;

      } catch (error) {
        console.error("[AuthContext] initializeAuth: Caught error during initialization -", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      listenerSubscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};