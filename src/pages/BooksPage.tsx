import React from 'react';
import BookList from '../components/BookList';

const BooksPage: React.FC = () => {
  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Books
          </h2>
        </div>
      </div>
      <BookList />
    </div>
  );
};

export default BooksPage; 