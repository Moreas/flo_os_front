import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as authLogin, getCurrentUser, logout as authLogout, forcePageRefresh } from '../api/auth';

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
      console.log('[AuthContext] Starting logout...');
      
      // Clear user state immediately for responsive UI
      setUser(null);
      
      // Set skipAuthCheck before clearing storage
      setSkipAuthCheck(true);
      localStorage.setItem('skipAuthCheck', 'true');
      
      // Call enhanced logout function (clears all storage, cookies, cache)
      // Pass true as parameter if you want to force page refresh after logout
      await authLogout(false); // Change to 'true' if you want automatic page refresh on logout
      
      console.log('[AuthContext] Logout completed');
      
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      // Even if logout fails, ensure user state is cleared
      setUser(null);
    }
    
    // Optional: Uncomment the next line if you want to force a page refresh after logout
    // This ensures a completely clean state but will reload the page
    // forcePageRefresh();
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