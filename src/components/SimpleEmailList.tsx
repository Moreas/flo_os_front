import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../api/apiConfig';
import { EmailMessage } from '../types/email';
import { Project } from '../types/project';
import EmailItem from './EmailItem';

export interface SimpleEmailListRef {
  refresh: () => Promise<void>;
}

const SimpleEmailList = forwardRef<SimpleEmailListRef>((_, ref) => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchQuery) params.search = searchQuery;
      if (projectFilter) params.project = projectFilter;
      if (statusFilter === 'handled') params.is_handled = 'true';
      if (statusFilter === 'unhandled') params.is_handled = 'false';
      if (statusFilter === 'needs_reply') params.needs_reply = 'true';

      const response = await apiClient.get('/api/emails/', { params });
      setEmails(response.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/api/projects/');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, projectFilter, statusFilter]);

  useImperativeHandle(ref, () => ({
    refresh: fetchEmails
  }));

  const handleEmailUpdated = (updatedEmail: EmailMessage) => {
    setEmails(emails.map(email => 
      email.id === updatedEmail.id ? updatedEmail : email
    ));
  };

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
          Showing {emails.length} emails
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {emails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No emails found matching your filters.
          </div>
        ) : (
          emails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              onEmailUpdated={handleEmailUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
});

SimpleEmailList.displayName = 'SimpleEmailList';

export default SimpleEmailList; 