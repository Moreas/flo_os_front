import React, { useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';
import { AxiosProgressEvent } from 'axios';

interface LessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLessonCreated: () => void;
  moduleId: number;
}

interface LessonFormData {
  title: string;
  video_url: string;
  video_file?: File;
  transcript: string;
  summary: string;
  personal_notes: string;
  quiz: string;
  order: number;
  is_completed: boolean;
}

const LessonForm: React.FC<LessonFormProps> = ({ isOpen, onClose, onLessonCreated, moduleId }) => {
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    video_url: '',
    transcript: '',
    summary: '',
    personal_notes: '',
    quiz: '',
    order: 1,
    is_completed: false,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10GB)
      if (file.size > 10 * 1024 * 1024 * 1024) {
        setError('Video file size must be less than 10GB');
        return;
      }

      // Check file type
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid video format. Supported formats are: MP4, MOV, AVI, WMV, FLV, WEBM');
        return;
      }

      setFormData(prev => ({ ...prev, video_file: file }));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('module_id', moduleId.toString());
      formDataToSend.append('title', formData.title);
      formDataToSend.append('transcript', formData.transcript);
      formDataToSend.append('summary', formData.summary);
      formDataToSend.append('personal_notes', formData.personal_notes);
      formDataToSend.append('quiz', formData.quiz);
      formDataToSend.append('order', formData.order.toString());
      formDataToSend.append('is_completed', formData.is_completed.toString());
      
      // If there's a video file, append it
      if (formData.video_file) {
        formDataToSend.append('video_file', formData.video_file);
      } else if (formData.video_url) {
        formDataToSend.append('video_url', formData.video_url);
      }

      // Send the request with upload progress tracking
      const response = await apiClient.post('/api/lessons/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
        // Increase timeout for large files
        timeout: 300000, // 5 minutes
      });

      console.log('Lesson created successfully:', response.data);
      onLessonCreated();
      onClose();
      setFormData({
        title: '',
        video_url: '',
        transcript: '',
        summary: '',
        personal_notes: '',
        quiz: '',
        order: 1,
        is_completed: false,
      });
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      setError(
        error.response?.data?.detail || 
        error.response?.data?.error || 
        error.message || 
        'Failed to create lesson'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
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
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                      Add New Lesson
                    </Dialog.Title>

                    {error && (
                      <div className="mt-2 rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <div className="mt-2 text-sm text-red-700">{error}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">
                          Video URL (optional if uploading file)
                        </label>
                        <input
                          type="url"
                          id="video_url"
                          value={formData.video_url}
                          onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="video_file" className="block text-sm font-medium text-gray-700">
                          Upload Video (optional)
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="file"
                            id="video_file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="video/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                            Choose Video File
                          </button>
                          {formData.video_file && (
                            <span className="ml-3 text-sm text-gray-500">
                              {formData.video_file.name}
                            </span>
                          )}
                        </div>
                        {isUploading && (
                          <div className="mt-2">
                            <div className="relative pt-1">
                              <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-200">
                                <div
                                  style={{ width: `${uploadProgress}%` }}
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-300"
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {uploadProgress}% uploaded
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="transcript" className="block text-sm font-medium text-gray-700">
                          Transcript
                        </label>
                        <textarea
                          id="transcript"
                          value={formData.transcript}
                          onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                          Summary
                        </label>
                        <textarea
                          id="summary"
                          value={formData.summary}
                          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="personal_notes" className="block text-sm font-medium text-gray-700">
                          Personal Notes
                        </label>
                        <textarea
                          id="personal_notes"
                          value={formData.personal_notes}
                          onChange={(e) => setFormData({ ...formData, personal_notes: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="quiz" className="block text-sm font-medium text-gray-700">
                          Quiz
                        </label>
                        <textarea
                          id="quiz"
                          value={formData.quiz}
                          onChange={(e) => setFormData({ ...formData, quiz: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                          Order
                        </label>
                        <input
                          type="number"
                          id="order"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          min="1"
                          required
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_completed"
                          checked={formData.is_completed}
                          onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="is_completed" className="ml-2 block text-sm text-gray-700">
                          Mark as completed
                        </label>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isUploading}
                          className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${
                            isUploading
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-primary-600 hover:bg-primary-500'
                          }`}
                        >
                          {isUploading ? 'Uploading...' : 'Add Lesson'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                          disabled={isUploading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LessonForm; 