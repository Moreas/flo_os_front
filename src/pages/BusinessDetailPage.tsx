import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../api/apiConfig';
import { Business } from '../types/business';
import RelatedItemsList from '../components/ui/RelatedItemsList';
import { BusinessValuation } from '../components/BusinessValuation';

type SortField = 'due' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'completed';

const BusinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task sorting and filtering state
  const [sortField, setSortField] = useState<SortField>('due');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [isUpdatingTask, setIsUpdatingTask] = useState<number | null>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        console.log('Fetching business with ID:', id);
        const response = await apiClient.get(`/api/businesses/${id}/`);
        console.log('API Response:', response.data);
        
        // Ensure arrays are initialized even if they're not in the response
        const businessData = {
          ...response.data,
          tasks: response.data.tasks || [],
          projects: response.data.projects || [],
          goals: response.data.goals || []
        };
        console.log('Processed business data:', businessData);
        setBusiness(businessData);
      } catch (err) {
        console.error("Error fetching business:", err);
        setError("Failed to load business details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTaskToggle = async (taskId: number, currentStatus: boolean) => {
    if (!business) return;
    
    setIsUpdatingTask(taskId);
    try {
      await apiClient.patch(`/api/tasks/${taskId}/`, {
        is_done: !currentStatus
      });

      // Update the task in the business state
      setBusiness(prev => {
        if (!prev || !prev.tasks) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(task => 
            task.id === taskId ? { ...task, is_done: !currentStatus } : task
          )
        };
      });
    } catch (err) {
      console.error("Error updating task:", err);
      // You might want to show an error message to the user here
    } finally {
      setIsUpdatingTask(null);
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

  const filteredAndSortedTasks = useMemo(() => {
    if (!business || !business.tasks) return [];

    let filtered = [...business.tasks];

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(task => !task.is_done);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(task => task.is_done);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'due':
          valA = a.due ? new Date(a.due).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          valB = b.due ? new Date(b.due).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          break;
        case 'status':
          valA = a.is_done ? 1 : 0;
          valB = b.is_done ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [business, sortField, sortDirection, statusFilter]);

  const handleCreateTask = () => {
    navigate(`/tasks/new?business_id=${id}`);
  };

  const handleCreateProject = () => {
    navigate(`/projects/new?business_id=${id}`);
  };

  const handleCreateGoal = () => {
    navigate(`/goals/new?business_id=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
        {error || "Business not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Description Card */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900">{business.name}</h1>
          {business.description && (
            <p className="mt-2 text-gray-600">{business.description}</p>
          )}
          <span className={`inline-block mt-4 px-3 py-1 rounded-full text-sm font-medium ${
            business.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {business.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Valuation Card */}
        <div>
          <BusinessValuation business={business} />
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Related Tasks</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCreateTask}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5" />
              New Task
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
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
            onClick={() => handleSort('due')}
            className="flex items-center hover:text-gray-700"
          >
            Due Date {renderSortIcon('due')}
          </button>
          <button
            onClick={() => handleSort('status')}
            className="flex items-center hover:text-gray-700"
          >
            Status {renderSortIcon('status')}
          </button>
        </div>

        <RelatedItemsList
          items={filteredAndSortedTasks}
          type="tasks"
          onItemClick={(task) => navigate(`/tasks/${task.id}`)}
          onTaskToggle={handleTaskToggle}
          isUpdatingTask={isUpdatingTask}
        />
      </div>

      {/* Projects and Goals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Related Projects</h2>
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5" />
              New Project
            </button>
          </div>
          <RelatedItemsList
            items={business.projects || []}
            type="projects"
            onItemClick={(project) => navigate(`/projects/${project.id}`)}
          />
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Related Goals</h2>
            <button
              onClick={handleCreateGoal}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5" />
              New Goal
            </button>
          </div>
          <RelatedItemsList
            items={business.goals || []}
            type="goals"
            onItemClick={(goal) => navigate(`/goals/${goal.id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailPage; 