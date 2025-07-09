import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiConfig';
import { 
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  format, 
  startOfYear, 
  endOfYear, 
  eachDayOfInterval, 
  getWeek, 
  getDay,
  isBefore,
  isAfter,
} from 'date-fns';

interface HabitProgressGraphProps {
  habitId: number;
  habitName: string;
}

interface DayData {
  date: Date;
  status: 'completed' | 'not_completed' | 'pending' | 'not_tracked';
  count?: number;
}

interface HabitInstance {
  id: number;
  date: string;
  completed: boolean;
  notes?: string;
}

const HabitProgressGraph: React.FC<HabitProgressGraphProps> = ({ habitId, habitName }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [yearData, setYearData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  // Habit tracking cutoff date - before this date, habits are not tracked
  
  const fetchYearData = useCallback(async (year: number) => {
    const CUTOFF_DATE = new Date(2025, 5, 27); // June 27, 2025
    setLoading(true);
    setError(null);
    
    try {
      const startDate = startOfYear(new Date(year, 0, 1));
      const endDate = endOfYear(new Date(year, 0, 1));
      
      // Don't fetch data before cutoff date
      const actualStartDate = isBefore(startDate, CUTOFF_DATE) ? CUTOFF_DATE : startDate;
      
      const startDateStr = format(actualStartDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch instances for the year
      const instancesResponse = await apiClient.get(
        `/api/habit-instances/?habit_id=${habitId}&start_date=${startDateStr}&end_date=${endDateStr}`
      );
      
      const instances: HabitInstance[] = instancesResponse.data || [];
      
      // Create all days for the year
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Create lookup for instance data
      const instanceLookup = new Map<string, HabitInstance>();
      instances.forEach(instance => {
        instanceLookup.set(instance.date, instance);
      });

      // Generate day data
      const dayData: DayData[] = allDays.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const instance = instanceLookup.get(dateStr);
        
        // Determine status
        let status: DayData['status'];
        
        if (isBefore(date, CUTOFF_DATE)) {
          status = 'not_tracked';
        } else if (isAfter(date, new Date())) {
          status = 'not_tracked';
        } else if (instance) {
          status = instance.completed ? 'completed' : 'not_completed';
        } else {
          // No instance = pending (should have been tracked but wasn't)
          status = 'pending';
        }

        return {
          date,
          status,
          count: status === 'completed' ? 1 : 0
        };
      });

      setYearData(dayData);
    } catch (err) {
      console.error('Error fetching habit data:', err);
      setError('Failed to load habit progress data');
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => {
    fetchYearData(currentYear);
  }, [currentYear, fetchYearData]);

  const getIntensityLevel = (status: string, count?: number): number => {
    switch (status) {
      case 'completed':
        return 4; // Darkest green
      case 'not_completed':
        return -1; // Red
      case 'pending':
        return -2; // Yellow
      case 'not_tracked':
      default:
        return 0; // Light gray
    }
  };

  const getColorClass = (intensityLevel: number): string => {
    switch (intensityLevel) {
      case 4:
        return 'bg-green-500 hover:bg-green-600'; // Completed
      case -1:
        return 'bg-red-400 hover:bg-red-500'; // Not completed
      case -2:
        return 'bg-yellow-400 hover:bg-yellow-500'; // Pending
      case 0:
      default:
        return 'bg-gray-100 hover:bg-gray-200'; // Not tracked
    }
  };

  const formatTooltip = (day: DayData): string => {
    const dateStr = format(day.date, 'MMM d, yyyy');
    switch (day.status) {
      case 'completed':
        return `${dateStr}: Completed`;
      case 'not_completed':
        return `${dateStr}: Not completed`;
      case 'pending':
        return `${dateStr}: Pending`;
      case 'not_tracked':
        return `${dateStr}: Not tracked`;
      default:
        return dateStr;
    }
  };

  // Organize days into a grid (53 weeks x 7 days)
  const getGridData = () => {
    const grid: (DayData | null)[][] = [];
    
    // Initialize 53 weeks x 7 days grid
    for (let week = 0; week < 53; week++) {
      grid[week] = new Array(7).fill(null);
    }
    
    yearData.forEach(day => {
      const weekNumber = getWeek(day.date, { weekStartsOn: 0 }) - 1; // 0-indexed
      const dayOfWeek = getDay(day.date); // 0 = Sunday
      
      if (weekNumber >= 0 && weekNumber < 53) {
        grid[weekNumber][dayOfWeek] = day;
      }
    });
    
    return grid;
  };

  const gridData = getGridData();
  const totalDays = yearData.filter(d => d.status !== 'not_tracked').length;
  const completedDays = yearData.filter(d => d.status === 'completed').length;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-green-50 rounded-full">
            <CalendarIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Progress Overview</h2>
            <p className="text-sm text-gray-600">
              {completedDays} completed days • {completionRate}% completion rate
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Year Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentYear(prev => prev - 1)}
              disabled={currentYear <= 2025}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">
              {currentYear}
            </span>
            <button
              onClick={() => setCurrentYear(prev => prev + 1)}
              disabled={currentYear >= new Date().getFullYear()}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            {showLegend ? (
              <>
                <EyeSlashIcon className="w-4 h-4" />
                <span>Hide legend</span>
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4" />
                <span>Show legend</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Grid */}
      <div className="relative">
        {/* Month labels */}
        <div className="flex mb-2 text-xs text-gray-500">
          <div className="w-8"></div> {/* Space for day labels */}
          {monthLabels.map((month, index) => (
            <div key={month} className="flex-1 text-left" style={{ marginLeft: index === 0 ? '0px' : '8px' }}>
              {month}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col text-xs text-gray-500 mr-2">
            {dayLabels.map((day, index) => (
              <div key={day} className="h-3 flex items-center" style={{ marginBottom: '2px' }}>
                {index % 2 === 1 ? day.slice(0, 3) : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex space-x-1">
            {gridData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-0.5">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      w-3 h-3 rounded-sm border border-gray-200 cursor-pointer transition-all duration-150
                      ${day ? getColorClass(getIntensityLevel(day.status, day.count)) : 'bg-gray-50'}
                    `}
                    title={day ? formatTooltip(day) : ''}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredDay && (
          <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
            {formatTooltip(hoveredDay)}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-6 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-yellow-400 border border-gray-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-red-400 border border-gray-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-500 border border-gray-200 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>
              <span>No data</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-400 border border-gray-200 rounded-sm"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-400 border border-gray-200 rounded-sm"></div>
              <span>Missed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 border border-gray-200 rounded-sm"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalDays}</div>
          <div className="text-sm text-gray-500">Total days tracked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completedDays}</div>
          <div className="text-sm text-gray-500">Days completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
          <div className="text-sm text-gray-500">Completion rate</div>
        </div>
      </div>
    </div>
  );
};

export default HabitProgressGraph; 