import React, { useEffect, useState } from 'react';
import { FlagIcon, ClipboardDocumentListIcon, FolderIcon, BookOpenIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import StatCard from '../components/ui/StatCard';
import MoodTracker from '../components/ui/MoodTracker';
import EnergyTracker from '../components/ui/EnergyTracker';
import ProjectList from '../components/ProjectList';
import axios from 'axios';
import { isToday, parseISO } from 'date-fns';
import API_BASE from '../apiBase';
import { useRefresh } from '../contexts/RefreshContext';

const Dashboard: React.FC = () => {
  const { tasksVersion } = useRefresh();
  const currentTime = new Date();
  const hour = currentTime.getHours();
  let greeting = 'Good morning';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }

  // State for metrics
  const [activeGoals, setActiveGoals] = useState<number>(0);
  const [tasksDueToday, setTasksDueToday] = useState<number>(0);
  const [activeProjects, setActiveProjects] = useState<number>(0);
  // Optionally: const [monthlyIncome, setMonthlyIncome] = useState<string>("$4,200");

  useEffect(() => {
    // Fetch goals
    axios.get(`${API_BASE}/api/goals/`)
      .then(res => {
        const goals = res.data || [];
        setActiveGoals(goals.filter((g: any) => g.status === 'active').length);
      })
      .catch(() => setActiveGoals(0));
    // Fetch tasks
    axios.get(`${API_BASE}/api/tasks/`)
      .then(res => {
        const tasks = res.data || [];
        const todayCount = tasks.filter((t: any) => {
          if (!t.due_date || t.is_done) return false;
          try {
            return isToday(parseISO(t.due_date));
          } catch {
            return false;
          }
        }).length;
        setTasksDueToday(todayCount);
      })
      .catch(() => setTasksDueToday(0));
    // Fetch projects
    axios.get(`${API_BASE}/api/projects/`)
      .then(res => {
        const projects = res.data || [];
        setActiveProjects(projects.filter((p: any) => p.status === 'active').length);
      })
      .catch(() => setActiveProjects(0));
    // Optionally: fetch monthly income here
  }, [tasksVersion]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, Flo 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Goals"
          value={activeGoals}
          icon={FlagIcon}
        />
        <StatCard
          title="Tasks Due Today"
          value={tasksDueToday}
          icon={ClipboardDocumentListIcon}
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={FolderIcon}
        />
        <StatCard
          title="Monthly Income"
          value={"$4,200"}
          icon={CurrencyDollarIcon}
          trend={{ value: '+12% from last month', isPositive: true }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MoodTracker />
        <EnergyTracker />
      </div>

      {/* System Status and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">RAG memory</span>
              <span className="text-sm font-medium text-green-600">✅</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Last sync</span>
              <span className="text-sm font-medium text-gray-900">3h ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">AI agents running</span>
              <span className="text-sm font-medium text-gray-900">2</span>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">Journal entry created</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProjectList />
    </div>
  );
};

export default Dashboard; 