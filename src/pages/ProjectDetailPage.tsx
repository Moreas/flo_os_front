import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import API_BASE from '../apiBase';

interface Project {
  id: number;
  title: string;
  description?: string;
  status?: string;
  name?: string;
}

interface Task {
  id: number;
  description: string;
  is_done: boolean;
  due?: string | null;
  project?: Project;
  project_id?: number;
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [taskSortField, setTaskSortField] = useState<'due' | 'status'>('due');
  const [taskSortDirection, setTaskSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/projects/${id}/`);
        setProject(response.data);
      } catch (err) {
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (!project) return;
    const fetchTasks = async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        const response = await axios.get(`${API_BASE}/api/tasks/`, {
          params: { project_id: project.id }
        });
        setTasks(response.data || []);
      } catch (err) {
        setTasksError('Failed to load related tasks.');
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, [project]);

  // Filtering and sorting logic for tasks
  const filteredAndSortedTasks = React.useMemo(() => {
    if (!project) return [];
    let filtered = [...tasks];
    // Only show tasks related to this project
    filtered = filtered.filter(task => {
      if (task.project && typeof task.project === 'object') {
        return task.project.id === project.id;
      }
      if (typeof task.project_id === 'number') {
        return task.project_id === project.id;
      }
      return false;
    });
    if (taskStatusFilter === 'active') {
      filtered = filtered.filter(task => !task.is_done);
    } else if (taskStatusFilter === 'completed') {
      filtered = filtered.filter(task => task.is_done);
    }
    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;
      if (taskSortField === 'due') {
        valA = a.due ? new Date(a.due).getTime() : (taskSortDirection === 'asc' ? Infinity : -Infinity);
        valB = b.due ? new Date(b.due).getTime() : (taskSortDirection === 'asc' ? Infinity : -Infinity);
      } else if (taskSortField === 'status') {
        valA = a.is_done ? 1 : 0;
        valB = b.is_done ? 1 : 0;
      }
      if (valA < valB) return taskSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return taskSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [tasks, taskStatusFilter, taskSortField, taskSortDirection, project?.id]);

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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {project.title || project.name || 'Untitled Project'}
        </h1>
        <div className="my-2 border-b border-gray-100" />
        <p className="mt-2 text-gray-600 min-h-[1.5rem]">
          {project.description ? project.description : <span className="italic text-gray-400">No description provided.</span>}
        </p>
        {project.status && (
          <span className="inline-block mt-4 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {project.status}
          </span>
        )}
      </div>

      {/* Related Tasks Section */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Related Tasks</h2>
          <div className="flex items-center space-x-2">
            <select
              value={taskStatusFilter}
              onChange={e => setTaskStatusFilter(e.target.value as any)}
              className="block w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="mb-4 flex items-center space-x-4 text-sm text-gray-500">
          <button
            onClick={() => {
              if (taskSortField === 'due') {
                setTaskSortDirection(taskSortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setTaskSortField('due');
                setTaskSortDirection('asc');
              }
            }}
            className="flex items-center hover:text-gray-700"
          >
            Due Date {renderSortIcon('due')}
          </button>
          <button
            onClick={() => {
              if (taskSortField === 'status') {
                setTaskSortDirection(taskSortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setTaskSortField('status');
                setTaskSortDirection('asc');
              }
            }}
            className="flex items-center hover:text-gray-700"
          >
            Status {renderSortIcon('status')}
          </button>
        </div>
        {tasksLoading ? (
          <div className="flex items-center text-gray-400"><ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />Loading tasks...</div>
        ) : tasksError ? (
          <div className="flex items-center text-red-600"><ExclamationTriangleIcon className="w-5 h-5 mr-2" />{tasksError}</div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-gray-500 italic">No tasks found for this project.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredAndSortedTasks.map(task => (
              <li key={task.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className={task.is_done ? 'line-through text-gray-400' : ''}>{task.description}</span>
                  {task.due && (
                    <span className="ml-2 text-xs text-gray-400">(Due: {new Date(task.due).toLocaleDateString()})</span>
                  )}
                </div>
                <span className={task.is_done ? 'text-green-600' : 'text-gray-400'}>
                  {task.is_done ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage; 