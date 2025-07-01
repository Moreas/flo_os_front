import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  FolderIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { apiClient } from '../api/apiConfig';

interface SearchResult {
  type: 'person' | 'project' | 'business' | 'task';
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  date?: string;
}

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let peopleResults: any[] = [];
        let projectResults: any[] = [];
        let businessResults: any[] = [];
        let taskResults: any[] = [];

        try {
          const peopleRes = await apiClient.get(`/api/people/?search=${encodeURIComponent(query)}`);
          peopleResults = peopleRes.data;
          console.log('People results:', peopleResults); // Debug log
        } catch (err) {
          console.error('Error fetching people:', err);
        }

        try {
          const projectsRes = await apiClient.get(`/api/projects/?search=${encodeURIComponent(query)}`);
          projectResults = projectsRes.data;
          console.log('Project results:', projectResults); // Debug log
        } catch (err) {
          console.error('Error fetching projects:', err);
        }

        try {
          const businessesRes = await apiClient.get(`/api/businesses/?search=${encodeURIComponent(query)}`);
          businessResults = businessesRes.data;
          console.log('Business results:', businessResults); // Debug log
        } catch (err) {
          console.error('Error fetching businesses:', err);
        }

        try {
          const tasksRes = await apiClient.get(`/api/tasks/?search=${encodeURIComponent(query)}`);
          taskResults = tasksRes.data;
          console.log('Task results:', taskResults); // Debug log
        } catch (err) {
          console.error('Error fetching tasks:', err);
        }

        const formattedResults: SearchResult[] = [
          ...peopleResults.map((person: any) => ({
            type: 'person' as const,
            id: person.id,
            title: person.name,
            subtitle: person.relationship,
            description: person.notes,
            date: person.last_interaction
          })),
          ...projectResults.map((project: any) => ({
            type: 'project' as const,
            id: project.id,
            title: project.name,
            description: project.description,
            status: project.status,
            date: project.created_at
          })),
          ...businessResults.map((business: any) => ({
            type: 'business' as const,
            id: business.id,
            title: business.name,
            description: business.description,
            status: business.status,
            date: business.created_at
          })),
          ...taskResults.map((task: any) => ({
            type: 'task' as const,
            id: task.id,
            title: task.description,
            subtitle: task.is_done ? 'Completed' : 'Pending',
            description: task.project?.name || task.business?.name,
            status: task.importance,
            date: task.due_date || task.created_at
          }))
        ];

        console.log('Formatted results:', formattedResults); // Debug log
        setResults(formattedResults);
      } catch (err) {
        console.error("Error in search:", err);
        setError("Failed to load search results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch { 
      return "Invalid Date"; 
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <UserIcon className="w-5 h-5 text-primary-600" />;
      case 'project':
        return <FolderIcon className="w-5 h-5 text-primary-600" />;
      case 'business':
        return <BuildingOfficeIcon className="w-5 h-5 text-primary-600" />;
      case 'task':
        return <CheckCircleIcon className="w-5 h-5 text-primary-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'person':
        return 'Person';
      case 'project':
        return 'Project';
      case 'business':
        return 'Business';
      case 'task':
        return 'Task';
      default:
        return type;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'person':
        navigate(`/people/${result.id}`);
        break;
      case 'project':
        navigate(`/projects/${result.id}`);
        break;
      case 'business':
        navigate(`/businesses/${result.id}`);
        break;
      case 'task':
        navigate(`/tasks`);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Search Results for "{query}"
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Found {results.length} results
        </p>
      </div>

      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No results found for "{query}"</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={`${result.type}-${result.id}`}
            className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer"
            onClick={() => handleResultClick(result)}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary-50 rounded-full">
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {result.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getTypeLabel(result.type)}
                  </span>
                </div>
                {result.subtitle && (
                  <p className="mt-1 text-sm text-gray-600">{result.subtitle}</p>
                )}
                {result.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {result.description}
                  </p>
                )}
                {result.date && (
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDate(result.date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResultsPage; 