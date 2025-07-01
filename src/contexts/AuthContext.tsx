import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as authLogin, getCurrentUser, logout as authLogout, clearAllStorageAndCache } from '../api/auth';

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

const AUTH_CHECK_INTERVAL = 1000 * 60 * 15; // 15 minutes

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);
  const [authCheckTimer, setAuthCheckTimer] = useState<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  const checkAuth = useCallback(async (force = false) => {
    const now = Date.now();
    // Skip check if recently checked and not forced
    if (!force && (now - lastAuthCheck) < AUTH_CHECK_INTERVAL) {
      return;
    }

    try {
      const response = await getCurrentUser();
      
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
      setLastAuthCheck(now);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [lastAuthCheck]);

  const startAuthCheckTimer = useCallback(() => {
    if (authCheckTimer) {
      clearInterval(authCheckTimer);
    }
    // Set up periodic auth check
    const timer = setInterval(() => {
      checkAuth();
    }, AUTH_CHECK_INTERVAL);
    setAuthCheckTimer(timer);
    return timer;
  }, [authCheckTimer, checkAuth]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authLogin(username, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        setLastAuthCheck(Date.now());
        startAuthCheckTimer();
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      console.error('[Auth] Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      // Clear auth check timer
      if (authCheckTimer) {
        clearInterval(authCheckTimer);
        setAuthCheckTimer(null);
      }
      
      // Clear user state immediately for responsive UI
      setUser(null);
      setLastAuthCheck(0);
      
      // Call logout and clear storage
      await authLogout();
      clearAllStorageAndCache();
      
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      // Even if logout fails, ensure user state is cleared
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial auth check
    checkAuth(true);
    
    // Start periodic auth check if not already running
    const timer = startAuthCheckTimer();
    
    // Cleanup on unmount
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [checkAuth, startAuthCheckTimer]); // Add dependencies

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