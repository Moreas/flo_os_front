import React, { useState, useCallback } from 'react';
import JournalList from '../components/JournalList';
import JournalForm from '../components/forms/JournalForm'; // Assuming this exists
import { PlusIcon } from '@heroicons/react/24/outline';

const JournalPage: React.FC = () => {
  const [isJournalFormOpen, setIsJournalFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const handleJournalEntryCreated = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1); 
    // Need to ensure JournalForm accepts and uses onJournalEntryCreated
    // and POSTs to /api/journal_entries/
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
        <button
          onClick={() => setIsJournalFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Entry
        </button>
      </div>

       <div className="bg-white shadow-sm rounded-lg p-4">
         <JournalList key={refreshKey} /> 
       </div>

      <JournalForm 
        isOpen={isJournalFormOpen} 
        onClose={() => setIsJournalFormOpen(false)} 
        onJournalEntryCreated={handleJournalEntryCreated} 
      />
    </div>
  );
};

export default JournalPage; 