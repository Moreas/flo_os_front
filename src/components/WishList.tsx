import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  CurrencyDollarIcon,
  TagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../api/apiConfig';
import { WishListItem, WishListStats } from '../types/wishlist';
import WishListForm from './forms/WishListForm';

const WishList: React.FC = () => {
  const [items, setItems] = useState<WishListItem[]>([]);
  const [stats, setStats] = useState<WishListStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterPurchased, setFilterPurchased] = useState<string>('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchQuery) params.search = searchQuery;
      if (filterPriority) params.priority = filterPriority;
      if (filterPurchased !== '') params.is_purchased = filterPurchased;

      const response = await apiClient.get('/api/wishlist/', { params });
      setItems(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching wish list items:', err);
      setError('Failed to load wish list items');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterPriority, filterPurchased]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/wishlist/stats/');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching wish list stats:', err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, [searchQuery, filterPriority, filterPurchased, fetchItems]);

  const handleMarkPurchased = async (item: WishListItem) => {
    try {
      const endpoint = item.is_purchased ? 'mark_not_purchased' : 'mark_purchased';
      await apiClient.post(`/api/wishlist/${item.id}/${endpoint}/`);
      fetchItems();
      fetchStats();
    } catch (err) {
      console.error('Error updating purchase status:', err);
    }
  };

  const handleEditItem = (item: WishListItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteItem = async (item: WishListItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        await apiClient.delete(`/api/wishlist/${item.id}/`);
        fetchItems();
        fetchStats();
      } catch (err) {
        console.error('Error deleting wish list item:', err);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleItemCreated = () => {
    fetchItems();
    fetchStats();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wish List</h1>
          <p className="text-gray-600">Things you'd like to purchase</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TagIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_items}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Purchased</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.purchased_items}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.total_cost)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Value</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.pending_cost)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={filterPurchased}
              onChange={(e) => setFilterPurchased(e.target.value)}
            >
              <option value="">All Items</option>
              <option value="false">Not Purchased</option>
              <option value="true">Purchased</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No wish list items</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first item.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className={`p-6 ${item.is_purchased ? 'bg-gray-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className={`text-lg font-medium ${item.is_purchased ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      {item.is_purchased && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-800 bg-green-100">
                          Purchased
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{formatCurrency(item.cost)}</span>
                      {item.category && (
                        <span className="flex items-center">
                          <TagIcon className="h-4 w-4 mr-1" />
                          {item.category.name}
                        </span>
                      )}
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {item.comment && (
                      <p className="mt-2 text-sm text-gray-600">{item.comment}</p>
                    )}

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                        View Product
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleMarkPurchased(item)}
                      className={`p-2 rounded-full ${
                        item.is_purchased
                          ? 'text-yellow-600 hover:text-yellow-500 hover:bg-yellow-50'
                          : 'text-green-600 hover:text-green-500 hover:bg-green-50'
                      }`}
                      title={item.is_purchased ? 'Mark as not purchased' : 'Mark as purchased'}
                    >
                      {item.is_purchased ? <XMarkIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
                    </button>

                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-full"
                      title="Edit item"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                      title="Delete item"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form Modal */}
      <WishListForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onItemCreated={handleItemCreated}
        initialItem={editingItem}
        isEditMode={!!editingItem}
      />
    </div>
  );
};

export default WishList; 