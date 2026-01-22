import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// ============================================
// QUERY KEYS
// ============================================

export const authKeys = {
  session: ['session'] as const,
  player: (userId: string) => ['player', userId] as const,
};

// ============================================
// SESSION & USER
// ============================================

export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: async (): Promise<Session | null> => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
    staleTime: Infinity,
  });
}

export function useUser(): User | null {
  const { data: session } = useSession();
  return session?.user ?? null;
}

export function useIsAuthenticated(): boolean {
  const { data: session, isLoading } = useSession();
  if (isLoading) return false;
  return session !== null;
}

// ============================================
// SIGN IN
// ============================================

interface SignInCredentials {
  email: string;
  password: string;
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: SignInCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.session, data.session);
    },
  });
}

// ============================================
// SIGN UP
// ============================================

interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password, displayName }: SignUpCredentials) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.session) {
        queryClient.setQueryData(authKeys.session, data.session);
      }
    },
  });
}

// ============================================
// SIGN OUT
// ============================================

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ============================================
// PASSWORD RESET
// ============================================

export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
  });
}
