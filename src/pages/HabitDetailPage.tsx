import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HabitDetailView from '../components/HabitDetailView';

const HabitDetailPage: React.FC = () => {
  const { habitId } = useParams<{ habitId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/habits');
  };

  if (!habitId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No habit ID provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HabitDetailView 
        habitId={parseInt(habitId, 10)} 
        onBack={handleBack}
      />
    </div>
  );
};

export default HabitDetailPage; 