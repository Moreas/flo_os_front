import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  BookOpenIcon, 
  FolderIcon, 
  FlagIcon, 
  ClipboardDocumentListIcon, 
  UsersIcon,
  WrenchScrewdriverIcon, 
  AcademicCapIcon, 
  BriefcaseIcon,
  InboxIcon,
  HeartIcon,
  BanknotesIcon,
  PhoneIcon,
  XMarkIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Inbox', href: '/emails', icon: InboxIcon },
  { name: 'Journal', href: '/journal', icon: BookOpenIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Goals', href: '/goals', icon: FlagIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Businesses', href: '/businesses', icon: BriefcaseIcon },
  { name: 'People', href: '/people', icon: UsersIcon },
  { name: 'Meetings', href: '/meetings', icon: PhoneIcon },
  { name: 'Tools', href: '/tools', icon: WrenchScrewdriverIcon },
  { name: 'Learning', href: '/learning', icon: AcademicCapIcon },
  { name: 'Health - Fitness', href: '/health', icon: HeartIcon },
  { name: 'Finance', href: '/finance', icon: BanknotesIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col h-full bg-white w-64 border-r border-gray-200">
      <div className="relative h-28 flex-shrink-0 flex items-center justify-center border-b border-gray-200 py-4">
        <img src="/os.png" alt="FloOS Logo" className="h-20" />
        {onClose && (
          <button
            className="absolute top-4 right-4 md:hidden p-2 rounded-full hover:bg-gray-100 focus:outline-none"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
            onClick={onClose ? () => onClose() : undefined}
          >
            <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;