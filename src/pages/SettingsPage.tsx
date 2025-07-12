import React, { useState } from 'react';
import { 
  CogIcon, 
  TagIcon, 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import CategoryManager from '../components/CategoryManager';

type SettingsTab = 'general' | 'categories' | 'notifications' | 'security' | 'profile' | 'appearance';

interface TabItem {
  id: SettingsTab;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

const tabs: TabItem[] = [
  {
    id: 'general',
    name: 'General',
    icon: CogIcon,
    description: 'General application settings'
  },
  {
    id: 'categories',
    name: 'Categories',
    icon: TagIcon,
    description: 'Manage categories for organizing your data'
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: UserIcon,
    description: 'Your profile and account settings'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: BellIcon,
    description: 'Configure notification preferences'
  },
  {
    id: 'security',
    name: 'Security',
    icon: ShieldCheckIcon,
    description: 'Security and privacy settings'
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: Squares2X2Icon,
    description: 'Customize the look and feel'
  }
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'categories':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Category Management</h3>
              <p className="text-sm text-gray-600 mb-6">
                Manage your categories to organize tasks, projects, goals, and other items throughout the application.
              </p>
            </div>
            <CategoryManager />
          </div>
        );
      
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">General Settings</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure general application preferences and defaults.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center text-gray-500 py-8">
                <CogIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>General settings will be available soon.</p>
              </div>
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Settings</h3>
              <p className="text-sm text-gray-600 mb-6">
                Manage your profile information and account preferences.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center text-gray-500 py-8">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Profile settings will be available soon.</p>
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Settings</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure how and when you receive notifications.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center text-gray-500 py-8">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Notification settings will be available soon.</p>
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
              <p className="text-sm text-gray-600 mb-6">
                Manage your security preferences and privacy settings.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center text-gray-500 py-8">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Security settings will be available soon.</p>
              </div>
            </div>
          </div>
        );
      
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Appearance Settings</h3>
              <p className="text-sm text-gray-600 mb-6">
                Customize the look and feel of the application.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center text-gray-500 py-8">
                <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Appearance settings will be available soon.</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure your application preferences and manage your data.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            {/* Sidebar */}
            <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left group rounded-md px-3 py-2 flex items-center text-sm font-medium transition-colors duration-150 ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-600 border-primary-500'
                          : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'text-primary-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      <span className="truncate">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main content */}
            <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
              <div className="px-4 py-6 sm:px-0">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 