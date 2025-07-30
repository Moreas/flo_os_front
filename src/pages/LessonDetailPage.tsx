import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { Lesson } from '../types/course';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/lessons/${lessonId}/`);
        setLesson(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load lesson details');
        console.error('Error fetching lesson:', err);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const handleMarkCompleted = async () => {
    try {
      await apiClient.patch(`/api/lessons/${lessonId}/`, {
        is_completed: !lesson?.is_completed
      });
      setLesson(prev => prev ? { ...prev, is_completed: !prev.is_completed } : null);
    } catch (err) {
      console.error('Error updating lesson completion status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error || 'Lesson not found'}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-500">
                Created: {new Date(lesson.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  lesson.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {lesson.is_completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
            <button
              onClick={handleMarkCompleted}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                lesson.is_completed
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
                  : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
              }`}
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              {lesson.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Video Section */}
          {(lesson.video_url || lesson.video_url_signed) && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Video</h2>
                <div className="aspect-w-16 aspect-h-9">
                  <video
                    controls
                    className="w-full rounded-lg"
                    src={lesson.video_url_signed || lesson.video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          )}

          {/* Transcript Section */}
          {lesson.transcript && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Transcript</h2>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-600">{lesson.transcript}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Summary Section */}
          {lesson.summary && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600">{lesson.summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Personal Notes Section */}
          {lesson.personal_notes && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Notes</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600">{lesson.personal_notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Section */}
          {lesson.quiz && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600">{lesson.quiz}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage; 