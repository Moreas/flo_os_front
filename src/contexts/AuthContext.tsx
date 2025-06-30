import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as authLogin, getCurrentUser, logout as authLogout } from '../api/auth';

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
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skipAuthCheck, setSkipAuthCheck] = useState(() => {
    // Check localStorage on initial load
    return localStorage.getItem('skipAuthCheck') === 'true';
  });

  const isAuthenticated = !!user;

  const checkAuth = async () => {
    try {
      const response = await getCurrentUser();
      
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authLogin(username, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        // Clear skipAuthCheck on successful login
        setSkipAuthCheck(false);
        localStorage.removeItem('skipAuthCheck');
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
      // Set skipAuthCheck in localStorage and state
      setSkipAuthCheck(true);
      localStorage.setItem('skipAuthCheck', 'true');
      
      // Clear user state immediately
      setUser(null);
      
      await authLogout();
      
      // Force clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear everything
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  useEffect(() => {
    if (!skipAuthCheck) {
      checkAuth();
    } else {
      setIsLoading(false);
      // Clear the flag after using it
      setSkipAuthCheck(false);
      localStorage.removeItem('skipAuthCheck');
    }
  }, [skipAuthCheck]);

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