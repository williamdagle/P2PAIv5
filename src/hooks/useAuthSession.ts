import { useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthSessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  clinicId: string | null;
  userId: string | null;
  isAuthenticated: boolean;
}

interface UseAuthSessionReturn extends AuthSessionState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuthSession(): UseAuthSessionReturn {
  const [state, setState] = useState<AuthSessionState>({
    session: null,
    user: null,
    loading: true,
    clinicId: null,
    userId: null,
    isAuthenticated: false,
  });

  const loadUserProfile = useCallback(async (authUserId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, clinic_id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (error) throw error;

      return {
        userId: profile?.id || null,
        clinicId: profile?.clinic_id || null,
      };
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return { userId: null, clinicId: null };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      if (session?.user) {
        const { userId, clinicId } = await loadUserProfile(session.user.id);
        setState({
          session,
          user: session.user,
          loading: false,
          clinicId,
          userId,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }, [loadUserProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setState({
        session: null,
        user: null,
        loading: false,
        clinicId: null,
        userId: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user && mounted) {
          const { userId, clinicId } = await loadUserProfile(session.user.id);

          if (mounted) {
            setState({
              session,
              user: session.user,
              loading: false,
              clinicId,
              userId,
              isAuthenticated: true,
            });
          }
        } else if (mounted) {
          setState({
            session: null,
            user: null,
            loading: false,
            clinicId: null,
            userId: null,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          setState({
            session: null,
            user: null,
            loading: false,
            clinicId: null,
            userId: null,
            isAuthenticated: false,
          });
        }
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const { userId, clinicId } = await loadUserProfile(session.user.id);
          setState({
            session,
            user: session.user,
            loading: false,
            clinicId,
            userId,
            isAuthenticated: true,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            session: null,
            user: null,
            loading: false,
            clinicId: null,
            userId: null,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  return {
    ...state,
    signOut,
    refreshSession,
  };
}
