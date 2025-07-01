import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchWithCSRF } from '../api/fetchWithCreds';
import API_BASE from '../apiBase';
import { 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  BriefcaseIcon,
  FlagIcon,
  TagIcon,
  DocumentTextIcon,
  BeakerIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ProjectForm from './forms/ProjectForm';

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  driver_type: 'goal' | 'requirement' | 'problem' | 'experiment';
  business?: {
    id: number;
    name: string;
  };
  goal?: {
    id: number;
    title: string;
  };
  categories: Array<{
    id: number;
    name: string;
  }>;
  created_at: string;
  tasks: Array<{
    id: number;
    description: string;
    is_done: boolean;
    due_date?: string;
    created_at: string;
  }>;
  goals: Array<{
    id: number;
    title: string;
    status: string;
  }>;
}

type SortField = 'name' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'paused' | 'archived';
type DriverTypeFilter = 'all' | 'goal' | 'requirement' | 'problem' | 'experiment';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [driverTypeFilter, setDriverTypeFilter] = useState<DriverTypeFilter>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, tasksRes, goalsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/projects/`, { 
            params: { search: searchQuery }
          }),
          axios.get(`${API_BASE}/api/tasks/`),
          axios.get(`${API_BASE}/api/goals/`)
        ]);

        // Combine projects with their tasks and goals
        const projectsWithRelations = projectsRes.data.map((project: Project) => ({
          ...project,
          tasks: tasksRes.data.filter((task: any) => task.project?.id === project.id),
          goals: goalsRes.data.filter((goal: any) => goal.project?.id === project.id)
        }));

        setProjects(projectsWithRelations);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDriverTypeIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <FlagIcon className="w-4 h-4 text-gray-400" />;
      case 'requirement':
        return <DocumentTextIcon className="w-4 h-4 text-gray-400" />;
      case 'problem':
        return <ExclamationCircleIcon className="w-4 h-4 text-gray-400" />;
      case 'experiment':
        return <BeakerIcon className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const toggleExpand = (projectId: number) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply driver type filter
    if (driverTypeFilter !== 'all') {
      filtered = filtered.filter(project => project.driver_type === driverTypeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'created_at':
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, statusFilter, driverTypeFilter, sortField, sortDirection]);

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
          try {
        const response = await fetchWithCSRF(`${API_BASE}/api/projects/${projectId}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to delete project (${response.status})`);
        }
        
        setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert('Failed to delete project.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>

        {/* Driver Type Filter */}
        <select
          value={driverTypeFilter}
          onChange={(e) => setDriverTypeFilter(e.target.value as DriverTypeFilter)}
          className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="all">All Driver Types</option>
          <option value="goal">Goal</option>
          <option value="requirement">Requirement</option>
          <option value="problem">Problem</option>
          <option value="experiment">Experiment</option>
        </select>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSort('name')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            Name {renderSortIcon('name')}
          </button>
          <button
            onClick={() => handleSort('status')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            Status {renderSortIcon('status')}
          </button>
          <button
            onClick={() => handleSort('created_at')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            Created {renderSortIcon('created_at')}
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col h-full"
          >
            {/* Header Row */}
            <div
              className="flex flex-col gap-2 p-3 hover:bg-primary-50 cursor-pointer transition-colors flex-1"
              onClick={() => toggleExpand(project.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </div>
                <div className="text-gray-400">
                  {getDriverTypeIcon(project.driver_type)}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {project.name}
                </h3>
                <ChevronDownIcon 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    expandedProjectId === project.id ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                {project.business && (
                  <span className="flex items-center">
                    <BriefcaseIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {project.business.name}
                  </span>
                )}
                {project.goal && (
                  <span className="flex items-center">
                    <FlagIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {project.goal.title}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end min-w-[120px]">
                {project.categories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    <TagIcon className="w-3 h-3 mr-1 text-gray-500" />
                    {category.name}
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={e => { e.stopPropagation(); handleEdit(project); }}
                  className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
                  title="Edit project"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(project.id); }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                  title="Delete project"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Expanded Content */}
            <div
              className={`grid grid-cols-1 gap-4 transition-all duration-200 ${
                expandedProjectId === project.id
                  ? 'opacity-100 max-h-[500px] p-4 border-t border-gray-100'
                  : 'opacity-0 max-h-0 overflow-hidden'
              }`}
            >
              {/* Description */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1">Description</h4>
                <p className="text-sm text-gray-700">{project.description}</p>
              </div>
              {/* Project Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Driver Type and Title */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Driver</h4>
                  <div className="flex items-center gap-2">
                    {getDriverTypeIcon(project.driver_type)}
                    <span className="text-sm text-gray-700 capitalize">{project.driver_type}</span>
                  </div>
                  {project.goal && (
                    <p className="text-sm text-gray-700 mt-1">{project.goal.title}</p>
                  )}
                </div>
                {/* Business */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Business</h4>
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{project.business?.name || 'No business linked'}</span>
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">Progress</h4>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full" 
                    style={{ 
                      width: `${((project.tasks || []).filter(t => t.is_done).length / Math.max((project.tasks || []).length, 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end p-3 border-t border-gray-100 mt-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects/${project.id}`);
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ProjectForm modal for editing */}
      {isEditModalOpen && (
        <ProjectForm
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditProject(null); }}
          initialProject={editProject}
          isEditMode={true}
          onProjectUpdated={() => {
            setIsEditModalOpen(false);
            setEditProject(null);
            // Optionally refetch projects or update state
          }}
        />
      )}
    </div>
  );
};

export default ProjectList; 