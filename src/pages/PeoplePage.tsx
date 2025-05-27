import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import PeopleList from '../components/PeopleList';
import PersonForm from '../components/forms/PersonForm';

const PeoplePage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">People</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Person
        </button>
      </div>

      <PeopleList />

      <PersonForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPersonCreated={() => {
          setIsAddModalOpen(false);
          // The PeopleList component will automatically refresh due to its useEffect
        }}
      />
    </div>
  );
};

export default PeoplePage; 