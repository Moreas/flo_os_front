import React from 'react';

const MeetingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Meetings & Calls</h1>
        <p className="mt-2 text-gray-600">
          Schedule and manage your meetings, calls, and appointments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Meetings</h2>
          <div className="text-sm text-gray-500">
            No upcoming meetings scheduled.
          </div>
        </div>

        {/* Recent Calls */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Calls</h2>
          <div className="text-sm text-gray-500">
            No recent calls recorded.
          </div>
        </div>

        {/* Meeting Notes */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Meeting Notes</h2>
          <div className="text-sm text-gray-500">
            No meeting notes available.
          </div>
        </div>

        {/* Meeting Templates */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Meeting Templates</h2>
          <div className="text-sm text-gray-500">
            No meeting templates created yet.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsPage; 