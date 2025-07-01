import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchWithCSRF } from '../api/fetchWithCreds';
import { ArrowPathIcon, ExclamationTriangleIcon, WrenchIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ToolForm from './forms/ToolForm';
import API_BASE from '../apiBase';

// Interface for Tool data
interface Tool {
  id: number;
  name: string;
  description?: string;
  status?: string;
  category?: string;
  last_used?: string | null;
}

const ToolList: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/api/tools/`);
      setTools(response.data || []);
    } catch (err) {
      console.error("Error fetching tools:", err);
      setError("Failed to load tools.");
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
        const response = await fetchWithCSRF(`${API_BASE}/api/tools/${toolId}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to delete tool (${response.status})`);
        }
        
        setTools(tools.filter(tool => tool.id !== toolId));
    } catch (err) {
      console.error("Error deleting tool:", err);
      setDeleteError("Failed to delete tool. Please try again.");
      setTimeout(() => setDeleteError(null), 3000);
    }
  };

  const handleToolUpdated = (updatedTool: Tool) => {
    setTools(tools.map(tool => tool.id === updatedTool.id ? updatedTool : tool));
    setIsEditModalOpen(false);
    setSelectedTool(null);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-red-100 text-red-800';
      case 'new': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch { 
      return "Invalid Date"; 
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
    <div className="space-y-4">
      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {deleteError && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {deleteError}
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
                <div className="p-2 bg-primary-50 rounded-full">
                  <WrenchIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{tool.name}</h3>
                  {tool.status && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tool.status)}`}>
                      {tool.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
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
            
            {tool.category && (
              <p className="text-xs text-gray-500 mt-2">
                Category: {tool.category}
              </p>
            )}
            
            {tool.last_used && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                Last used: {formatDate(tool.last_used)}
              </p>
            )}
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