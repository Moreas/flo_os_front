import React from 'react';

const HealthPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Health & Fitness</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for health and fitness content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-gray-500">
            Health and fitness tracking features are under development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthPage; 