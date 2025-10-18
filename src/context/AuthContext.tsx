import React, { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthSession } from '../hooks/useAuthSession';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  clinicId: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authSession = useAuthSession();

  const getAccessToken = () => {
    return authSession.session?.access_token || null;
  };

  const value: AuthContextType = {
    ...authSession,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
