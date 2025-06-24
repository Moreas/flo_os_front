import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { format, parseISO, startOfWeek, subDays, startOfMonth, eachDayOfInterval, startOfYear, eachWeekOfInterval, isSameDay, isSameWeek, getWeek } from 'date-fns';
import API_BASE from '../apiBase';

const TIME_RANGES = [
  { label: 'This week', value: 'this_week' },
  { label: 'Last 7 days', value: 'last_7_days' },
  { label: 'This month', value: 'this_month' },
  { label: 'This year', value: 'this_year' },
];

const CompletedTasksChart: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState('this_week');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/tasks/`, { params: { is_done: true } });
        const results = Array.isArray(res.data) ? res.data : res.data.results || [];
        console.log('Fetched tasks for completed chart:', results);
        const completed = results.filter((task: any) => task.is_done === true);
        console.log('Filtered completed tasks for chart:', completed);
        setTasks(completed);
      } catch (e) {
        setError('Failed to load completed tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!tasks.length) return;
    const now = new Date();
    let data: any[] = [];
    if (range === 'this_week') {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      data = eachDayOfInterval({ start: weekStart, end: now }).map(day => {
        const count = tasks.filter(t => t.completion_date && isSameDay(parseISO(t.completion_date), day)).length;
        return { label: format(day, 'EEE'), count };
      });
    } else if (range === 'last_7_days') {
      data = Array.from({ length: 7 }).map((_, i) => {
        const day = subDays(now, 6 - i);
        const count = tasks.filter(t => t.completion_date && isSameDay(parseISO(t.completion_date), day)).length;
        return { label: format(day, 'MMM d'), count };
      });
    } else if (range === 'this_month') {
      const monthStart = startOfMonth(now);
      data = eachDayOfInterval({ start: monthStart, end: now }).map(day => {
        const count = tasks.filter(t => t.completion_date && isSameDay(parseISO(t.completion_date), day)).length;
        return { label: format(day, 'd'), count };
      });
    } else if (range === 'this_year') {
      const yearStart = startOfYear(now);
      const weeks = eachWeekOfInterval({ start: yearStart, end: now }, { weekStartsOn: 1 });
      data = weeks.map((weekStartDate, i) => {
        const weekNum = getWeek(weekStartDate, { weekStartsOn: 1 });
        const count = tasks.filter(t => t.completion_date && isSameWeek(parseISO(t.completion_date), weekStartDate, { weekStartsOn: 1 })).length;
        return { label: `W${weekNum}`, count };
      });
    }
    setChartData(data);
  }, [tasks, range]);

  return (
    <div className="card h-96 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h3 className="text-lg font-medium text-gray-900">Completed Tasks Overview</h3>
        <select
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={range}
          onChange={e => setRange(e.target.value)}
        >
          {TIME_RANGES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-grow">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CompletedTasksChart; 