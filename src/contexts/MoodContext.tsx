import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MoodContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export const useMoodContext = () => {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMoodContext must be used within a MoodProvider');
  }
  return context;
};

interface MoodProviderProps {
  children: ReactNode;
}

export const MoodProvider: React.FC<MoodProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const value = {
    refreshTrigger,
    triggerRefresh,
  };

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}; 