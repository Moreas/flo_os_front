import React, { useState } from 'react';
import { 
  PlusIcon 
} from '@heroicons/react/24/outline';
import ProjectList from '../components/ProjectList';
import ProjectForm from '../components/forms/ProjectForm';

const Projects: React.FC = () => {
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setIsProjectFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Project List - Search is now handled inside ProjectList */}
      <div className="shadow-sm rounded-lg p-4">
        <ProjectList />
      </div>

      {/* Project Creation Modal */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
      />
    </div>
  );
};

export default Projects; 