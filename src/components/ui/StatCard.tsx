import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, link }) => {
  const isLoading = value === "Loading...";
  
  const cardContent = (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="mt-1 flex items-center">
              <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin mr-2" />
              <span className="text-lg font-semibold text-gray-400">Loading</span>
            </div>
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          )}
          {trend && !isLoading && (
            <p className={`mt-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-50 rounded-lg">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block hover:scale-105 transition-transform duration-200">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default StatCard; 