import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';

// Interface for energy data from the API
interface EnergyEntry {
  id: number;
  level: 0 | 1 | 2 | 3 | 4 | 5; // Energy level: 0 (Exhausted) to 5 (Very High)
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

const energyLabels: { [key: number]: string } = {
  0: 'Exhausted',
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very High',
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartData;
    return (
      <div className="p-2 bg-white border border-gray-300 rounded shadow-lg">
        <p className="text-sm font-semibold text-gray-700">{`Date: ${data.fullDate}`}</p>
        <p className="text-sm text-gray-600">{`Energy: ${energyLabels[data.level] || data.level}`}</p>
        {data.comment && <p className="mt-1 text-xs text-gray-500 italic">{`Comment: ${data.comment}`}</p>}
      </div>
    );
  }
  return null;
};

const EnergyTracker: React.FC = () => {
  const [energyData, setEnergyData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnergyData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/energy/');
        
        if (response.status >= 200 && response.status < 300) {
          const data: EnergyEntry[] = response.data;
          
          const mappedData: (ChartData | null)[] = data.map(entry => {
            if (!entry || typeof entry.created_at !== 'string' || entry.created_at.trim() === '') {
              console.warn('Skipping energy entry due to missing or invalid created_at:', entry);
              return null; 
            }
            try {
              const parsedDate = parseISO(entry.created_at);
              if (isNaN(parsedDate.getTime())) {
                console.warn('Skipping energy entry due to unparseable created_at string:', entry.created_at, entry);
                return null;
              }
              return {
                date: format(parsedDate, 'MMM d'), 
                level: entry.level,
                comment: entry.comment,
                fullDate: format(parsedDate, 'MMM d, yyyy'),
              };
            } catch (dateProcessingError) {
              console.error('Error processing date for energy entry:', entry.created_at, entry, dateProcessingError);
              return null;
            }
          });
          
          // Filter out nulls using a type guard
          const filteredData: ChartData[] = mappedData.filter(
            (item): item is ChartData => item !== null
          );

          setEnergyData(filteredData);
        } else {
          throw new Error(`Failed to fetch energy data: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching energy data:', error);
        setError('Failed to load energy data');
      } finally {
        setLoading(false);
      }
    };

    fetchEnergyData();
  }, []);

  if (loading) {
    return (
      <div className="card h-80 flex flex-col items-center justify-center">
        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mb-2" />
        <p className="text-sm text-gray-500">Loading energy data...</p>
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

  if (energyData.length === 0) {
    return (
      <div className="card h-80 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500">No energy data recorded yet.</p>
        <p className="text-xs text-gray-400 mt-1">Start tracking your energy using the Quick Add menu!</p>
      </div>
    );
  }

  return (
    <div className="card h-80 flex flex-col">
      <h3 className="text-lg font-medium text-gray-900 mb-4 px-4 pt-4">Energy Evolution (Last 30 entries)</h3>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={energyData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              axisLine={{ stroke: '#d1d5db' }} 
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              domain={[0, 5]} 
              ticks={[0, 1, 2, 3, 4, 5]} 
              tickFormatter={(value) => energyLabels[value] || value.toString()}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }} 
              tickLine={{ stroke: '#d1d5db' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
                type="monotone" 
                dataKey="level" 
                stroke="#2563eb"
                fill="#93c5fd"
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

export default EnergyTracker; 