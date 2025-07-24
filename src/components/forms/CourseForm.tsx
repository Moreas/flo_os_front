import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';
import { Course } from '../../types/course';

interface CourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: () => void;
  initialCourse?: Course;
  isEditMode?: boolean;
}

interface ModuleFormData {
  id?: number;
  title: string;
  description: string;
  order: number;
  lessons: LessonFormData[];
}

interface LessonFormData {
  id?: number;
  title: string;
  video_url: string;
  transcript: string;
  summary: string;
  personal_notes: string;
  quiz: string;
  order: number;
}

const CourseForm: React.FC<CourseFormProps> = ({
  isOpen,
  onClose,
  onCourseCreated,
  initialCourse,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState<Partial<Course>>({
    title: '',
    source: '',
    description: '',
    status: 'in_progress',
  });
  const [modules, setModules] = useState<ModuleFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialCourse) {
      setFormData({
        title: initialCourse.title,
        source: initialCourse.source,
        description: initialCourse.description || '',
        status: initialCourse.status,
        started_at: initialCourse.started_at,
        completed_at: initialCourse.completed_at,
        category: initialCourse.category,
        business: initialCourse.business,
      });
      setModules(initialCourse.modules.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description || '',
        order: module.order,
        lessons: module.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          video_url: lesson.video_url || '',
          transcript: lesson.transcript || '',
          summary: lesson.summary || '',
          personal_notes: lesson.personal_notes || '',
          quiz: lesson.quiz || '',
          order: lesson.order,
        })),
      })));
    } else {
      setFormData({
        title: '',
        source: '',
        description: '',
        status: 'in_progress',
      });
      setModules([]);
    }
  }, [initialCourse]);

  const handleAddModule = () => {
    setModules([
      ...modules,
      {
        title: '',
        description: '',
        order: modules.length + 1,
        lessons: [],
      },
    ]);
  };

  const handleRemoveModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const handleModuleChange = (index: number, field: keyof ModuleFormData, value: string | number) => {
    const newModules = [...modules];
    newModules[index] = {
      ...newModules[index],
      [field]: value,
    };
    setModules(newModules);
  };

  const handleAddLesson = (moduleIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons.push({
      title: '',
      video_url: '',
      transcript: '',
      summary: '',
      personal_notes: '',
      quiz: '',
      order: newModules[moduleIndex].lessons.length + 1,
    });
    setModules(newModules);
  };

  const handleRemoveLesson = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setModules(newModules);
  };

  const handleLessonChange = (moduleIndex: number, lessonIndex: number, field: keyof LessonFormData, value: string | number) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons[lessonIndex] = {
      ...newModules[moduleIndex].lessons[lessonIndex],
      [field]: value,
    };
    setModules(newModules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const courseData = {
        ...formData,
        modules: modules.map(module => ({
          ...module,
          lessons: module.lessons,
        })),
      };

      if (isEditMode && initialCourse) {
        await apiClient.put(`/api/courses/${initialCourse.id}/`, courseData);
      } else {
        await apiClient.post('/api/courses/', courseData);
      }
      setSuccess(true);
      onCourseCreated();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 500);
    } catch (error) {
      console.error('Error saving course:', error);
      setError('Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {isEditMode ? 'Edit Course' : 'New Course'}
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Course Details */}
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                              Title
                            </label>
                            <input
                              type="text"
                              name="title"
                              id="title"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                              Source
                            </label>
                            <input
                              type="text"
                              name="source"
                              id="source"
                              value={formData.source}
                              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <textarea
                              name="description"
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                              Status
                            </label>
                            <select
                              name="status"
                              id="status"
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value as Course['status'] })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            >
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="paused">Paused</option>
                            </select>
                          </div>
                        </div>

                        {/* Modules */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-medium text-gray-900">Modules</h4>
                            <button
                              type="button"
                              onClick={handleAddModule}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                              Add Module
                            </button>
                          </div>

                          {modules.map((module, moduleIndex) => (
                            <div key={moduleIndex} className="border rounded-lg p-4 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Module Title
                                    </label>
                                    <input
                                      type="text"
                                      value={module.title}
                                      onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                      required
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Module Description
                                    </label>
                                    <textarea
                                      value={module.description}
                                      onChange={(e) => handleModuleChange(moduleIndex, 'description', e.target.value)}
                                      rows={2}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveModule(moduleIndex)}
                                  className="ml-4 p-1 text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>

                              {/* Lessons */}
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-md font-medium text-gray-900">Lessons</h5>
                                  <button
                                    type="button"
                                    onClick={() => handleAddLesson(moduleIndex)}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                  >
                                    <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
                                    Add Lesson
                                  </button>
                                </div>

                                {module.lessons.map((lesson, lessonIndex) => (
                                  <div key={lessonIndex} className="border rounded p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1 space-y-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">
                                            Lesson Title
                                          </label>
                                          <input
                                            type="text"
                                            value={lesson.title}
                                            onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'title', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                            required
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">
                                            Video URL
                                          </label>
                                          <input
                                            type="url"
                                            value={lesson.video_url}
                                            onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'video_url', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">
                                            Summary
                                          </label>
                                          <textarea
                                            value={lesson.summary}
                                            onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'summary', e.target.value)}
                                            rows={2}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">
                                            Personal Notes
                                          </label>
                                          <textarea
                                            value={lesson.personal_notes}
                                            onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'personal_notes', e.target.value)}
                                            rows={2}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">
                                            Transcript
                                          </label>
                                          <textarea
                                            value={lesson.transcript}
                                            onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'transcript', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">
                                            Quiz
                                          </label>
                                          <textarea
                                            value={lesson.quiz}
                                            onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'quiz', e.target.value)}
                                            rows={2}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                          />
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveLesson(moduleIndex, lessonIndex)}
                                        className="ml-4 p-1 text-red-600 hover:text-red-800"
                                      >
                                        <TrashIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {error && (
                          <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                              </div>
                            </div>
                          </div>
                        )}

                        {success && (
                          <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Course saved successfully!</h3>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            {loading ? (
                              <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            ) : (
                              isEditMode ? 'Save Changes' : 'Create Course'
                            )}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CourseForm; 