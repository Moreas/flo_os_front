import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as authLogin, logout as authLogout, getCurrentUser, clearAllStorageAndCache } from '../api/auth';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: (force?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const checkAuth = useCallback(async (force = false) => {
    try {
      console.log('[AuthContext] Checking authentication...');
      
      // Try to get current user from API
      const response = await getCurrentUser();
      
      if (response.success && response.user) {
        setUser(response.user);
        console.log('[AuthContext] User authenticated:', response.user.username);
      } else {
        console.log('[AuthContext] No valid user found');
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error);
      // Only clear user if it's an authentication error (401/403)
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        setUser(null);
      }
      // For other errors (network, server), keep the user logged in
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AuthContext] Login attempt for:', username);
      const response = await authLogin(username, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        console.log('[AuthContext] Login successful');
        return { success: true };
      } else {
        console.log('[AuthContext] Login failed:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      console.error('[AuthContext] Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Logging out...');
      // Clear user state immediately for responsive UI
      setUser(null);
      
      // Call logout and clear storage
      await authLogout();
      clearAllStorageAndCache();
      console.log('[AuthContext] Logout successful');
      
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      // Even if logout fails, ensure user state is cleared
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial auth check on app load
    console.log('[AuthContext] Initial auth check');
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 