import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import BookForm from '../components/forms/BookForm';
import { apiClient } from '../api/apiConfig';
import { Book } from '../types/book';
import { Category } from '../types/category';

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'read' | 'read_and_digested';

const BooksPage: React.FC = () => {
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Filter states
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      const [booksRes, categoriesRes] = await Promise.all([
        apiClient.get('/api/books/'),
        apiClient.get('/api/categories/')
      ]);
      
      setBooks(booksRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleBookCreated = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Filtered books based on search and filters
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(query) ||
        (book.author && book.author.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(book => book.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      // Note: This assumes books have a category field - you might need to adjust based on your Book model
      // filtered = filtered.filter(book => book.category?.id === parseInt(categoryFilter));
    }

    return filtered;
  }, [books, searchQuery, statusFilter, categoryFilter]);

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'read': return 'Read';
      case 'read_and_digested': return 'Read and Digested';
      default: return status;
    }
  };

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

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search books by title or author..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="read">Read</option>
              <option value="read_and_digested">Read and Digested</option>
            </select>
          </div>

          {/* Category Filter - Placeholder for future use */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              disabled
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredBooks.length} of {books.length} books
          {statusFilter !== 'all' && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getStatusDisplayName(statusFilter)}
            </span>
          )}
        </div>
      </div>

      {/* Books List */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <FilteredBookList books={filteredBooks} onBookUpdated={handleBookCreated} />
      </div>

      <BookForm 
        isOpen={isBookFormOpen} 
        onClose={() => setIsBookFormOpen(false)} 
        onBookCreated={handleBookCreated}
      />
    </div>
  );
};

// Filtered BookList component that receives filtered books as props
const FilteredBookList: React.FC<{ books: Book[], onBookUpdated: () => void }> = ({ books, onBookUpdated }) => {
  const [chapters, setChapters] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await apiClient.get('/api/chapters/');
        setChapters(response.data);
      } catch (error) {
        console.error('Error fetching chapters:', error);
      }
    };
    fetchChapters();
  }, []);

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (bookId: number) => {
    try {
      await apiClient.delete(`/api/books/${bookId}/`);
      onBookUpdated();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book');
    }
  };

  const handleBookUpdated = () => {
    onBookUpdated();
    setIsEditModalOpen(false);
    setSelectedBook(null);
  };

  const getBookChapters = (bookId: number) => {
    return chapters.filter(chapter => chapter.book_id === bookId);
  };

  const getStatusColor = (status?: string) => {
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

  if (books.length === 0) {
    return <p className="text-center text-gray-500 py-8">No books found matching your filters.</p>;
  }

  return (
    <>
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
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                    title="Delete book"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
                    {book.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
    </>
  );
};

export default BooksPage; 