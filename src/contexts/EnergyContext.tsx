import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface EnergyContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export const useEnergyContext = () => {
  const context = useContext(EnergyContext);
  if (context === undefined) {
    throw new Error('useEnergyContext must be used within an EnergyProvider');
  }
  return context;
};

interface EnergyProviderProps {
  children: ReactNode;
}

export const EnergyProvider: React.FC<EnergyProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const value = {
    refreshTrigger,
    triggerRefresh,
  };

  return <EnergyContext.Provider value={value}>{children}</EnergyContext.Provider>;
}; 