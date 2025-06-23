import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE from '../apiBase';

interface NotificationItem {
  id: number;
  name?: string;
  description?: string;
  subject?: string;
  sender_name?: string;
  received_at?: string;
  due_date?: string;
  is_handled?: boolean;
  needs_internal_handling?: boolean;
  waiting_external_handling?: boolean;
}

interface NotificationGroup {
  type: string;
  title: string;
  count: number;
  priority: string;
  items: NotificationItem[];
}

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
    default: return '#';
  }
};

const itemLink = (type: string, item: any) => {
  switch (type) {
    case 'email': return '/emails';
    case 'task': return `/tasks/${item.id}`;
    default: return '#';
  }
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all unhandled emails
      const emailsResponse = await axios.get(`${API_BASE}/api/emails/`, {
        params: {
          is_handled: false
        }
      });
      // Filter for internal handling only (frontend)
      const emailsRaw = Array.isArray(emailsResponse.data) ? emailsResponse.data : emailsResponse.data.results || emailsResponse.data.emails || [];
      const emails = emailsRaw.filter((email: any) => email.needs_internal_handling === true && email.waiting_external_handling === false);
      
      // Fetch tasks due today or before
      const today = new Date().toISOString().split('T')[0];
      const tasksResponse = await axios.get(`${API_BASE}/api/tasks/`, {
        params: {
          due_date_before: today
        }
      });
      
      console.log('Emails response:', emailsResponse.data);
      console.log('Tasks response:', tasksResponse.data);
      
      // Process tasks
      const tasks = Array.isArray(tasksResponse.data) ? tasksResponse.data : 
                   tasksResponse.data.results || tasksResponse.data.tasks || [];
      
      // Filter tasks to only include those due today or before
      const filteredTasks = tasks.filter((task: any) => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        const todayDate = new Date();
        todayDate.setHours(23, 59, 59, 999); // End of today
        return taskDate <= todayDate;
      });
      
      console.log('Filtered emails (unhandled internal):', emails);
      console.log('Filtered tasks (due today or before):', filteredTasks);
      
      // Create notification groups
      const notificationGroups: NotificationGroup[] = [];
      
      if (emails.length > 0) {
        notificationGroups.push({
          type: 'email',
          title: 'Unhandled Internal Emails',
          count: emails.length,
          priority: emails.length > 5 ? 'high' : 'medium',
          items: emails.map((email: any) => ({
            id: email.id,
            subject: email.subject,
            sender_name: email.sender_name,
            received_at: email.received_at
          }))
        });
      }
      
      if (filteredTasks.length > 0) {
        notificationGroups.push({
          type: 'task',
          title: 'Tasks Due Today or Before',
          count: filteredTasks.length,
          priority: filteredTasks.length > 10 ? 'high' : 'medium',
          items: filteredTasks.map((task: any) => ({
            id: task.id,
            name: task.name,
            description: task.description,
            due_date: task.due_date
          }))
        });
      }
      
      const totalCount = notificationGroups.reduce((sum, group) => sum + group.count, 0);
      
      console.log('Notification groups:', notificationGroups);
      console.log('Total count:', totalCount);
      
      setNotifications(notificationGroups);
      setTotalCount(totalCount);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications.');
      setNotifications([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
                        <span><span className="font-medium">{item.name}</span> <span className="text-gray-500">{item.description || 'No description'}</span></span>
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