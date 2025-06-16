import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import API_BASE from '../apiBase';
import { Task } from '../types/task';
import { Project } from '../types/project';

interface ProjectDetailPageProps {
  project: Project;
  tasks: Task[];
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ project, tasks }) => {
  const { id } = useParams<{ id: string }>();
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [taskSortField, setTaskSortField] = useState<'due' | 'status'>('due');
  const [taskSortDirection, setTaskSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/projects/${id}/`);
        setProjectTasks(response.data.tasks || []);
      } catch (err) {
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  // Filtering and sorting logic for tasks
  const filteredAndSortedTasks = React.useMemo(() => {
    if (!project) return [];
    let filtered = [...projectTasks];
    if (taskStatusFilter === 'active') {
      filtered = filtered.filter(task => !task.is_done);
    } else if (taskStatusFilter === 'completed') {
      filtered = filtered.filter(task => task.is_done);
    }
    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;
      if (taskSortField === 'due') {
        valA = a.due_date ? new Date(a.due_date).getTime() : (taskSortDirection === 'asc' ? Infinity : -Infinity);
        valB = b.due_date ? new Date(b.due_date).getTime() : (taskSortDirection === 'asc' ? Infinity : -Infinity);
      } else if (taskSortField === 'status') {
        valA = a.is_done ? 1 : 0;
        valB = b.is_done ? 1 : 0;
      }
      if (valA < valB) return taskSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return taskSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [projectTasks, taskStatusFilter, taskSortField, taskSortDirection, project]);

  const renderSortIcon = (field: 'due' | 'status') => {
    if (taskSortField !== field) return null;
    return taskSortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error || !project) return <div className="p-6 text-red-600">{error || 'Project not found.'}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
        {project.description && (
          <p className="mt-2 text-gray-600">{project.description}</p>
        )}
        {project.status && (
          <p className="mt-2 text-sm text-gray-500">Status: {project.status}</p>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
        {filteredAndSortedTasks.length === 0 ? (
          <p className="text-gray-500">No tasks found for this project.</p>
        ) : (
          <ul className="space-y-4">
            {filteredAndSortedTasks.map(task => (
              <li key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{task.description}</p>
                  {task.due_date && (
                    <p className="text-sm text-gray-500">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.is_done ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.is_done ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage; 