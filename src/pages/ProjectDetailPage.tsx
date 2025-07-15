import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { Task } from '../types/task';
import { Project } from '../types/project';
import API_BASE from '../apiBase';
import ProjectForm from '../components/forms/ProjectForm';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`${API_BASE}/api/projects/${id}/`);
        setProject(response.data);
        setNotes(response.data.notes || '');
      } catch (err) {
        setError('Failed to load project details.');
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTasks = async () => {
      if (!id) return;
      try {
        const response = await apiClient.get(`${API_BASE}/api/tasks/`, {
          params: { project: id }
        });
        setTasks(response.data || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchProject();
    fetchTasks();
  }, [id]);

  const handleSaveNotes = async () => {
    if (!project || !id) return;
    
    setIsSavingNotes(true);
    setNotesError(null);
    
    try {
      const response = await apiClient.patch(`${API_BASE}/api/projects/${id}/`, {
        notes: notes
      });
      
      if (response.status >= 200 && response.status < 300) {
        setProject(prev => prev ? { ...prev, notes: notes } : null);
        setIsEditingNotes(false);
      } else {
        throw new Error(`Failed to save notes (${response.status})`);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      setNotesError('Failed to save notes. Please try again.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotesEdit = () => {
    setNotes(project?.notes || '');
    setIsEditingNotes(false);
    setNotesError(null);
  };

  const handleEditProject = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiClient.delete(`${API_BASE}/api/projects/${id}/`);
      navigate('/projects');
    } catch (err) {
      alert('Failed to delete project.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading project details...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Project not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
              {project.type && (
                <span className="text-sm text-gray-500">Type: {project.type}</span>
              )}
              {project.income_monthly && project.income_monthly > 0 && (
                <span className="text-sm text-gray-500">
                  Monthly Income: ${project.income_monthly}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEditProject}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDeleteProject}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Business and Categories */}
        {(project.business || (project.categories && project.categories.length > 0)) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              {project.business && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Business: </span>
                  <span className="text-sm text-gray-900">{project.business.name}</span>
                </div>
              )}
              {project.categories && project.categories.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Categories: </span>
                  <div className="inline-flex flex-wrap gap-1">
                    {project.categories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tasks ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks for this project.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    task.is_done ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className={`${task.is_done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.description}
                  </span>
                </div>
                {task.due_date && (
                  <span className="text-sm text-gray-500">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              {notes ? 'Edit Notes' : 'Add Notes'}
            </button>
          )}
        </div>

        {notesError && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{notesError}</div>
          </div>
        )}

        {isEditingNotes ? (
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={8}
              placeholder="Add your project notes here..."
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
              <button
                onClick={handleCancelNotesEdit}
                disabled={isSavingNotes}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {notes ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                  {notes}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500 italic">No notes for this project.</p>
            )}
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <ProjectForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialProject={project}
          isEditMode={true}
          onProjectUpdated={() => {
            setIsEditModalOpen(false);
            // Refetch project details after edit
            apiClient.get(`${API_BASE}/api/projects/${id}/`).then(res => {
              setProject(res.data);
              setNotes(res.data.notes || '');
            });
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;