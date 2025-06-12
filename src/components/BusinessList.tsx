import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import API_BASE from '../apiBase';

// Interface for Business data
interface Business {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

// Fallback data for development
const fallbackBusinesses: Business[] = [
    { id: 1, name: "Acme Corporation", description: "Leading provider of innovative solutions." },
    { id: 2, name: "Globex Inc.", description: "Pioneering advancements in technology." },
];

const BusinessList: React.FC = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE}/api/businesses/`);
        setBusinesses(response.data || []);
      } catch (err) {
        console.error("Error fetching businesses:", err);
        setError("Failed to load businesses. Displaying sample data.");
        setBusinesses(fallbackBusinesses);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

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

      {businesses.length === 0 && !error && !loading && (
         <p className="text-center text-gray-500 py-4">No businesses found.</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => (
          <div 
            key={business.id} 
            onClick={() => navigate(`/businesses/${business.id}`)}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer"
          >
            <div className="flex items-start space-x-3">
               <div className="p-2 bg-primary-50 rounded-full">
                 <BuildingOffice2Icon className="w-5 h-5 text-primary-600" />
               </div>
               <div className="flex-1">
                   <h3 className="text-base font-semibold text-gray-900">{business.name}</h3>
                   {business.description && (
                     <p className="mt-1 text-sm text-gray-500 line-clamp-2">{business.description}</p>
                   )}
                   {business.is_active !== undefined && (
                     <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                       business.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                     }`}>
                       {business.is_active ? 'Active' : 'Inactive'}
                     </span>
                   )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessList; 