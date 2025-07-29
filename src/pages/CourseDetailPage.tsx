import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { Course } from '../types/course';
import { ArrowPathIcon, ExclamationTriangleIcon, PencilIcon, TrashIcon, ArrowLeftIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import CourseForm from '../components/forms/CourseForm';
import ModuleForm from '../components/forms/ModuleForm';
import LessonForm from '../components/forms/LessonForm';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/courses/${id}/`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [id, fetchCourse]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/courses/${id}/`);
      navigate('/learning');
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const handleModuleCompletion = async (moduleId: number, isCompleted: boolean) => {
    try {
      await apiClient.patch(`/api/modules/${moduleId}/`, { is_completed: isCompleted });
      await fetchCourse();
    } catch (error) {
      console.error('Error updating module completion:', error);
      alert('Failed to update module completion status');
    }
  };

  const handleLessonCompletion = async (lessonId: number, isCompleted: boolean) => {
    try {
      await apiClient.patch(`/api/lessons/${lessonId}/`, { is_completed: isCompleted });
      await fetchCourse();
    } catch (error) {
      console.error('Error updating lesson completion:', error);
      alert('Failed to update lesson completion status');
    }
  };

  const handleAddLesson = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setIsLessonFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error || 'Course not found'}</h3>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/learning')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
            {course.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Course Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Course Information</h2>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Source</dt>
                <dd className="mt-1 text-sm text-gray-900">{course.source}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Started</dt>
                <dd className="mt-1 text-sm text-gray-900">{course.started_at || 'Not started'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{course.description || 'No description provided'}</dd>
              </div>
            </dl>
          </div>

          {/* Modules */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Modules</h2>
              <button
                onClick={() => setIsModuleFormOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Module
              </button>
            </div>
            <div className="space-y-4">
              {course.modules.map((module) => (
                <div key={module.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleModuleCompletion(module.id, !module.is_completed)}
                        className={`p-1 rounded-full ${module.is_completed ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'}`}
                      >
                        <CheckCircleIcon className="h-6 w-6" />
                      </button>
                      <h3 className="text-md font-medium text-gray-900">{module.title}</h3>
                    </div>
                    <button
                      onClick={() => handleAddLesson(module.id)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Lesson
                    </button>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleLessonCompletion(lesson.id, !lesson.is_completed)}
                              className={`p-1 rounded-full ${lesson.is_completed ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'}`}
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{lesson.title}</h4>
                              {lesson.video_url && (
                                <a
                                  href={lesson.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary-600 hover:text-primary-800"
                                >
                                  Watch Video
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        {(lesson.summary || lesson.personal_notes) && (
                          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {lesson.summary && (
                              <div>
                                <h5 className="text-xs font-medium text-gray-500">Summary</h5>
                                <p className="mt-1 text-sm text-gray-600">{lesson.summary}</p>
                              </div>
                            )}
                            {lesson.personal_notes && (
                              <div>
                                <h5 className="text-xs font-medium text-gray-500">Personal Notes</h5>
                                <p className="mt-1 text-sm text-gray-600">{lesson.personal_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CourseForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onCourseCreated={fetchCourse}
        initialCourse={course}
        isEditMode={true}
      />

      <ModuleForm
        isOpen={isModuleFormOpen}
        onClose={() => setIsModuleFormOpen(false)}
        onModuleCreated={fetchCourse}
        courseId={course?.id || 0}
      />

      <LessonForm
        isOpen={isLessonFormOpen}
        onClose={() => setIsLessonFormOpen(false)}
        onLessonCreated={fetchCourse}
        moduleId={selectedModuleId || 0}
      />
    </div>
  );
};

export default CourseDetailPage; 