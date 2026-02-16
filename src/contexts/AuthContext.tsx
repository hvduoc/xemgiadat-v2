/**
 * AuthContext
 * Provides authentication state and methods
 * Mock implementation for LandManager Pro (no backend)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types';

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
    // Mock auto-login after 500ms (Simulate API call)
    const timer = setTimeout(() => {
      const mockUser: User = {
        id: 'dev-01',
        name: 'Dev Admin',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'all'],
      };
      setUser(mockUser);
      setIsLoading(false);
      console.log('[AuthContext] ✓ Auto-logged in as:', mockUser.name);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    // TODO: Implement login logic
    console.log('[AuthContext] login() called', { username });
    setIsLoading(true);
    
    // Mock authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: 'user-001',
      name: username,
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
    };
    
    setUser(mockUser);
    setIsLoading(false);
  };

  const logout = (): void => {
    console.log('[AuthContext] logout() called');
    setUser(null);
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
