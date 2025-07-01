import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Task Details</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Task ID: {id}</p>
          <p className="text-gray-600 mt-4">Task detail functionality coming soon...</p>
        </div>
      </div>
    </Layout>
  );
};

export default TaskDetailPage; 