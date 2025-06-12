import React, { createContext, useContext, useState } from 'react';

interface RefreshContextType {
  refreshTasks: () => void;
  refreshJournal: () => void;
  tasksVersion: number;
  journalVersion: number;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshTasks: () => {},
  refreshJournal: () => {},
  tasksVersion: 0,
  journalVersion: 0,
});

export const useRefresh = () => useContext(RefreshContext);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasksVersion, setTasksVersion] = useState(0);
  const [journalVersion, setJournalVersion] = useState(0);

  const refreshTasks = () => {
    setTasksVersion(prev => prev + 1);
  };

  const refreshJournal = () => {
    setJournalVersion(prev => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshTasks, refreshJournal, tasksVersion, journalVersion }}>
      {children}
    </RefreshContext.Provider>
  );
}; 