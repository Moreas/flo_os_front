import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';
import { EmailMessage } from '../../types/email';
import { Project } from '../../types/project';

interface EmailProjectLinkerProps {
  email: EmailMessage;
  onProjectLinked: (email: EmailMessage) => void;
  className?: string;
}

const EmailProjectLinker: React.FC<EmailProjectLinkerProps> = React.memo(({ 
  email, 
  onProjectLinked, 
  className = '' 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(email.project?.id || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiClient.get('/api/projects/');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Update selected project when email changes
  useEffect(() => {
    setSelectedProjectId(email.project?.id || null);
  }, [email.project?.id]);

  const handleLinkProject = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.post(`/api/emails/${email.id}/link_to_project/`, {
        project_id: selectedProjectId
      });
      
      // Update the email object
      const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
      const updatedEmail = {
        ...email,
        project: selectedProject ? {
          id: selectedProject.id,
          name: selectedProject.name,
          status: selectedProject.status || '',
          type: ''
        } : null
      };
      
      onProjectLinked(updatedEmail);
      setIsEditing(false);
    } catch (error) {
      console.error('Error linking project:', error);
      alert('Failed to link project');
    } finally {
      setIsLoading(false);
    }
  }, [email, selectedProjectId, projects, onProjectLinked]);

  const handleCancel = useCallback(() => {
    setSelectedProjectId(email.project?.id || null);
    setIsEditing(false);
  }, [email.project?.id]);

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleProjectSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null);
  }, []);

  const projectOptions = useMemo(() => (
    projects.map((project) => (
      <option key={project.id} value={project.id}>
        {project.name}
      </option>
    ))
  ), [projects]);

  if (isEditing) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <select
          value={selectedProjectId || ''}
          onChange={handleProjectSelectChange}
          className="block text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          disabled={isLoading}
        >
          <option value="">No project</option>
          {projectOptions}
        </select>
        <button
          onClick={handleLinkProject}
          disabled={isLoading}
          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
          title="Save"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          title="Cancel"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">
        Project: {email.project ? (
          <span className="font-medium text-gray-900">{email.project.name}</span>
        ) : (
          <span className="italic text-gray-400">None</span>
        )}
      </span>
      <button
        onClick={handleStartEditing}
        className="text-xs text-primary-600 hover:text-primary-800"
      >
        {email.project ? 'Change' : 'Link to project'}
      </button>
    </div>
  );
});

EmailProjectLinker.displayName = 'EmailProjectLinker';

export default EmailProjectLinker; 