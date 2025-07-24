import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { ArrowPathIcon, ExclamationTriangleIcon, BookOpenIcon, PencilIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import BookForm from './forms/BookForm';
import { Book } from '../types/book';

const BookList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | undefined>(undefined);

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

  const handleEdit = (e: React.MouseEvent, book: Book) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedBook(book);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, bookId: number) => {
    e.preventDefault();
    e.stopPropagation();
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
        <Link
          key={book.id}
          to={`/books/${book.id}`}
          className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
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
                  onClick={(e) => handleEdit(e, book)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <PencilIcon className="h-5 w-5 text-gray-500" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, book.id)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <TrashIcon className="h-5 w-5 text-red-500" />
                </button>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {book.overall_summary && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{book.overall_summary}</p>
            )}

            {book.chapters && book.chapters.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                {book.chapters.length} chapter{book.chapters.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </Link>
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
    </div>
  );
};

export default BookList; 