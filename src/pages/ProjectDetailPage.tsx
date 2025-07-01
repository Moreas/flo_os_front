import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { Task } from '../types/task';
import { Project, ProjectNote } from '../types/project';
import API_BASE from '../apiBase';
import ProjectForm from '../components/forms/ProjectForm';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`${API_BASE}/api/projects/${id}/`);
        setProject(response.data);
      } catch (err) {
        setError('Failed to load project details.');
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTasks = async () => {
      if (!id) return;
      try {
        const response = await apiClient.get(`${API_BASE}/api/tasks/`, {
          params: { project: id }
        });
        setTasks(response.data || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchProject();
    fetchTasks();
  }, [id]);

  useEffect(() => {
    if (project && project.notes) {
      setNotes(project.notes);
    }
  }, [project]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    try {
      const res = await apiClient.post(`${API_BASE}/api/projects/${id}/notes/`, { content: newNote });
      setNotes([res.data, ...notes]);
      setNewNote('');
    } catch (err) {
      alert('Failed to add note.');
    }
  };

  const handleEditNote = (note: ProjectNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!editingNoteContent.trim() || !id) return;
    try {
      const res = await apiClient.patch(`${API_BASE}/api/projects/${id}/notes/${noteId}/`, { content: editingNoteContent });
      setNotes(notes.map(n => n.id === noteId ? res.data : n));
      setEditingNoteId(null);
      setEditingNoteContent('');
    } catch (err) {
      alert('Failed to update note.');
    }
  };

  const handleEditProject = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiClient.delete(`${API_BASE}/api/projects/${id}/`);
      navigate('/projects');
    } catch (err) {
      alert('Failed to delete project.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading project details...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Project not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
            {project.status && (
              <p className="mt-2 text-sm text-gray-500">Status: {project.status}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleEditProject}
              className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
              title="Edit project"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeleteProject}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
              title="Delete project"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks found for this project.</p>
        ) : (
          <ul className="space-y-4">
            {tasks.map(task => (
              <li key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{task.description}</p>
                  {task.due_date && (
                    <p className="text-sm text-gray-500">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.is_done ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.is_done ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        <form onSubmit={handleAddNote} className="flex mb-4 space-x-2">
          <textarea
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 min-h-[80px]"
            placeholder="Add a new note..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            rows={4}
          />
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add</button>
        </form>
        {notes.length === 0 ? (
          <p className="text-gray-500">No notes for this project.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map(note => (
              <li key={note.id} className="bg-gray-50 rounded-md p-3 flex items-center justify-between">
                {editingNoteId === note.id ? (
                  <>
                    <textarea
                      className="flex-1 border border-gray-300 rounded-md px-2 py-1 mr-2 min-h-[60px]"
                      value={editingNoteContent}
                      onChange={e => setEditingNoteContent(e.target.value)}
                      rows={3}
                    />
                    <button onClick={() => handleUpdateNote(note.id)} className="text-green-600 font-semibold mr-2">Save</button>
                    <button onClick={() => setEditingNoteId(null)} className="text-gray-500">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 break-words whitespace-pre-line">{note.content}</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(note.created_at).toLocaleString()}</span>
                    <button onClick={() => handleEditNote(note)} className="ml-4 text-blue-600 hover:underline">Edit</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isEditModalOpen && (
        <ProjectForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialProject={project}
          isEditMode={true}
          onProjectUpdated={() => {
            setIsEditModalOpen(false);
            // Refetch project details after edit
            apiClient.get(`${API_BASE}/api/projects/${id}/`).then(res => setProject(res.data));
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;