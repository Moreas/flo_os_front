import React, { useState, useEffect, useMemo, Fragment, useCallback, useRef } from 'react';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  BriefcaseIcon,
  FolderIcon,
  TagIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, isPast, isToday as dateFnsIsToday } from 'date-fns';
import TaskForm from './forms/TaskForm';
import API_BASE from '../apiBase';
import { Task } from '../types/task';
import { Category } from '../types/category';
import { Project } from '../types/project';
import { Business } from '../types/business';

// Fallback Data
const fallbackTasks: Task[] = [
    { 
      id: 1, 
      description: "Review project proposal", 
      is_done: false, 
      due_date: "2024-08-15T10:00:00Z", 
      created_at: "2024-08-01T09:00:00Z", 
      completion_date: null,
      importance: 'should_do',
      is_urgent: false,
      business: { id: 1, name: "Acme Corp" }, 
      project: { id: 1, name: "Website Redesign" }, 
      categories: [{ id: 1, name: "Planning" }],
      responsible: [],
      impacted: []
    },
    { 
      id: 2, 
      description: "Develop login feature", 
      is_done: true, 
      due_date: "2024-08-10T17:00:00Z", 
      created_at: "2024-07-25T14:30:00Z", 
      completion_date: "2024-08-10T17:00:00Z",
      importance: 'must_do',
      is_urgent: true,
      business: null,
      project: { id: 2, name: "Mobile App Dev" }, 
      categories: [{ id: 2, name: "Development" }, { id: 3, name: "Frontend" }],
      responsible: [],
      impacted: []
    },
    { 
      id: 3, 
      description: "Schedule team meeting", 
      is_done: false, 
      due_date: null,
      created_at: "2024-08-05T11:00:00Z", 
      completion_date: null,
      importance: 'could_do',
      is_urgent: false,
      business: null,
      project: null,
      categories: [],
      responsible: [],
      impacted: []
    },
    { 
      id: 4, 
      description: "Prepare tax documents", 
      is_done: false, 
      due_date: "2024-08-25T17:00:00Z", 
      created_at: "2024-08-06T10:00:00Z", 
      completion_date: null,
      importance: 'should_do',
      is_urgent: false,
      business: { id: 2, name: "Personal Finance"},
      project: null,
      categories: [{ id: 4, name: "Finance" }],
      responsible: [],
      impacted: []
    },
];
const fallbackCategories: Category[] = [ {id: 1, name: "Planning"}, {id: 2, name: "Development"}, {id: 3, name: "Frontend"}, {id: 4, name: "Finance"} ];
const fallbackProjects: Project[] = [ {id: 1, name: "Website Redesign"}, {id: 2, name: "Mobile App Dev"} ];

type SortField = 'due_date' | 'created_at' | 'business';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'completed';

// Updated: Helper to format date for date input using UTC
const formatDateForInput = (isoString?: string | null): string => {
    if (!isoString) return '';
    try {
        const date = parseISO(isoString); // date-fns parses ISO correctly
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }
        // Format to YYYY-MM-DD using UTC parts
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error formatting date for input:", e);
        return '';
    }
};

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [businessFilter, setBusinessFilter] = useState<string>('all');
  const [showDueTodayOrBefore, setShowDueTodayOrBefore] = useState<boolean>(true);

  // Sorting
  const [sortBy, setSortBy] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Delete State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Toggle Status State
  const [taskBeingToggledId, setTaskBeingToggledId] = useState<number | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // --- Inline Date Edit State ---
  const [editingDateTaskId, setEditingDateTaskId] = useState<number | null>(null);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null); // Ref for focusing
  // ------------------------------

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tasksRes, categoriesRes, projectsRes, businessesRes] = await Promise.all([
          axios.get(`${API_BASE}/api/tasks/`).catch(() => ({ data: fallbackTasks })),
          axios.get(`${API_BASE}/api/categories/`).catch(() => ({ data: fallbackCategories })),
          axios.get(`${API_BASE}/api/projects/`).catch(() => ({ data: fallbackProjects })),
          axios.get(`${API_BASE}/api/businesses/`).catch(() => ({ data: [] }))
        ]);
        setTasks(tasksRes.data);
        setCategories(categoriesRes.data);
        setProjects(projectsRes.data);
        setBusinesses(businessesRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Displaying sample data.");
        setTasks(fallbackTasks);
        setCategories(fallbackCategories);
        setProjects(fallbackProjects);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleDone = async (taskId: number) => {
    const originalTasks = [...tasks];
    const taskToToggle = originalTasks.find(t => t.id === taskId);
    if (!taskToToggle) return;

    setTaskBeingToggledId(taskId); // Indicate which task is being toggled
    setIsToggling(true);

    // Optimistically update UI - NOW includes completion_date
    const newIsDoneStatus = !taskToToggle.is_done;
    setTasks(currentTasks => 
      currentTasks.map(task => {
        if (task.id === taskId) {
            return { 
                ...task, 
                is_done: newIsDoneStatus,
                // Set/clear completion_date locally for immediate UI update
                completion_date: newIsDoneStatus ? new Date().toISOString() : null 
            };
        }
        return task;
      })
    );
    
    try {
      // Actual API call to update the task status
      await axios.patch(`${API_BASE}/api/tasks/${taskId}/`, { 
          is_done: newIsDoneStatus 
      });
      // Success! Keep the optimistic update.
      console.log(`Task ${taskId} status updated successfully.`);
    } catch (error: any) {
      console.error("Failed to update task status:", error);
      // Revert UI on error
      setTasks(originalTasks);
      // Show error message to user
      alert(`Error updating task: ${error.response?.data?.detail || 'Failed to update status.'}`);
    } finally {
      setIsToggling(false);
      setTaskBeingToggledId(null); // Clear indicator
    }
  };

  const openConfirmationModal = (taskId: number) => {
    setTaskToDeleteId(taskId);
    setDeleteError(null); // Clear previous errors
    setIsConfirmModalOpen(true);
  };

  const closeConfirmationModal = useCallback(() => {
    if (isDeleting) return; // Prevent closing while delete is in progress
    setIsConfirmModalOpen(false);
    // Delay resetting ID to allow modal fade out
    setTimeout(() => {
        setTaskToDeleteId(null);
        setDeleteError(null);
    }, 300);
  }, [isDeleting]);

  const handleDeleteTask = async () => {
    if (taskToDeleteId === null) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await axios.delete(`${API_BASE}/api/tasks/${taskToDeleteId}/`);
      // Remove task from local state on success
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskToDeleteId));
      closeConfirmationModal();
      // TODO: Add success toast notification if desired
      console.log(`Task ${taskToDeleteId} deleted successfully.`);
    } catch (err: any) {
      console.error("Error deleting task:", err);
      const errorMsg = err.response?.data?.detail || err.response?.data || 'Failed to delete task.';
      setDeleteError(errorMsg);
      // Keep modal open to show error
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (task: Task) => {
    setTaskToEdit(task);
    // Clear previous errors if reusing form
    // setEditError(null); 
    setIsEditModalOpen(true);
  };

  const closeEditModal = useCallback(() => {
    // Add check if submitting edit later
    // if (isEditing) return;
    setIsEditModalOpen(false);
    // Delay resetting data to allow modal fade out
    setTimeout(() => {
        setTaskToEdit(null);
        // setEditError(null);
    }, 300);
  }, []);

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    // Optionally close modal here if not handled in form, 
    // but TaskForm currently closes itself on success.
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Text Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task => {
        // Search in task description
        if (task.description.toLowerCase().includes(query)) return true;
        
        // Search in project name
        if (task.project?.name.toLowerCase().includes(query)) return true;
        
        // Search in business name
        if (task.business?.name.toLowerCase().includes(query)) return true;
        
        // Search in category names
        if (task.categories.some(cat => cat.name.toLowerCase().includes(query))) return true;
        
        return false;
      });
    }

    // Status Filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(task => !task.is_done);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(task => task.is_done);
    }

    // Category Filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => 
        task.categories.some(cat => cat.id === parseInt(categoryFilter))
      );
    }

    // Project Filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.project?.id === parseInt(projectFilter));
    }

    // Business Filter
    if (businessFilter !== 'all') {
      filtered = filtered.filter(task => task.business?.id === parseInt(businessFilter));
    }

    // Due Date Filter
    if (showDueTodayOrBefore) {
      const now = new Date();
      const nowUtcYear = now.getUTCFullYear();
      const nowUtcMonth = now.getUTCMonth();
      const nowUtcDay = now.getUTCDate();

      filtered = filtered.filter(task => {
        if (!task.due_date) return false;
        
        let dueDate: Date;
        try {
          dueDate = parseISO(task.due_date);
          if (isNaN(dueDate.getTime())) return false; // Invalid date string
        } catch (e) {
          return false; // Error parsing date
        }
        
        // Show tasks due today or before (including overdue)
        const endOfTodayUTC = new Date(Date.UTC(nowUtcYear, nowUtcMonth, nowUtcDay, 23, 59, 59, 999));
        return dueDate.getTime() <= endOfTodayUTC.getTime();
      });
    }

    // Sorting
    filtered.sort((a, b) => {
        let valA: any;
        let valB: any;

        // Handle null/undefined dates/names for sorting
        switch (sortBy) {
            case 'due_date':
                valA = a.due_date ? parseISO(a.due_date).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
                valB = b.due_date ? parseISO(b.due_date).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
                break;
            case 'created_at':
                valA = a.created_at ? parseISO(a.created_at).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
                valB = b.created_at ? parseISO(b.created_at).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
                break;
            case 'business':
                // Case-insensitive sort, place tasks without business consistently
                valA = a.business?.name?.toLowerCase() ?? (sortDirection === 'asc' ? '\uffff' : ''); // Sort nulls last ascending
                valB = b.business?.name?.toLowerCase() ?? (sortDirection === 'asc' ? '\uffff' : '');
                break;
            default:
                 return 0; // Should not happen
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });


    return filtered;
  }, [tasks, searchQuery, statusFilter, categoryFilter, projectFilter, businessFilter, showDueTodayOrBefore, sortBy, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) return <ChevronDownIcon className="w-3 h-3 text-gray-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="w-3 h-3 text-gray-600 ml-1" /> : 
      <ChevronDownIcon className="w-3 h-3 text-gray-600 ml-1" />;
  };

  // Updated: formatDate to compensate for timezone display offset
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No due date';
    try {
        const date = parseISO(dateString); // Parse the ISO string (likely UTC)
        // Get the date parts in UTC to avoid local conversion issues for comparison/display logic
        const utcYear = date.getUTCFullYear();
        const utcMonth = date.getUTCMonth();
        const utcDay = date.getUTCDate();
        const now = new Date();
        const nowUtcYear = now.getUTCFullYear();
        const nowUtcMonth = now.getUTCMonth();
        const nowUtcDay = now.getUTCDate();
        if (utcYear === nowUtcYear && utcMonth === nowUtcMonth && utcDay === nowUtcDay) {
             return 'Today';
        }
        // Remove unused displayMonth and displayDay assignments
        const localOffsetMinutes = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() + localOffsetMinutes * 60 * 1000);
        return format(adjustedDate, 'MMM d');
    } catch (e) {
        console.error("Error parsing/formatting date:", dateString, e);
        return "Invalid date";
    }
  }

  // --- Inline Date Update Logic ---
  const handleInlineDateChange = async (taskId: number, newDateValue: string) => {
    setIsUpdatingDate(true);
    const originalTasks = [...tasks]; // For potential revert
    const taskToUpdate = originalTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    let newDueDateISO: string | null = null;
    try {
        if (newDateValue) { // newDateValue is "YYYY-MM-DD"
            // We still parse it to check validity and potentially use the ISO for local state if needed
            const date = new Date(newDateValue + 'T00:00:00Z');
            if (!isNaN(date.getTime())) {
                 newDueDateISO = date.toISOString(); // Keep ISO for potential local use
            } else {
                 throw new Error("Invalid date format selected");
            }
        } // If newDateValue is empty, newDueDateISO remains null

        // Optimistically update UI before API call for responsiveness
        // Still using ISO locally might be fine, depends on formatting functions
        setTasks(currentTasks => 
            currentTasks.map(task => 
                task.id === taskId ? { ...task, due_date: newDueDateISO } : task
            )
        );
        setEditingDateTaskId(null); // Exit edit mode immediately

        // API call
        // Send the correct format required by the backend (YYYY-MM-DD or null)
        const payloadDueDate = newDateValue ? newDateValue : null; 
        await axios.patch(`${API_BASE}/api/tasks/${taskId}/`, { 
            due_date: payloadDueDate // Send YYYY-MM-DD or null
        });
        // Success! Keep optimistic update

    } catch (error: any) {
        console.error("Failed to update task due date:", error);
        // Revert UI on error
        setTasks(originalTasks);
    } finally {
        setIsUpdatingDate(false);
        // Ensure edit mode is exited even on error, if desired
        // setEditingDateTaskId(null); 
    }
  };

  // Focus input when edit mode starts for a task date
  useEffect(() => {
    if (editingDateTaskId !== null && dateInputRef.current) {
      dateInputRef.current.focus();
      // Select the text for easier replacement (optional)
      // dateInputRef.current.select(); 
    }
  }, [editingDateTaskId]);
  // --- End Inline Date Update Logic ---

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
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

      {/* Search Bar - always at the top */}
      <div className="relative max-w-md mb-2">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search tasks, projects, businesses, or categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
        {/* Status Filter */}
        <div>
          <label htmlFor="status-filter" className="sr-only">Status</label>
          <select 
            id="status-filter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="block w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        {/* Category Filter */}
         <div>
           <label htmlFor="category-filter" className="sr-only">Category</label>
           <select 
             id="category-filter"
             value={categoryFilter} 
             onChange={(e) => setCategoryFilter(e.target.value)}
             className="block w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
           >
             <option value="all">All Categories</option>
             {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
           </select>
         </div>

        {/* Project Filter */}
        <div>
          <label htmlFor="project-filter" className="sr-only">Project</label>
          <select 
            id="project-filter"
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)}
            className="block w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="all">All Projects</option>
            {projects.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
          </select>
        </div>

        {/* Business Filter */}
        <div>
          <label htmlFor="business-filter" className="sr-only">Business</label>
          <select 
            id="business-filter"
            value={businessFilter} 
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="block w-full pl-3 pr-8 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="all">All Businesses</option>
            {businesses.map(biz => <option key={biz.id} value={biz.id}>{biz.name}</option>)}
          </select>
        </div>

        {/* Due Date Filter */}
        <div className="flex items-center">
          <input
            id="due-today-or-before-filter"
            name="due-today-or-before-filter"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            checked={showDueTodayOrBefore}
            onChange={(e) => setShowDueTodayOrBefore(e.target.checked)}
          />
          <label htmlFor="due-today-or-before-filter" className="ml-2 block text-sm text-gray-900">
            Due today or before
          </label>
        </div>
      </div>

      {/* Task List */}
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"> {/* Checkbox */} </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group w-24" onClick={() => handleSort('due_date')}>
                 <span className="flex items-center">Due {renderSortIcon('due_date')}</span>
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Project</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group w-32" onClick={() => handleSort('business')}>
                 <span className="flex items-center">Business {renderSortIcon('business')}</span>
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Categories</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group w-28" onClick={() => handleSort('created_at')}>
                 <span className="flex items-center">Created {renderSortIcon('created_at')}</span>
              </th>
              <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredAndSortedTasks.length > 0 ? (
              filteredAndSortedTasks.map((task) => (
                <tr key={task.id} className={`hover:bg-primary-50 transition-colors duration-100 ${task.is_done ? 'opacity-60' : ''}`}>
                  {/* Checkbox Column */}
                  <td className="px-3 py-1.5 whitespace-nowrap align-top">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      checked={task.is_done}
                      onChange={() => handleToggleDone(task.id)}
                      disabled={isToggling && taskBeingToggledId === task.id}
                    />
                  </td>
                  {/* Task Description Column */}
                  <td className="px-3 py-1.5 text-sm text-gray-900 align-top">
                      <span className={task.is_done ? 'line-through text-gray-500' : ''}>{task.description}</span>
                      {task.is_done && task.completion_date && (
                          <span className="block text-xs text-gray-400 mt-0.5">
                              Completed: {format(parseISO(task.completion_date), 'MMM d, yyyy')}
                          </span>
                      )}
                  </td>
                  {/* Due Date Column */}
                  <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-500 align-top">
                    {editingDateTaskId === task.id ? (
                      <input
                        ref={dateInputRef}
                        type="date"
                        className="block w-full p-0.5 border border-primary-300 rounded shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                        value={formatDateForInput(task.due_date)}
                        onChange={(e) => handleInlineDateChange(task.id, e.target.value)}
                        onBlur={() => setEditingDateTaskId(null)}
                        disabled={isUpdatingDate}
                      />
                    ) : (
                      <span 
                        className="flex items-center cursor-pointer group"
                        onClick={() => { if (!task.is_done) setEditingDateTaskId(task.id); }}
                        title={task.is_done ? "Cannot edit date for completed task" : "Click to edit due date"}
                      >
                          <CalendarDaysIcon className={`w-4 h-4 mr-1.5 ${task.due_date && isPast(parseISO(task.due_date)) && !dateFnsIsToday(parseISO(task.due_date)) && !task.is_done ? 'text-red-500' : 'text-gray-400'} ${!task.is_done ? 'group-hover:text-primary-600' : ''}`} />
                          <span className={!task.is_done ? 'group-hover:text-primary-700' : ''}>{formatDate(task.due_date)}</span>
                      </span>
                    )}
                  </td>
                  {/* Project Column */}
                  <td className="px-3 py-1.5 text-sm text-gray-500 align-top">
                    {task.project && (
                        <div className="flex items-center text-xs">
                           <FolderIcon className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" />
                           <span className="truncate" title={task.project.name}>{task.project.name}</span>
                        </div>
                    )}
                  </td>
                  {/* Business Column */}
                  <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-500 align-top">
                    {task.business && (
                       <span className="flex items-center">
                        <BriefcaseIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        {task.business.name}
                       </span>
                    )}
                  </td>
                  {/* Categories Column */}
                  <td className="px-3 py-1.5 text-sm text-gray-500 align-top">
                    {task.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.categories.map(cat => (
                           <span key={cat.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                               <TagIcon className="w-3 h-3 mr-0.5 text-gray-500" />
                               {cat.name}
                           </span>
                        ))}
                      </div>
                    )}
                  </td>
                   {/* Created Column */}
                   <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-500 align-top">
                     {task.created_at ? format(parseISO(task.created_at), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  {/* Actions Column */}
                  <td className="px-3 py-1.5 whitespace-nowrap text-center text-sm font-medium align-top">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Toggle Done Button */} 
                      <button 
                        onClick={() => handleToggleDone(task.id)}
                        className={`p-1 rounded transition-colors disabled:opacity-50 ${ 
                            task.is_done 
                            ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100' 
                            : 'text-green-600 hover:text-green-800 hover:bg-green-100'
                        }`}
                        aria-label={task.is_done ? "Mark task as active" : "Mark task as complete"}
                        title={task.is_done ? "Mark task as active" : "Mark task as complete"}
                        disabled={isToggling && taskBeingToggledId === task.id}
                      >
                         {isToggling && taskBeingToggledId === task.id ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                         ) : task.is_done ? (
                            <XCircleIcon className="w-4 h-4" />
                         ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                         )} 
                      </button>

                      {/* Edit Button */}
                      <button 
                        onClick={() => openEditModal(task)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Edit task ${task.description}`}
                        title="Edit task"
                        disabled={task.is_done}
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button 
                        onClick={() => openConfirmationModal(task.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Delete task ${task.description}`}
                        disabled={task.is_done} 
                        title={task.is_done ? "Cannot delete completed tasks" : "Delete task"}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center px-6 py-4 text-sm text-gray-500">
                  No tasks match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isConfirmModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeConfirmationModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
                    Confirm Deletion
                  </Dialog.Title>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete this task? This action cannot be undone.
                    </p>
                  </div>

                  {deleteError && (
                    <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                        {deleteError}
                    </div>
                  )}

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDeleteTask}
                      disabled={isDeleting}
                    >
                       {isDeleting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                       {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50"
                      onClick={closeConfirmationModal}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Task Modal - Uncommented and props added */}
      {taskToEdit && (
          <TaskForm 
             isOpen={isEditModalOpen}
             onClose={closeEditModal}
             // Pass the update handler instead of creation handler for edit mode
             onTaskCreated={() => {}} // Keep this for prop type conformity, or adjust TaskForm props
             onTaskUpdated={handleTaskUpdated} // Pass the new update handler
             initialTaskData={taskToEdit} // Pass task data to form
             isEditMode={true}          // Indicate form is in edit mode
          />
      )}
    </div>
  );
};

export default TaskList; 