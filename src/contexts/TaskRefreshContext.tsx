import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface TaskRefreshContextType {
  refreshKey: number;
  refreshTasks: () => void;
}

const TaskRefreshContext = createContext<TaskRefreshContextType | undefined>(
  undefined
);

export const TaskRefreshProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTasks = useCallback(() => {
    console.log("TaskRefreshContext: Refresh triggered"); // Debug log
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  return (
    <TaskRefreshContext.Provider value={{ refreshKey, refreshTasks }}>
      {children}
    </TaskRefreshContext.Provider>
  );
};

export const useTaskRefresh = (): TaskRefreshContextType => {
  const context = useContext(TaskRefreshContext);
  if (context === undefined) {
    throw new Error('useTaskRefresh must be used within a TaskRefreshProvider');
  }
  return context;
}; 