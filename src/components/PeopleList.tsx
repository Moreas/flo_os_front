import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { ArrowPathIcon, ExclamationTriangleIcon, UserCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import PersonForm from './forms/PersonForm';

// Interface for Person data - should match definition in PeoplePage or a shared types file
interface Person {
  id: number;
  name: string;
  relationship?: string;
  notes?: string;
  appreciation?: string;
  triggers?: string;
  last_interaction?: string;
  is_self?: boolean;
}

const PeopleList: React.FC = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/people/');
      setPeople(response.data);
    } catch (error) {
      console.error('Error fetching people:', error);
      setError('Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleEdit = (person: Person) => {
    setSelectedPerson(person);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (personId: number) => {
    if (!window.confirm('Are you sure you want to delete this person?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/people/${personId}/`);

      if (response.status >= 200 && response.status < 300) {
        setPeople(people.filter(person => person.id !== personId));
        setDeleteError(null);
      } else {
        const errorData = response.data;
        throw new Error(errorData?.detail || `Failed to delete person (${response.status})`);
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      setDeleteError("Failed to delete person. Please try again.");
      setTimeout(() => setDeleteError(null), 3000);
    }
  };

  const handlePersonUpdated = () => {
    fetchPeople();
    setIsEditModalOpen(false);
    setSelectedPerson(null);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch { 
      return "Invalid Date"; 
    }
  };

  // Sort people so is_self comes first
  const sortedPeople = [...people].sort((a, b) => (b.is_self ? 1 : 0) - (a.is_self ? 1 : 0));

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

      {people.length === 0 && !error && !loading && (
        <p className="text-center text-gray-500 py-4">No people found.</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPeople.map((person) => (
          <div
            key={person.id}
            className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer ${person.is_self ? 'bg-blue-50 border-blue-300' : ''}`}
            onClick={() => navigate(`/people/${person.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-50 rounded-full">
                  <UserCircleIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{person.name}</h3>
                  {person.is_self && (
                    <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 rounded px-2 py-0.5 ml-1 align-middle">Myself</span>
                  )}
                  {person.relationship && (
                    <p className="mt-1 text-sm text-gray-600">{person.relationship}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleEdit(person)}
                  className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  title="Edit person"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(person.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                  title="Delete person"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {person.appreciation && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-gray-500">Appreciation</h4>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{person.appreciation}</p>
              </div>
            )}
            
            {person.triggers && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-gray-500">Triggers</h4>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{person.triggers}</p>
              </div>
            )}
            
            {person.last_interaction && (
              <p className="text-xs text-gray-400 mt-3">
                Last interaction: {formatDate(person.last_interaction)}
              </p>
            )}
          </div>
        ))}
      </div>

      {selectedPerson && (
        <PersonForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPerson(null);
          }}
          onPersonCreated={handlePersonUpdated}
          initialPerson={selectedPerson}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default PeopleList; 