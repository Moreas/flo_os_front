import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, BookOpenIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import API_BASE from '../apiBase';
import BookForm from './forms/BookForm';
import { Book, Chapter } from '../types/book';

const BookList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [booksRes, chaptersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/books/`),
        axios.get(`${API_BASE}/api/chapters/`)
      ]);
      setBooks(booksRes.data || []);
      setChapters(chaptersRes.data || []);
    } catch (err: unknown) {
      console.error("Error fetching books:", err);
      setError("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (bookId: number) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    
    try {
      await axios.delete(`${API_BASE}/api/books/${bookId}/`);
      setBooks(books.filter(book => book.id !== bookId));
    } catch (err: unknown) {
      console.error("Error deleting book:", err);
      setDeleteError("Failed to delete book. Please try again.");
      setTimeout(() => setDeleteError(null), 3000);
    }
  };

  const handleBookUpdated = () => {
    fetchBooks();
    setIsEditModalOpen(false);
    setSelectedBook(null);
  };

  const getBookChapters = (bookId: number) => {
    return chapters.filter(chapter => chapter.book_id === bookId);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {deleteError && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {deleteError}
        </div>
      )}

      {books.length === 0 && !error && !loading && (
        <p className="text-center text-gray-500 py-4">No books found.</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => {
          const bookChapters = getBookChapters(book.id);
          const completedChapters = bookChapters.filter(ch => ch.is_completed).length;
          
          return (
            <div 
              key={book.id} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-50 rounded-full">
                    <BookOpenIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{book.title}</h3>
                    {book.author && (
                      <p className="mt-1 text-sm text-gray-600">by {book.author}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(book)}
                    className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                    title="Edit book"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                    title="Delete book"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {book.description && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{book.description}</p>
                </div>
              )}
              
              <div className="mt-4 space-y-2">
                {book.status && (
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                    {book.status.replace('_', ' ').charAt(0).toUpperCase() + book.status.slice(1).replace('_', ' ')}
                  </span>
                )}
                
                {bookChapters.length > 0 && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Progress: {completedChapters}/{bookChapters.length} chapters</span>
                    {book.rating && (
                      <span className="ml-4">Rating: {book.rating}/5</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedBook && (
        <BookForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBook(null);
          }}
          onBookCreated={handleBookUpdated}
          initialBook={selectedBook}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default BookList; 