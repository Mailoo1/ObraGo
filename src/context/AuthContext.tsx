/**
 * Contexto de sesion: cualquier pantalla puede saber quien esta logueado y con que rol.
 * Uso:  const { profile, loading } = useAuth();
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getUserProfile, onAuthChange } from '../services/authService';
import { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null; // incluye el rol
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) return setState({ user: null, profile: null, loading: false });
      const profile = await getUserProfile(user.uid);
      setState({ user, profile, loading: false });
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
