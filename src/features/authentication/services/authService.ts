import supabase from '../../../assets/supabase/client';
import type {
  AuthError,
  AuthResponse,
  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials
} from '@supabase/supabase-js';

export const signUpUser = async (
  credentials: SignUpWithPasswordCredentials
): Promise<AuthResponse> => {
  const response = await supabase.auth.signUp(credentials);
  return response;
};

export const signInWithPassword = async (
  credentials: SignInWithPasswordCredentials
): Promise<AuthResponse> => {
  const response = await supabase.auth.signInWithPassword(credentials);
  return response;
};

export const signOutUser = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};