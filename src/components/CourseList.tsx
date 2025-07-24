import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { ArrowPathIcon, ExclamationTriangleIcon, AcademicCapIcon, PencilIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import CourseForm from '../components/forms/CourseForm';
import { Course } from '../types/course';

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(undefined);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load courses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (e: React.MouseEvent, course: Course) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCourse(course);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, courseId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await apiClient.delete(`/api/courses/${courseId}/`);
      
      if (response.status >= 200 && response.status < 300) {
        setCourses(courses.filter(course => course.id !== courseId));
      } else {
        const errorData = response.data;
        console.error('Delete failed:', errorData);
        alert('Failed to delete course: ' + (errorData?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.id}`}
            className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AcademicCapIcon className="h-6 w-6 text-primary-500" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{course.source}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                    {course.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <button
                    onClick={(e) => handleEdit(e, course)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <PencilIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, course.id)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <TrashIcon className="h-5 w-5 text-red-500" />
                  </button>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {course.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{course.description}</p>
              )}

              <div className="mt-4 space-y-2">
                {course.modules.map((module) => (
                  <div key={module.id} className="border rounded-md">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleModule(module.id);
                      }}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-700">{module.title}</span>
                      {expandedModules[module.id] ? (
                        <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedModules[module.id] && (
                      <div className="border-t p-2 space-y-1">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between text-sm text-gray-600 py-1 px-2 hover:bg-gray-50 rounded"
                          >
                            <span className="line-clamp-1">{lesson.title}</span>
                            {lesson.is_completed && (
                              <span className="text-xs text-green-600 font-medium">Completed</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-2 text-sm text-gray-500">
                {course.modules.length} module{course.modules.length !== 1 ? 's' : ''} •{' '}
                {course.modules.reduce((total, module) => total + module.lessons.length, 0)} lesson{course.modules.reduce((total, module) => total + module.lessons.length, 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <CourseForm 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourse(undefined);
        }} 
        onCourseCreated={fetchData}
        initialCourse={selectedCourse}
        isEditMode={!!selectedCourse}
      />
    </div>
  );
};

export default CourseList; 