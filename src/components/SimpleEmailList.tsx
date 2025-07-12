import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../api/apiConfig';
import { EmailMessage } from '../types/email';
import { Project } from '../types/project';
import EmailItem from './EmailItem';
import { useDebounce } from '../hooks/useDebounce';

export interface SimpleEmailListRef {
  refresh: () => Promise<void>;
}

const EMAILS_PER_PAGE = 20; // Limit initial load to 20 emails

const SimpleEmailList = forwardRef<SimpleEmailListRef>((_, ref) => {
  const [displayedEmails, setDisplayedEmails] = useState<EmailMessage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedProjectFilter = useDebounce(projectFilter, 300);
  const debouncedStatusFilter = useDebounce(statusFilter, 300);

  const fetchEmails = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      const params: any = {
        page: reset ? 1 : currentPage,
        page_size: EMAILS_PER_PAGE
      };
      
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (debouncedProjectFilter) params.project = debouncedProjectFilter;
      if (debouncedStatusFilter === 'handled') params.is_handled = 'true';
      if (debouncedStatusFilter === 'unhandled') params.is_handled = 'false';
      if (debouncedStatusFilter === 'needs_reply') params.needs_reply = 'true';

      const response = await apiClient.get('/api/emails/', { params });
      const newEmails = response.data;
      
      if (reset) {
        setDisplayedEmails(newEmails);
      } else {
        setDisplayedEmails(prev => [...prev, ...newEmails]);
      }
      
      setHasMore(newEmails.length === EMAILS_PER_PAGE);
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearchQuery, debouncedProjectFilter, debouncedStatusFilter, currentPage]);

  const fetchProjectsAndPeople = useCallback(async () => {
    try {
      const [projectsResponse, peopleResponse] = await Promise.all([
        apiClient.get('/api/projects/'),
        apiClient.get('/api/people/')
      ]);
      setProjects(projectsResponse.data);
      setPeople(peopleResponse.data);
    } catch (error) {
      console.error('Error fetching projects and people:', error);
    }
  }, []);

  useEffect(() => {
    fetchProjectsAndPeople();
  }, [fetchProjectsAndPeople]);

  useEffect(() => {
    fetchEmails(true);
  }, [debouncedSearchQuery, debouncedProjectFilter, debouncedStatusFilter, fetchEmails]);

  useImperativeHandle(ref, () => ({
    refresh: () => fetchEmails(true)
  }));

  const handleEmailUpdated = useCallback((updatedEmail: EmailMessage) => {
    setDisplayedEmails(prevEmails => 
      prevEmails.map(email => 
        email.id === updatedEmail.id ? updatedEmail : email
      )
    );
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchEmails(false);
    }
  }, [hasMore, loadingMore, fetchEmails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search emails..."
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
              <option value="null">No Project</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="unhandled">Unhandled</option>
              <option value="handled">Handled</option>
              <option value="needs_reply">Needs Reply</option>
            </select>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Showing {displayedEmails.length} emails {hasMore && '(scroll for more)'}
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {displayedEmails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No emails found matching your filters.
          </div>
        ) : (
          <>
            {displayedEmails.map((email) => (
              <EmailItem
                key={email.id}
                email={email}
                people={people}
                onEmailUpdated={handleEmailUpdated}
              />
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Emails'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

SimpleEmailList.displayName = 'SimpleEmailList';

export default SimpleEmailList; 