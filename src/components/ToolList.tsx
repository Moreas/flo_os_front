import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiConfig';
import { ArrowPathIcon, ExclamationTriangleIcon, WrenchIcon, PencilIcon, TrashIcon, LinkIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import ToolForm from './forms/ToolForm';
import { Tool } from '../types/tool';

const ToolList: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/tools/');
      setTools(response.data);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setError('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const handleEdit = (tool: Tool) => {
    setSelectedTool(tool);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (toolId: number) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      const response = await apiClient.delete(`/api/tools/${toolId}/`);
      
      if (response.status >= 200 && response.status < 300) {
        setTools(tools.filter(tool => tool.id !== toolId));
      } else {
        const errorData = response.data;
        console.error('Delete failed:', errorData);
        alert('Failed to delete tool: ' + (errorData?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Failed to delete tool');
    }
  };

  const handleToolUpdated = (updatedTool: Tool) => {
    setTools(tools.map(tool => tool.id === updatedTool.id ? updatedTool : tool));
    setIsEditModalOpen(false);
    setSelectedTool(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
        return 'bg-gray-100 text-gray-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading tools...</span>
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

      {tools.length === 0 && !error && !loading && (
        <p className="text-center text-gray-500 py-4">No tools found.</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div 
            key={tool.id} 
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-150"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${tool.is_internal ? 'bg-blue-50' : 'bg-primary-50'}`}>
                  <WrenchIcon className={`w-5 h-5 ${tool.is_internal ? 'text-blue-600' : 'text-primary-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{tool.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tool.status)}`}>
                      {tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                    </span>
                    {tool.is_internal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckIcon className="w-3 h-3 mr-1" />
                        Internal
                      </span>
                    )}
                    {tool.pending_review && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Review
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEdit(tool)}
                  className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  title="Edit tool"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tool.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                  title="Delete tool"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {tool.description && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-3">{tool.description}</p>
            )}
            
            {tool.url_or_path && (
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <LinkIcon className="w-3 h-3 mr-1" />
                <span className="truncate">{tool.url_or_path}</span>
              </div>
            )}
            
            {tool.related_project && (
              <p className="text-xs text-gray-500 mt-2">
                Project: {tool.related_project.name}
              </p>
            )}
            
            <p className="text-xs text-gray-400 mt-2 text-right">
              Created: {formatDate(tool.created_at)}
            </p>
          </div>
        ))}
      </div>

      {selectedTool && (
        <ToolForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTool(null);
          }}
          onToolCreated={handleToolUpdated}
          initialTool={selectedTool}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default ToolList; 