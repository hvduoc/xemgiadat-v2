/**
 * AuthContext
 * Provides authentication state and methods
 * Firebase-backed authentication for LandManager Pro
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types';
import { initFirebase, ensureUserDocument } from '@/config/firebase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { auth } = await initFirebase();

        unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
          if (!isMounted) return;

          if (firebaseUser) {
            await ensureUserDocument(firebaseUser);
            const isAdmin = firebaseUser.uid === 'FEpPWWT1EaTWQ9FOqBxWN5FeEJk1';
            const nextUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email || 'User',
              role: isAdmin ? 'admin' : 'user',
              permissions: isAdmin ? ['read', 'write', 'delete', 'all'] : ['read', 'write'],
            };
            setUser(nextUser);
            console.log('[AuthContext] ✓ Authenticated as:', nextUser.name);
          } else {
            setUser(null);
            console.log('[AuthContext] User signed out');
          }

          setIsLoading(false);
        });
      } catch (error) {
        console.error('[AuthContext] Auth init failed:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    console.log('[AuthContext] login() called', { username });
    setIsLoading(true);
    const { auth } = await initFirebase();
    await auth.signInWithEmailAndPassword(username, password);
  };

  const logout = (): void => {
    console.log('[AuthContext] logout() called');
    initFirebase()
      .then(({ auth }) => auth.signOut())
      .catch((error) => console.error('[AuthContext] logout failed:', error));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
