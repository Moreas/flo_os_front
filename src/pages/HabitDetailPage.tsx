import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HabitDetailView from '../components/HabitDetailView';

const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/habits');
  };

  if (!id) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No habit ID provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HabitDetailView 
        habitId={parseInt(id, 10)} 
        onBack={handleBack}
      />
    </div>
  );
};

export default HabitDetailPage; 