import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, UserCircleIcon, PencilIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import PersonForm from '../components/forms/PersonForm';
import RelatedItemsList from '../components/ui/RelatedItemsList';
import API_BASE from '../apiBase';

interface Person {
  id: number;
  name: string;
  relationship?: string;
  notes?: string;
  appreciation?: string;
  triggers?: string;
  last_interaction?: string;
  tasks?: Array<{
    id: number;
    title: string;
    status: string;
    due_date?: string;
  }>;
  projects?: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  goals?: Array<{
    id: number;
    title: string;
    status: string;
    target_date?: string;
  }>;
  journal_entries?: Array<{
    id: number;
    content: string;
    created_at: string;
    emotion?: string;
  }>;
}

const PersonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE}/api/people/${id}/`);
        setPerson(response.data);
      } catch (err) {
        console.error("Error fetching person:", err);
        setError("Failed to load person details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id]);

  const handlePersonUpdated = (updatedPerson: Person) => {
    setPerson(updatedPerson);
    setIsEditModalOpen(false);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
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

  if (error || !person) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500">{error || "Person not found"}</p>
          <button
            onClick={() => navigate('/people')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Return to People
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/people')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to People
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-50 rounded-full">
              <UserCircleIcon className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
              {person.relationship && (
                <p className="mt-1 text-sm text-gray-600">{person.relationship}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {person.appreciation && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Appreciation</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{person.appreciation}</dd>
              </div>
            )}

            {person.triggers && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Triggers</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{person.triggers}</dd>
              </div>
            )}

            {person.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{person.notes}</dd>
              </div>
            )}

            {person.last_interaction && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Interaction</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(person.last_interaction)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {person.tasks && person.tasks.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Related Tasks</h2>
            <RelatedItemsList
              items={person.tasks.map(task => ({
                id: task.id,
                title: task.title,
                status: task.status,
                date: task.due_date,
                type: 'tasks'
              }))}
              type="tasks"
              onItemClick={(task) => navigate(`/tasks/${task.id}`)}
            />
          </div>
        )}

        {person.projects && person.projects.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Related Projects</h2>
            <RelatedItemsList
              items={person.projects.map(project => ({
                id: project.id,
                title: project.name,
                status: project.status,
                type: 'projects'
              }))}
              type="projects"
              onItemClick={(project) => navigate(`/projects/${project.id}`)}
            />
          </div>
        )}

        {person.goals && person.goals.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Related Goals</h2>
            <RelatedItemsList
              items={person.goals.map(goal => ({
                id: goal.id,
                title: goal.title,
                status: goal.status,
                date: goal.target_date,
                type: 'goals'
              }))}
              type="goals"
              onItemClick={(goal) => navigate(`/goals/${goal.id}`)}
            />
          </div>
        )}

        {person.journal_entries && person.journal_entries.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Related Journal Entries</h2>
            <div className="space-y-4">
              {person.journal_entries.map(entry => (
                <div
                  key={entry.id}
                  className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer"
                  onClick={() => navigate(`/journal/${entry.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 line-clamp-3">{entry.content}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {formatDate(entry.created_at)}
                        {entry.emotion && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {entry.emotion}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <PersonForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onPersonCreated={handlePersonUpdated}
          initialPerson={person}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default PersonDetailPage; 