import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiConfig';
import { Card } from '../components/ui/card';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  PencilIcon,
  XMarkIcon,
  PlayIcon,
  DocumentTextIcon,
  ClockIcon,
  BuildingOfficeIcon,
  FolderIcon,
  TagIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Person {
  id: number;
  name: string;
  relationship?: string;
}

interface Business {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface Project {
  id: number;
  name: string;
  status: string;
  business?: Business;
}

interface Category {
  id: number;
  name: string;
}

interface Meeting {
  id: number;
  title: string;
  datetime: string;
  duration_minutes?: number;
  attendees: Person[];
  business?: Business;
  project?: Project;
  tool?: any;
  category?: Category;
  location: string;
  notes: string;
  outcome: string;
  follow_up_required: boolean;
  transcript: string;
  summary: string;
  created_at: string;
}

interface Recording {
  id: number;
  video_id: string;
  blue_dot_meeting_id: string;
  title: string;
  event_type: string;
  summary?: string;
  summary_v2?: string;
  transcript?: string;
  duration?: number;
  attendees: string[];
  created_at: string;
  updated_at: string;
  processed_at?: string;
  meeting?: Meeting;
  has_summary: boolean;
  has_transcript: boolean;
  is_complete: boolean;
  transcript_text?: string;
}

const MeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'meetings' | 'recordings'>('meetings');
  const [editingItem, setEditingItem] = useState<{ type: 'meeting' | 'recording', id: number } | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meetingsRes, recordingsRes, businessesRes, projectsRes, categoriesRes] = await Promise.all([
        apiClient.get('/api/meetings/'),
        apiClient.get('/api/recordings/'),
        apiClient.get('/api/businesses/'),
        apiClient.get('/api/projects/'),
        apiClient.get('/api/categories/')
      ]);

      setMeetings(meetingsRes.data);
      setRecordings(recordingsRes.data);
      setBusinesses(businessesRes.data);
      setProjects(projectsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load meetings data');
    } finally {
      setLoading(false);
    }
  };

  const updateMeeting = async (meetingId: number, updates: Partial<Meeting>) => {
    try {
      const response = await apiClient.patch(`/api/meetings/${meetingId}/`, updates);
      setMeetings(prev => prev.map(m => m.id === meetingId ? response.data : m));
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating meeting:', err);
      setError('Failed to update meeting');
    }
  };

  const updateRecording = async (recordingId: number, updates: { meeting?: number }) => {
    try {
      const response = await apiClient.patch(`/api/recordings/${recordingId}/`, updates);
      setRecordings(prev => prev.map(r => r.id === recordingId ? response.data : r));
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating recording:', err);
      setError('Failed to update recording');
    }
  };

  const createMeetingFromRecording = async (recording: Recording) => {
    try {
      const meetingData = {
        title: recording.title || 'Blue Dot Meeting',
        datetime: recording.created_at,
        duration_minutes: recording.duration ? Math.round(recording.duration / 60) : null,
        notes: recording.summary || recording.summary_v2 || '',
        transcript: recording.transcript_text || '',
        summary: recording.summary_v2 || recording.summary || ''
      };

      const response = await apiClient.post('/api/meetings/', meetingData);
      const newMeeting = response.data;
      
      // Link the recording to the new meeting
      await updateRecording(recording.id, { meeting: newMeeting.id });
      
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error creating meeting from recording:', err);
      setError('Failed to create meeting from recording');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown duration';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const toggleExpanded = (itemType: string, itemId: number) => {
    const key = `${itemType}-${itemId}`;
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isExpanded = (itemType: string, itemId: number) => {
    return expandedItems.has(`${itemType}-${itemId}`);
  };

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecordings = recordings.filter(recording =>
    recording.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (recording.summary && recording.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white shadow-sm rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <UserGroupIcon className="w-8 h-8 mr-3 text-blue-600" />
          Meetings & Recordings
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your meetings, Blue Dot recordings, and assign them to projects and businesses.
        </p>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Tabs */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings and recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedTab('meetings')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTab === 'meetings'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Meetings ({filteredMeetings.length})
            </button>
            <button
              onClick={() => setSelectedTab('recordings')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTab === 'recordings'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Blue Dot Recordings ({filteredRecordings.length})
            </button>
          </div>
        </div>
      </div>

      {/* Meetings Tab */}
      {selectedTab === 'meetings' && (
        <div className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <div className="bg-white shadow-sm rounded-lg p-12 text-center">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No meetings found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first meeting or check Blue Dot recordings'}
              </p>
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white shadow-sm rounded-lg">
                <div className="p-6">
                  {/* Meeting Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                        {meeting.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {formatDate(meeting.datetime)}
                        </span>
                        {meeting.duration_minutes && (
                          <span>Duration: {formatDuration(meeting.duration_minutes)}</span>
                        )}
                        {meeting.location && (
                          <span>📍 {meeting.location}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingItem({ type: 'meeting', id: meeting.id })}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Assignments */}
                  {editingItem?.type === 'meeting' && editingItem.id === meeting.id ? (
                    <MeetingEditForm
                      meeting={meeting}
                      businesses={businesses}
                      projects={projects}
                      categories={categories}
                      onSave={(updates) => updateMeeting(meeting.id, updates)}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">Business:</span>{' '}
                          {meeting.business ? (
                            <span className="text-blue-600">{meeting.business.name}</span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FolderIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">Project:</span>{' '}
                          {meeting.project ? (
                            <span className="text-blue-600">{meeting.project.name}</span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <TagIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">Category:</span>{' '}
                          {meeting.category ? (
                            <span className="text-blue-600">{meeting.category.name}</span>
                          ) : (
                            <span className="text-gray-400">Not categorized</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Attendees */}
                  {meeting.attendees.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-700">Attendees:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {meeting.attendees.map((attendee) => (
                          <span
                            key={attendee.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {attendee.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expandable Content */}
                  {(meeting.notes || meeting.outcome || meeting.summary || meeting.transcript) && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleExpanded('meeting', meeting.id)}
                        className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {isExpanded('meeting', meeting.id) ? 'Hide Details' : 'Show Details'}
                        <span className="ml-1">{isExpanded('meeting', meeting.id) ? '▼' : '▶'}</span>
                      </button>

                      {isExpanded('meeting', meeting.id) && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          {meeting.notes && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{meeting.notes}</p>
                            </div>
                          )}
                          {meeting.outcome && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Outcome</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{meeting.outcome}</p>
                            </div>
                          )}
                          {meeting.summary && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{meeting.summary}</p>
                            </div>
                          )}
                          {meeting.transcript && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Transcript</h4>
                              <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{meeting.transcript}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {meeting.follow_up_required && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <ClockIcon className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">Follow-up required</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recordings Tab */}
      {selectedTab === 'recordings' && (
        <div className="space-y-4">
          {filteredRecordings.length === 0 ? (
            <div className="bg-white shadow-sm rounded-lg p-12 text-center">
              <PlayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No Blue Dot recordings found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery ? 'Try adjusting your search criteria' : 'Recordings will appear here automatically via webhook'}
              </p>
            </div>
          ) : (
            filteredRecordings.map((recording) => (
              <div key={recording.id} className="bg-white shadow-sm rounded-lg">
                <div className="p-6">
                  {/* Recording Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <PlayIcon className="w-5 h-5 mr-2 text-green-600" />
                        {recording.title || 'Blue Dot Recording'}
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Blue Dot
                        </span>
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {formatDate(recording.created_at)}
                        </span>
                        {recording.duration && (
                          <span>Duration: {formatDuration(Math.round(recording.duration / 60))}</span>
                        )}
                        <span className="flex items-center">
                          {recording.has_summary && <DocumentTextIcon className="w-4 h-4 mr-1 text-blue-500" />}
                          {recording.has_transcript && <DocumentTextIcon className="w-4 h-4 mr-1 text-green-500" />}
                          {recording.is_complete ? 'Complete' : 'Partial'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!recording.meeting && (
                        <button
                          onClick={() => createMeetingFromRecording(recording)}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                          Create Meeting
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meeting Link */}
                  {recording.meeting && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CalendarIcon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-800">
                            Linked to meeting: <span className="font-medium">{recording.meeting.title}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attendees */}
                  {recording.attendees.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-700">Attendees:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {recording.attendees.map((email, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expandable Content */}
                  {(recording.summary || recording.summary_v2 || recording.transcript_text) && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleExpanded('recording', recording.id)}
                        className="flex items-center text-sm font-medium text-green-600 hover:text-green-800"
                      >
                        {isExpanded('recording', recording.id) ? 'Hide Content' : 'Show Content'}
                        <span className="ml-1">{isExpanded('recording', recording.id) ? '▼' : '▶'}</span>
                      </button>

                      {isExpanded('recording', recording.id) && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          {recording.summary_v2 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Enhanced Summary</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{recording.summary_v2}</p>
                            </div>
                          )}
                          {recording.summary && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{recording.summary}</p>
                            </div>
                          )}
                          {recording.transcript_text && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Transcript</h4>
                              <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{recording.transcript_text}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Meeting Edit Form Component
interface MeetingEditFormProps {
  meeting: Meeting;
  businesses: Business[];
  projects: Project[];
  categories: Category[];
  onSave: (updates: Partial<Meeting>) => void;
  onCancel: () => void;
}

const MeetingEditForm: React.FC<MeetingEditFormProps> = ({
  meeting,
  businesses,
  projects,
  categories,
  onSave,
  onCancel
}) => {
  const [businessId, setBusinessId] = useState(meeting.business?.id?.toString() || '');
  const [projectId, setProjectId] = useState(meeting.project?.id?.toString() || '');
  const [categoryId, setCategoryId] = useState(meeting.category?.id?.toString() || '');

  const handleSave = () => {
    const updates: Partial<Meeting> = {
      business: businessId ? businesses.find(b => b.id === parseInt(businessId, 10)) : undefined,
      project: projectId ? projects.find(p => p.id === parseInt(projectId, 10)) : undefined,
      category: categoryId ? categories.find(c => c.id === parseInt(categoryId, 10)) : undefined,
    };
    onSave(updates);
  };

  const filteredProjects = businessId 
    ? projects.filter(p => p.business?.id === parseInt(businessId, 10))
    : projects;

  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
          <select
            value={businessId}
            onChange={(e) => {
              setBusinessId(e.target.value);
              // Reset project if business changes
              if (projectId && e.target.value) {
                const selectedProject = projects.find(p => p.id === parseInt(projectId, 10));
                if (selectedProject?.business?.id !== parseInt(e.target.value, 10)) {
                  setProjectId('');
                }
              }
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select business...</option>
            {businesses.filter(b => b.is_active).map(business => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select project...</option>
            {filteredProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {businessId && filteredProjects.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No projects found for selected business</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select category...</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default MeetingsPage; 