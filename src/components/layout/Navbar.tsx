import React, { Fragment, useState, useEffect } from 'react';
import { Menu, Transition, Popover } from '@headlessui/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  UserCircleIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  FlagIcon,
  FolderIcon,
  BellIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import TaskForm from '../forms/TaskForm';
import JournalForm from '../forms/JournalForm';
import GoalForm from '../forms/GoalForm';
import ProjectForm from '../forms/ProjectForm';
import { useAuth } from '../../contexts/AuthContext';
import { fetchWithCSRF } from '../../api/fetchWithCreds';
import API_BASE from '../../apiBase';

interface MenuItemProps {
  active: boolean;
}

interface NavbarProps {
  onOpenSidebar?: () => void;
}

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

const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isJournalFormOpen, setIsJournalFormOpen] = useState(false);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationGroup[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifTotalCount, setNotifTotalCount] = useState<number>(0);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    setNotifError(null);
    
    try {
      // Fetch all unhandled emails
      const emailsResponse = await fetchWithCSRF(`${API_BASE}/api/emails/?is_handled=false`);
      if (!emailsResponse.ok) throw new Error(`Failed to fetch emails: ${emailsResponse.status}`);
      const emailsResponseData = await emailsResponse.json();
      
      // Filter for internal handling only (frontend)
      const emailsRaw = Array.isArray(emailsResponseData) ? emailsResponseData : emailsResponseData.results || emailsResponseData.emails || [];
      const emails = emailsRaw.filter((email: any) => email.needs_internal_handling === true && email.waiting_external_handling === false);
      
      // Fetch tasks due today or before
      const today = new Date().toISOString().split('T')[0];
      const tasksResponse = await fetchWithCSRF(`${API_BASE}/api/tasks/?due_date_before=${today}`);
      if (!tasksResponse.ok) throw new Error(`Failed to fetch tasks: ${tasksResponse.status}`);
      const tasksResponseData = await tasksResponse.json();
      
      console.log('Emails response:', emailsResponseData);
      console.log('Tasks response:', tasksResponseData);
      
      // Process tasks
      const tasks = Array.isArray(tasksResponseData) ? tasksResponseData : 
                   tasksResponseData.results || tasksResponseData.tasks || [];
      
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
      setNotifTotalCount(totalCount);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifError('Failed to load notifications.');
      setNotifications([]);
      setNotifTotalCount(0);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    console.log('Search submitted:', trimmedQuery); // Debug log
    
    if (trimmedQuery) {
      const searchUrl = `/search?q=${encodeURIComponent(trimmedQuery)}`;
      console.log('Navigating to:', searchUrl); // Debug log
      navigate(searchUrl);
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between h-16 md:h-28 px-4 md:px-6 bg-white border-b border-gray-200">
        {/* Hamburger for mobile */}
        <button
          className="md:hidden p-2 mr-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg focus:outline-none"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-7 w-7" />
        </button>
        {/* Search Bar (hidden on mobile) */}
        <div className="flex-1 max-w-2xl mx-2 md:mx-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Search people, projects, businesses..."
            />
          </form>
        </div>
        {/* Topbar Icons Grouped Right */}
        <div className="flex items-center gap-x-2 md:gap-x-4 ml-auto">
          {/* Quick Actions */}
          <div className="flex items-center gap-x-1 md:gap-x-2" role="toolbar" aria-label="Quick actions">
            <button 
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg" 
              title="Log Journal"
              onClick={() => setIsJournalFormOpen(true)}
              aria-label="Log Journal"
            >
              <BookOpenIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <button 
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg" 
              title="Add Task"
              onClick={() => setIsTaskFormOpen(true)}
              aria-label="Add Task"
            >
              <ClipboardDocumentListIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <button 
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg" 
              title="New Goal"
              onClick={() => setIsGoalFormOpen(true)}
              aria-label="New Goal"
            >
              <FlagIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <button 
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg" 
              title="Add Project"
              onClick={() => setIsProjectFormOpen(true)}
              aria-label="Add Project"
            >
              <FolderIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          {/* Notification Bell */}
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`relative p-1.5 rounded-full ${open ? 'bg-gray-100' : ''} text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  title={`View notifications (${notifTotalCount})`}
                  aria-label={`View notifications (${notifTotalCount})`}
                  aria-expanded={open}
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {/* Badge */}
                  {notifTotalCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ring-2 ring-white" aria-label={`${notifTotalCount} unread notifications`}>
                      {notifTotalCount}
                    </span>
                  )}
                </Popover.Button>
                
                {/* Notification Panel */}
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="dialog" aria-label="Notifications panel">
                    <div className="px-4 py-3 border-b border-gray-200">
                       <p className="text-sm font-medium text-gray-900">Notifications</p>
                    </div>
                    <div className="py-1 max-h-80 overflow-y-auto" role="list">
                      {notifLoading ? (
                        <div className="flex items-center justify-center py-4 text-gray-400" role="status" aria-label="Loading notifications">
                          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                          Loading...
                        </div>
                      ) : notifError ? (
                        <div className="px-4 py-2 text-sm text-red-600" role="alert">{notifError}</div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500" role="status">No notifications.</div>
                      ) : (
                        notifications.map((group, idx) => (
                          <div key={group.type || idx} className="border-b border-gray-100 last:border-b-0 px-4 py-3" role="listitem">
                            <div className="flex items-center justify-between mb-1">
                              <Link to={groupLink(group.type)} className="font-semibold text-gray-900 text-sm hover:underline">
                                {group.title}
                              </Link>
                              {group.count > 0 && (
                                <span className={`ml-2 text-xs font-medium rounded-full px-2 py-0.5 ${group.priority === 'high' ? 'bg-red-100 text-red-700' : group.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`} aria-label={`${group.count} items`}>{group.count}</span>
                              )}
                            </div>
                            <ul className="space-y-1">
                              {Array.isArray(group.items) && group.items.map((item: any) => (
                                <li key={item.id} className="text-xs text-gray-700 flex flex-col">
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
                        ))
                      )}
                    </div>
                     <div className="px-4 py-2 border-t border-gray-200">
                       <Link to="/notifications" className="block text-center text-xs font-medium text-primary-600 hover:text-primary-800" aria-label="View all notifications">
                          View all notifications
                       </Link>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
          {/* User Profile */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
              <UserCircleIcon className="w-8 h-8 text-gray-400" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username || 'User'
                    }
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                
                <Menu.Item>
                  {({ active }: MenuItemProps) => (
                    <button
                      type="button"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      Your Profile
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: MenuItemProps) => (
                    <button
                      type="button"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      Settings
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: MenuItemProps) => (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700 w-full text-left flex items-center`}
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      <TaskForm 
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onTaskCreated={() => {}}
      />
      <JournalForm 
        isOpen={isJournalFormOpen}
        onClose={() => setIsJournalFormOpen(false)}
        onJournalEntryCreated={() => {}}
      />
      <GoalForm 
        isOpen={isGoalFormOpen}
        onClose={() => setIsGoalFormOpen(false)}
        onGoalCreated={() => {}}
      />
      <ProjectForm 
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
      />
    </>
  );
};

export default Navbar; 