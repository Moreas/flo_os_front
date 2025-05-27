import React from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircleIcon, ClockIcon, FlagIcon, FolderIcon } from '@heroicons/react/24/outline';

interface RelatedItem {
  id: number;
  description?: string;
  title?: string;
  status?: string;
  due?: string | null;
  is_done?: boolean;
}

interface RelatedItemsListProps {
  items: RelatedItem[];
  type: 'tasks' | 'projects' | 'goals';
  onItemClick: (item: RelatedItem) => void;
  onTaskToggle?: (taskId: number, currentStatus: boolean) => void;
  isUpdatingTask?: number | null;
}

const RelatedItemsList: React.FC<RelatedItemsListProps> = ({
  items,
  type,
  onItemClick,
  onTaskToggle,
  isUpdatingTask
}) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return "Invalid Date";
    }
  };

  const getItemIcon = (item: RelatedItem) => {
    switch (type) {
      case 'tasks':
        return item.is_done ? (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        ) : (
          <ClockIcon className="w-5 h-5 text-gray-400" />
        );
      case 'projects':
        return <FolderIcon className="w-5 h-5 text-blue-500" />;
      case 'goals':
        return <FlagIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const handleTaskToggle = (e: React.MouseEvent, taskId: number, currentStatus: boolean) => {
    e.stopPropagation(); // Prevent the click from triggering the item click
    if (onTaskToggle) {
      onTaskToggle(taskId, currentStatus);
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No {type} found.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
        >
          <div className="flex-shrink-0 mt-0.5">
            {type === 'tasks' ? (
              <button
                onClick={(e) => handleTaskToggle(e, item.id, !!item.is_done)}
                disabled={isUpdatingTask === item.id}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isUpdatingTask === item.id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {getItemIcon(item)}
              </button>
            ) : (
              getItemIcon(item)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${
              item.is_done ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}>
              {item.description || item.title}
            </p>
            {item.due && (
              <p className="text-xs text-gray-500 mt-1">
                Due: {formatDate(item.due)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RelatedItemsList; 