import { useState, useCallback } from 'react';

// Global state for refresh triggers
const refreshTriggers = {
  mood: 0,
  energy: 0,
};

const refreshCallbacks = {
  mood: new Set<() => void>(),
  energy: new Set<() => void>(),
};

export const useRefresh = (type: 'mood' | 'energy') => {
  const [refreshTrigger, setRefreshTrigger] = useState(refreshTriggers[type]);

  // Register callback for refresh notifications
  const registerRefreshCallback = useCallback(() => {
    const callback = () => {
      setRefreshTrigger(refreshTriggers[type]);
    };
    refreshCallbacks[type].add(callback);
    
    // Cleanup function
    return () => {
      refreshCallbacks[type].delete(callback);
    };
  }, [type]);

  // Trigger refresh for all registered components
  const triggerRefresh = useCallback(() => {
    refreshTriggers[type]++;
    refreshCallbacks[type].forEach(callback => callback());
  }, [type]);

  return {
    refreshTrigger,
    triggerRefresh,
    registerRefreshCallback,
  };
}; 