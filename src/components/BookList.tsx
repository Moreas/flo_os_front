import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiConfig';
import { ArrowPathIcon, ExclamationTriangleIcon, BookOpenIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon } from '@heroicons/react/24/outline';
import BookForm from './forms/BookForm';
import ChapterForm from './forms/ChapterForm';
import { Book, Chapter } from '../types/book';

const BookList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | undefined>(undefined);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | undefined>(undefined);
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set());

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/books/');
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load books data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (bookId: number) => {
    try {
      const response = await apiClient.delete(`/api/books/${bookId}/`);
      
      if (response.status >= 200 && response.status < 300) {
        setBooks(books.filter(book => book.id !== bookId));
      } else {
        const errorData = response.data;
        console.error('Delete failed:', errorData);
        alert('Failed to delete book: ' + (errorData?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book');
    }
  };

  const handleAddChapter = (book: Book) => {
    setSelectedBook(book);
    setSelectedChapter(undefined);
    setIsChapterModalOpen(true);
  };

  const handleEditChapter = (book: Book, chapter: Chapter) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setIsChapterModalOpen(true);
  };

  const handleDeleteChapter = async (chapterId: number) => {
    try {
      const response = await apiClient.delete(`/api/chapters/${chapterId}/`);
      
      if (response.status >= 200 && response.status < 300) {
        await fetchData(); // Refresh the book list to get updated chapters
      } else {
        const errorData = response.data;
        console.error('Delete failed:', errorData);
        alert('Failed to delete chapter: ' + (errorData?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Failed to delete chapter');
    }
  };

  const toggleBookExpansion = (bookId: number) => {
    const newExpandedBooks = new Set(expandedBooks);
    if (expandedBooks.has(bookId)) {
      newExpandedBooks.delete(bookId);
    } else {
      newExpandedBooks.add(bookId);
    }
    setExpandedBooks(newExpandedBooks);
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
      {books.map((book) => (
        <div key={book.id} className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpenIcon className="h-6 w-6 text-primary-500" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{book.title}</h3>
                  <p className="text-sm text-gray-500">{book.author}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                  {book.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <button
                  onClick={() => handleEdit(book)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <PencilIcon className="h-5 w-5 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <TrashIcon className="h-5 w-5 text-red-500" />
                </button>
                <button
                  onClick={() => toggleBookExpansion(book.id)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  {expandedBooks.has(book.id) ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {book.overall_summary && (
              <p className="mt-2 text-sm text-gray-600">{book.overall_summary}</p>
            )}

            {expandedBooks.has(book.id) && (
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900">Chapters</h4>
                  <button
                    onClick={() => handleAddChapter(book)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Chapter
                  </button>
                </div>

                <div className="space-y-2">
                  {book.chapters && book.chapters.length > 0 ? (
                    book.chapters.map((chapter) => (
                      <div key={chapter.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">
                              Chapter {chapter.chapter_number}: {chapter.title}
                            </h5>
                            {chapter.summary && (
                              <p className="mt-1 text-sm text-gray-600">{chapter.summary}</p>
                            )}
                            {chapter.personal_notes && (
                              <div className="mt-2">
                                <h6 className="text-xs font-medium text-gray-700">Personal Notes:</h6>
                                <p className="mt-1 text-sm text-gray-600">{chapter.personal_notes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditChapter(book, chapter)}
                              className="p-1 rounded-full hover:bg-gray-200"
                            >
                              <PencilIcon className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(chapter.id)}
                              className="p-1 rounded-full hover:bg-gray-200"
                            >
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No chapters added yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <BookForm 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBook(undefined);
        }} 
        onBookCreated={fetchData}
        initialBook={selectedBook}
        isEditMode={!!selectedBook}
      />

      <ChapterForm
        isOpen={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setSelectedBook(undefined);
          setSelectedChapter(undefined);
        }}
        onChapterCreated={fetchData}
        bookId={selectedBook?.id || 0}
        initialChapter={selectedChapter}
        isEditMode={!!selectedChapter}
      />
    </div>
  );
};

export default BookList; 