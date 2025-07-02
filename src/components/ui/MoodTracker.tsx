import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'; // For loading/error
import { apiClient } from '../../api/apiConfig';

// Interface for mood data from the API
interface MoodEntry {
  id: number;
  level: 1 | 2 | 3; // Mood level: 1 (Bad), 2 (Okay), 3 (Good)
  comment?: string | null;
  created_at: string; // ISO date string
}

// Interface for the data format Recharts expects
interface ChartData {
  date: string; // Formatted date for XAxis
  level: number;
  comment?: string | null;
  fullDate: string; // For tooltip
}

const moodLabels: { [key: number]: string } = {
  1: 'Bad',
  2: 'Okay',
  3: 'Good',
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartData;
    return (
      <div className="p-2 bg-white border border-gray-300 rounded shadow-lg">
        <p className="text-sm font-semibold text-gray-700">{`Date: ${data.fullDate}`}</p>
        <p className="text-sm text-gray-600">{`Mood: ${moodLabels[data.level] || data.level}`}</p>
        {data.comment && <p className="mt-1 text-xs text-gray-500 italic">{`Comment: ${data.comment}`}</p>}
      </div>
    );
  }
  return null;
};

const MoodTracker: React.FC = () => {
  const [moodData, setMoodData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/moods/');
        
        if (response.status >= 200 && response.status < 300) {
          const data: MoodEntry[] = response.data;
          
          const mappedData: (ChartData | null)[] = data.map(entry => {
            if (!entry || typeof entry.created_at !== 'string' || entry.created_at.trim() === '') {
              console.warn('Skipping mood entry due to missing or invalid created_at:', entry);
              return null; 
            }
            try {
              const parsedDate = parseISO(entry.created_at);
              if (isNaN(parsedDate.getTime())) {
                console.warn('Skipping mood entry due to unparseable created_at string:', entry.created_at, entry);
                return null;
              }
              return {
                date: format(parsedDate, 'MMM d'), 
                level: entry.level,
                comment: entry.comment,
                fullDate: format(parsedDate, 'MMM d, yyyy'),
              };
            } catch (dateProcessingError) {
              console.error('Error processing date for mood entry:', entry.created_at, entry, dateProcessingError);
              return null;
            }
          });
          
          // Filter out nulls using a type guard
          const filteredData: ChartData[] = mappedData.filter(
            (item): item is ChartData => item !== null
          );

          setMoodData(filteredData);
        } else {
          throw new Error(`Failed to fetch mood data: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching mood data:', error);
        setError('Failed to load mood data');
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, []);

  if (loading) {
    return (
      <div className="card h-80 flex flex-col items-center justify-center">
        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mb-2" />
        <p className="text-sm text-gray-500">Loading mood data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card h-80 flex flex-col items-center justify-center p-4">
        <ExclamationCircleIcon className="w-8 h-8 text-red-400 mb-2" />
        <p className="text-sm text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (moodData.length === 0) {
    return (
      <div className="card h-80 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500">No mood data recorded yet.</p>
        <p className="text-xs text-gray-400 mt-1">Start tracking your mood using the Quick Add menu!</p>
      </div>
    );
  }

  return (
    <div className="card h-80 flex flex-col"> {/* Added flex flex-col */}
      <h3 className="text-lg font-medium text-gray-900 mb-4 px-4 pt-4">Mood Evolution (Last 30 entries)</h3> {/* Added padding */}
      <div className="flex-grow"> {/* Added flex-grow for ResponsiveContainer */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={moodData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}> {/* Adjusted margins */}
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              axisLine={{ stroke: '#d1d5db' }} 
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              domain={[1, 3]} 
              ticks={[1, 2, 3]} 
              tickFormatter={(value) => moodLabels[value] || value.toString()}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }} 
              tickLine={{ stroke: '#d1d5db' }}
              width={80} // Increased width to accommodate labels like "Good", "Okay", "Bad"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
                type="monotone" 
                dataKey="level" 
                stroke="#2563eb" // primary-600
                fill="#93c5fd"   // primary-300 with some opacity (Tailwind blue-300 as example)
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1, fill: '#2563eb' }}
                activeDot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: '#2563eb' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MoodTracker; 