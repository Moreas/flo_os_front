import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { Lesson } from '../types/course';

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
    return <div className="p-4">Loading...</div>;
  }

  if (error || !lesson) {
    return <div className="p-4 text-red-600">{error || 'Lesson not found'}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-600">
            Created: {new Date(lesson.created_at).toLocaleDateString()}
          </span>
          <button
            onClick={handleMarkCompleted}
            className={`px-4 py-2 rounded ${
              lesson.is_completed
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
          >
            {lesson.is_completed ? 'Completed' : 'Mark as Complete'}
          </button>
        </div>
      </div>

      {/* Video Section */}
      {(lesson.video_url || lesson.video_url_signed) && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Video</h2>
          <div className="aspect-w-16 aspect-h-9">
            <video
              controls
              className="w-full rounded-lg shadow-lg"
              src={lesson.video_url_signed || lesson.video_url}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Transcript Section */}
      {lesson.transcript && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Transcript</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <pre className="whitespace-pre-wrap font-sans">{lesson.transcript}</pre>
          </div>
        </div>
      )}

      {/* Summary Section */}
      {lesson.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="whitespace-pre-wrap">{lesson.summary}</p>
          </div>
        </div>
      )}

      {/* Personal Notes Section */}
      {lesson.personal_notes && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Personal Notes</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="whitespace-pre-wrap">{lesson.personal_notes}</p>
          </div>
        </div>
      )}

      {/* Quiz Section */}
      {lesson.quiz && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quiz</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="whitespace-pre-wrap">{lesson.quiz}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonDetailPage; 