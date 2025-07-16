import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  TagIcon, 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon,
  Squares2X2Icon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import CategoryManager from '../components/CategoryManager';
import { emailConfigAPI, EmailConfig, EmailConfigUpdate } from '../api/emailConfig';

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  
  // Email configuration state
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState('');
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  
  // Email form data
  const [emailFormData, setEmailFormData] = useState({
    email_host: 'smtp.gmail.com',
    email_port: 587,
    email_use_tls: true,
    email_host_user: 'florent.pignaud.email@gmail.com',
    email_host_password: '',
  });

  // Load email configuration when general tab is selected
  useEffect(() => {
    if (activeTab === 'general') {
      loadEmailConfig();
    }
  }, [activeTab]);

  const loadEmailConfig = async () => {
    try {
      setEmailLoading(true);
      const configData = await emailConfigAPI.getConfig();
      setEmailConfig(configData);
      setEmailFormData({
        email_host: configData.email_host,
        email_port: configData.email_port,
        email_use_tls: configData.email_use_tls,
        email_host_user: configData.email_host_user,
        email_host_password: '', // Never load the actual password
      });
    } catch (error) {
      console.error('Failed to load email config:', error);
      setEmailErrorMessage('Failed to load email configuration');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEmailFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  const handleEmailSave = async () => {
    try {
      setEmailSaving(true);
      setEmailErrorMessage('');
      setEmailSuccessMessage('');

      const updateData: EmailConfigUpdate = {};
      
      // Only include fields that have changed or password if provided
      if (emailFormData.email_host !== emailConfig?.email_host) {
        updateData.email_host = emailFormData.email_host;
      }
      if (emailFormData.email_port !== emailConfig?.email_port) {
        updateData.email_port = emailFormData.email_port;
      }
      if (emailFormData.email_use_tls !== emailConfig?.email_use_tls) {
        updateData.email_use_tls = emailFormData.email_use_tls;
      }
      if (emailFormData.email_host_user !== emailConfig?.email_host_user) {
        updateData.email_host_user = emailFormData.email_host_user;
      }
      if (emailFormData.email_host_password) {
        updateData.email_host_password = emailFormData.email_host_password;
      }

      if (Object.keys(updateData).length === 0) {
        setEmailErrorMessage('No changes to save');
        return;
      }

      const response = await emailConfigAPI.updateConfig(updateData);
      setEmailSuccessMessage(response.message);
      
      // Reload config to get updated state
      await loadEmailConfig();
      
      // Clear password field after successful update
      setEmailFormData(prev => ({ ...prev, email_host_password: '' }));
      
    } catch (error: any) {
      console.error('Failed to save email config:', error);
      setEmailErrorMessage(error.response?.data?.message || 'Failed to save email configuration');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleEmailTest = async () => {
    try {
      setEmailTesting(true);
      setEmailErrorMessage('');
      setEmailSuccessMessage('');

      const response = await emailConfigAPI.testConfig();
      setEmailSuccessMessage(response.message);
      
    } catch (error: any) {
      console.error('Failed to test email config:', error);
      setEmailErrorMessage(error.response?.data?.message || 'Failed to test email configuration');
    } finally {
      setEmailTesting(false);
    }
  };

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
                Configure general application preferences and email settings.
              </p>
            </div>
            
            {/* Email Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <EnvelopeIcon className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Email Configuration</h4>
                  <p className="text-sm text-gray-600">Configure SMTP settings for sending emails</p>
                </div>
              </div>

              {emailLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Success/Error Messages */}
                  {emailSuccessMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-700">{emailSuccessMessage}</span>
                    </div>
                  )}
                  
                  {emailErrorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm text-red-700">{emailErrorMessage}</span>
                    </div>
                  )}

                  {/* Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email Host */}
                      <div>
                        <label htmlFor="email_host" className="block text-sm font-medium text-gray-700 mb-1">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          id="email_host"
                          name="email_host"
                          value={emailFormData.email_host}
                          onChange={handleEmailInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      {/* Email Port */}
                      <div>
                        <label htmlFor="email_port" className="block text-sm font-medium text-gray-700 mb-1">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          id="email_port"
                          name="email_port"
                          value={emailFormData.email_port}
                          onChange={handleEmailInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="587"
                        />
                      </div>
                    </div>

                    {/* Email User */}
                    <div>
                      <label htmlFor="email_host_user" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email_host_user"
                        name="email_host_user"
                        value={emailFormData.email_host_user}
                        onChange={handleEmailInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your-email@gmail.com"
                      />
                    </div>

                    {/* Email Password */}
                    <div>
                      <label htmlFor="email_host_password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password / App Password
                        {emailConfig?.email_host_password_set && (
                          <span className="ml-2 text-xs text-green-600">(Currently set)</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="email_host_password"
                          name="email_host_password"
                          value={emailFormData.email_host_password}
                          onChange={handleEmailInputChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={emailConfig?.email_host_password_set ? "Enter new password to change" : "Enter your email password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        For Gmail, use an App Password instead of your regular password
                      </p>
                    </div>

                    {/* TLS Checkbox */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="email_use_tls"
                        name="email_use_tls"
                        checked={emailFormData.email_use_tls}
                        onChange={handleEmailInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="email_use_tls" className="ml-2 block text-sm text-gray-700">
                        Use TLS encryption (recommended)
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleEmailSave}
                        disabled={emailSaving}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          emailSaving
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        }`}
                      >
                        {emailSaving ? 'Saving...' : 'Save Configuration'}
                      </button>

                      <button
                        onClick={handleEmailTest}
                        disabled={emailTesting || !emailConfig?.email_host_password_set}
                        className={`px-4 py-2 rounded-md text-sm font-medium border ${
                          emailTesting || !emailConfig?.email_host_password_set
                            ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        }`}
                      >
                        {emailTesting ? 'Testing...' : 'Test Email'}
                      </button>
                    </div>

                    {!emailConfig?.email_host_password_set && (
                      <p className="text-xs text-amber-600">
                        ⚠️ Please save your email password before testing
                      </p>
                    )}
                  </div>
                </>
              )}
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