import React, { useState, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BookList from '../components/BookList';
import BookForm from '../components/forms/BookForm';

const BooksPage: React.FC = () => {
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookCreated = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Books</h1>
        <button
          onClick={() => setIsBookFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Book
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-4">
        <BookList key={refreshKey} />
      </div>

      <BookForm 
        isOpen={isBookFormOpen} 
        onClose={() => setIsBookFormOpen(false)} 
        onBookCreated={handleBookCreated}
      />
    </div>
  );
};

export default BooksPage; 