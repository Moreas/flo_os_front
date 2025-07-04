import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { apiClient } from '../api/apiConfig';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-overrides.css';
import { FaUsers, FaCircle } from 'react-icons/fa';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  category?: number;
  business?: number;
  is_meeting?: boolean;
  participants?: number[];
}

const categoryColors: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-green-400',
  3: 'text-yellow-400',
  4: 'text-pink-400',
  5: 'text-purple-400',
  // Add more as needed
};

const MeetingIcon = (props: any) => React.createElement(FaUsers as React.ElementType, props);
const CategoryIcon = (props: any) => React.createElement(FaCircle as React.ElementType, props);

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<View>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterBusiness, setFilterBusiness] = useState<string>('');
  const [filterMeeting, setFilterMeeting] = useState<string>('all');
  const [people, setPeople] = useState<any[]>([]);
  const [date, setDate] = useState(new Date());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch events from the API
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/calendar_events/');
      const formattedEvents = response.data.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEvents(formattedEvents);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories, businesses, and people when modal opens
  useEffect(() => {
    if (isModalOpen) {
      apiClient.get('/api/categories/').then(res => setCategories(res.data)).catch(() => setCategories([]));
      apiClient.get('/api/businesses/').then(res => setBusinesses(res.data)).catch(() => setBusinesses([]));
      apiClient.get('/api/people/').then(res => setPeople(res.data)).catch(() => setPeople([]));
    }
  }, [isModalOpen]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent({ id: 0, title: '', start, end });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (event: Event) => {
    try {
      const eventData = {
        ...event,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        is_meeting: event.is_meeting || false,
        participants: event.participants || [],
      };

      if (selectedEvent?.id) {
        // Update existing event
        const response = await apiClient.put(`/api/calendar_events/${selectedEvent.id}/`, eventData);
        
        if (response.status < 200 || response.status >= 300) {
          const errorData = response.data || {};
          throw new Error(errorData.detail || `Failed to update event (${response.status})`);
        }
      } else {
        // Create new event
        const response = await apiClient.post('/api/calendar_events/', eventData);
        
        if (response.status < 200 || response.status >= 300) {
          const errorData = response.data || {};
          throw new Error(errorData.detail || `Failed to create event (${response.status})`);
        }
      }

      // Refresh events after save
      await fetchEvents();
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      setError('Failed to save event');
      console.error('Error saving event:', err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;

    try {
      const response = await apiClient.delete(`/api/calendar_events/${selectedEvent.id}/`);
      
      if (response.status < 200 || response.status >= 300) {
        const errorData = response.data || {};
        throw new Error(errorData.detail || `Failed to delete event (${response.status})`);
      }
      
      await fetchEvents();
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 16); // Format: "YYYY-MM-DDTHH:mm"
  };

  const filteredEvents = events.filter(event => {
    if (filterCategory && String(event.category) !== filterCategory) return false;
    if (filterBusiness && String(event.business) !== filterBusiness) return false;
    if (filterMeeting === 'yes' && !event.is_meeting) return false;
    if (filterMeeting === 'no' && event.is_meeting) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <svg className="animate-spin h-8 w-8 mr-2 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span className="text-primary-600 text-lg font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto px-0 py-4 sm:py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Mobile Filter Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </button>
        </div>

        {/* Left sidebar with filters - hidden on mobile */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full p-1 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-xs"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value="">All</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
                <select
                  className="w-full p-1 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-xs"
                  value={filterBusiness}
                  onChange={e => setFilterBusiness(e.target.value)}
                >
                  <option value="">All</option>
                  {businesses.map((biz: any) => (
                    <option key={biz.id} value={biz.id}>{biz.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting</label>
                <select
                  className="w-full p-1 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-xs"
                  value={filterMeeting}
                  onChange={e => setFilterMeeting(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right side with calendar */}
        <div className="flex-1">
          <div className="h-[500px] sm:h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              view={isMobile ? 'day' : view}
              onView={(newView: View) => setView(newView)}
              date={date}
              onNavigate={setDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              style={{ height: '100%' }}
              min={new Date(1970, 1, 1, 7, 0, 0)}
              components={{
                event: ({ event }: { event: Event }) => (
                  <span className="flex items-center gap-1">
                    {event.category && <CategoryIcon className={categoryColors[event.category] || 'text-primary-300'} />}
                    {event.is_meeting && <MeetingIcon className="text-primary-100" />}
                    <span className="truncate">{event.title}</span>
                  </span>
                ),
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <Transition appear show={isFilterModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsFilterModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 mb-4">
                    Filters
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                      >
                        <option value="">All</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={filterBusiness}
                        onChange={e => setFilterBusiness(e.target.value)}
                      >
                        <option value="">All</option>
                        {businesses.map((biz: any) => (
                          <option key={biz.id} value={biz.id}>{biz.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        value={filterMeeting}
                        onChange={e => setFilterMeeting(e.target.value)}
                      >
                        <option value="all">All</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={() => setIsFilterModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 z-50">
            <h2 className="text-xl font-bold mb-4">
              {selectedEvent?.id && selectedEvent.id !== 0 ? 'Edit Event' : 'New Event'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Event Title"
                  value={selectedEvent?.title || ''}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent!, title: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={selectedEvent?.description || ''}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent!, description: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={selectedEvent?.category || ''}
                  onChange={e => setSelectedEvent({ ...selectedEvent!, category: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Select category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business (optional)</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={selectedEvent?.business || ''}
                  onChange={e => setSelectedEvent({ ...selectedEvent!, business: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">No business</option>
                  {businesses.map((biz: any) => (
                    <option key={biz.id} value={biz.id}>{biz.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="is_meeting"
                  type="checkbox"
                  checked={!!selectedEvent?.is_meeting}
                  onChange={e => setSelectedEvent({ ...selectedEvent!, is_meeting: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_meeting" className="text-sm font-medium text-gray-700">Is this a meeting?</label>
              </div>

              {selectedEvent?.is_meeting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                  <select
                    multiple
                    className="w-full p-1 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-xs h-24"
                    value={(selectedEvent.participants || []).map(String)}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions, option => Number(option.value));
                      setSelectedEvent({ ...selectedEvent!, participants: options });
                    }}
                  >
                    {people.map((person: any) => (
                      <option key={person.id} value={person.id}>{person.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formatDateTime(selectedEvent?.start || new Date())}
                  onChange={(e) => setSelectedEvent({ 
                    ...selectedEvent!, 
                    start: new Date(e.target.value)
                  })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formatDateTime(selectedEvent?.end || new Date())}
                  onChange={(e) => setSelectedEvent({ 
                    ...selectedEvent!, 
                    end: new Date(e.target.value)
                  })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              {selectedEvent && selectedEvent.id !== 0 && (
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEvent(selectedEvent!)}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage; 