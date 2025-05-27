import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE from '../apiBase';

const priorityClass = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const groupLink = (type: string) => {
  switch (type) {
    case 'email': return '/emails';
    case 'task': return '/tasks';
    case 'project': return '/projects';
    case 'goal': return '/goals';
    case 'journal': return '/journal';
    default: return '#';
  }
};

const itemLink = (type: string, item: any) => {
  switch (type) {
    case 'email': return '/emails'; // No detail page for individual emails in current UI
    case 'task': return `/tasks/${item.id}`;
    case 'project': return `/projects/${item.id}`;
    case 'goal': return `/goals/${item.id}`;
    case 'journal': return `/journal`; // No detail page for individual journal entries in current UI
    default: return '#';
  }
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get(`${API_BASE}/api/notifications/`)
      .then(res => {
        const data = res.data;
        if (!data || !Array.isArray(data.notifications)) {
          setNotifications([]);
          setTotalCount(0);
        } else {
          setNotifications(data.notifications);
          setTotalCount(data.total_count || data.notifications.reduce((sum: number, n: any) => sum + (n.count || 0), 0));
        }
      })
      .catch(() => {
        setError('Failed to load notifications.');
        setNotifications([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">All Notifications</h1>
      {loading ? (
        <div className="flex items-center text-gray-400"><svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Loading...</div>
      ) : error ? (
        <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-gray-500 bg-gray-50 border border-gray-200 rounded">No notifications.</div>
      ) : (
        <div className="space-y-6">
          {notifications.map((group, idx) => (
            <div key={group.type || idx} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Link to={groupLink(group.type)} className="font-semibold text-lg text-primary-700 hover:underline">
                  {group.title}
                </Link>
                {group.count > 0 && (
                  <span className={`ml-2 text-xs font-medium rounded-full px-2 py-0.5 ${priorityClass(group.priority)}`}>{group.count}</span>
                )}
              </div>
              <ul className="space-y-2 mt-2">
                {Array.isArray(group.items) && group.items.map((item: any) => (
                  <li key={item.id} className="text-sm text-gray-700 flex flex-col border-b last:border-b-0 border-gray-100 pb-2">
                    <Link to={itemLink(group.type, item)} className="hover:underline">
                      {group.type === 'email' && (
                        <span><span className="font-medium">{item.subject}</span> <span className="text-gray-500">from {item.sender_name}</span> <span className="text-gray-400">({new Date(item.received_at).toLocaleString()})</span></span>
                      )}
                      {group.type === 'task' && (
                        <span><span className="font-medium">{item.name}</span> <span className="text-gray-500">due {item.due_date}</span></span>
                      )}
                      {group.type === 'project' && (
                        <span><span className="font-medium">{item.name}</span> <span className="text-gray-500">({item.status})</span> <span className="text-gray-400">{item.pending_tasks} tasks</span></span>
                      )}
                      {group.type === 'goal' && (
                        <span><span className="font-medium">{item.name}</span> <span className="text-gray-500">target {item.target_date}</span></span>
                      )}
                      {group.type === 'journal' && (
                        <span><span className="font-medium">{item.emotion ? `(${item.emotion})` : ''}</span> {item.content} <span className="text-gray-400">{item.date}</span></span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8 text-sm text-gray-500">Total notifications: {totalCount}</div>
    </div>
  );
};

export default NotificationsPage; 