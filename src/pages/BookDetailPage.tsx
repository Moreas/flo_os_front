import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { Book, Chapter } from '../types/book';
import { ArrowPathIcon, ExclamationTriangleIcon, PencilIcon, TrashIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import BookForm from '../components/forms/BookForm';
import ChapterForm from '../components/forms/ChapterForm';

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | undefined>(undefined);

  const fetchBook = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/books/${id}/`);
      setBook(response.data);
    } catch (error) {
      console.error('Error fetching book:', error);
      setError('Failed to load book details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBook();
  }, [id, fetchBook]);

  const handleEditBook = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteBook = async () => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/books/${id}/`);
      navigate('/books');
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book');
    }
  };

  const handleAddChapter = () => {
    setSelectedChapter(undefined);
    setIsChapterModalOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setIsChapterModalOpen(true);
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!window.confirm('Are you sure you want to delete this chapter?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/chapters/${chapterId}/`);
      fetchBook();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Failed to delete chapter');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read_and_digested':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-emerald-100 text-emerald-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
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

  if (error || !book) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error || 'Book not found'}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/books')}
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Books
      </button>

      {/* Book header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
              <p className="mt-1 text-lg text-gray-600">{book.author}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(book.status)}`}>
                {book.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <button
                onClick={handleEditBook}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <PencilIcon className="h-5 w-5 text-gray-500" />
              </button>
              <button
                onClick={handleDeleteBook}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <TrashIcon className="h-5 w-5 text-red-500" />
              </button>
            </div>
          </div>

          {book.overall_summary && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-900">Overall Summary</h2>
              <p className="mt-2 text-gray-600">{book.overall_summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chapters section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Chapters</h2>
          <button
            onClick={handleAddChapter}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Chapter
          </button>
        </div>

        <div className="space-y-4">
          {book.chapters && book.chapters.length > 0 ? (
            book.chapters.map((chapter) => (
              <div key={chapter.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Chapter {chapter.chapter_number}: {chapter.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditChapter(chapter)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <PencilIcon className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {chapter.summary && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Summary</h4>
                      <p className="mt-1 text-sm text-gray-600">{chapter.summary}</p>
                    </div>
                  )}

                  {chapter.personal_notes && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Personal Notes</h4>
                      <p className="mt-1 text-sm text-gray-600">{chapter.personal_notes}</p>
                    </div>
                  )}

                  {chapter.is_completed && (
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-sm text-gray-500">No chapters added yet.</p>
              <button
                onClick={handleAddChapter}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Chapter
              </button>
            </div>
          )}
        </div>
      </div>

      <BookForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onBookCreated={fetchBook}
        initialBook={book}
        isEditMode={true}
      />

      <ChapterForm
        isOpen={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setSelectedChapter(undefined);
        }}
        onChapterCreated={fetchBook}
        bookId={book.id}
        initialChapter={selectedChapter}
        isEditMode={!!selectedChapter}
      />
    </div>
  );
};

export default BookDetailPage; 