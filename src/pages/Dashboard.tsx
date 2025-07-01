import React, { useEffect, useState } from 'react';
import { FlagIcon, ClipboardDocumentListIcon, FolderIcon, BookOpenIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import StatCard from '../components/ui/StatCard';
import MoodTracker from '../components/ui/MoodTracker';
import EnergyTracker from '../components/ui/EnergyTracker';
import ProjectList from '../components/ProjectList';
import { parseISO } from 'date-fns';
import { apiClient } from '../api/apiConfig';

const Dashboard: React.FC = () => {
  const currentTime = new Date();
  const hour = currentTime.getHours();
  let greeting = 'Good morning';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }

  // State for metrics
  const [activeGoals, setActiveGoals] = useState<number | null>(null);
  const [tasksDueToday, setTasksDueToday] = useState<number | null>(null);
  const [activeProjects, setActiveProjects] = useState<number | null>(null);
  const [activeHabits, setActiveHabits] = useState<number | null>(null);
  const [unhandledEmails, setUnhandledEmails] = useState<number | null>(null);

  useEffect(() => {
    console.log('[Dashboard] Fetching dashboard data...');
    
    // Fetch goals
    apiClient.get('/api/goals/')
      .then(res => {
        console.log('[Dashboard] Goals fetched:', res.data.length);
        const activeGoalsCount = res.data.filter((g: any) => !g.is_completed).length;
        setActiveGoals(activeGoalsCount);
      })
      .catch((error) => {
        console.error('Goals API error:', error);
        setActiveGoals(0);
      });
    
    // Fetch tasks
    apiClient.get('/api/tasks/')
      .then(res => {
        console.log('[Dashboard] Tasks fetched:', res.data.length);
        const now = new Date();
        const todayCount = res.data.filter((t: any) => {
          if (!t.due_date || t.is_done) return false;
          try {
            const due = parseISO(t.due_date);
            // Include if due today or overdue (before today)
            return due <= now;
          } catch {
            return false;
          }
        }).length;
        setTasksDueToday(todayCount);
      })
      .catch((error) => {
        console.error('Tasks API error:', error);
        setTasksDueToday(0);
      });
    
    // Fetch projects
    apiClient.get('/api/projects/')
      .then(res => {
        console.log('[Dashboard] Projects fetched:', res.data.length);
        const activeProjectsCount = res.data.filter((p: any) => p.status === 'active').length;
        setActiveProjects(activeProjectsCount);
      })
      .catch((error) => {
        console.error('Projects API error:', error);
        setActiveProjects(0);
      });
    
    // Fetch habits
    apiClient.get('/api/habits/')
      .then(res => {
        console.log('[Dashboard] Habits fetched:', res.data.length);
        const activeHabitsCount = res.data.filter((h: any) => h.is_active).length;
        setActiveHabits(activeHabitsCount);
      })
      .catch((error) => {
        console.error('Habits API error:', error);
        setActiveHabits(0);
      });

    // Fetch emails
    apiClient.get('/api/emails/')
      .then(res => {
        const totalEmails = res.data.length;
        const unhandledCount = res.data.filter((e: any) => e.is_handled === false).length;
        console.log(`[Dashboard] Emails fetched: ${totalEmails} total, ${unhandledCount} unhandled`);
        setUnhandledEmails(unhandledCount);
      })
      .catch((error) => {
        console.error('Emails API error:', error);
        setUnhandledEmails(0);
      });
  }, []);

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Active Goals"
          value={activeGoals !== null ? activeGoals : "Loading..."}
          icon={FlagIcon}
          link="/goals"
        />
        <StatCard
          title="Tasks Due Today"
          value={tasksDueToday !== null ? tasksDueToday : "Loading..."}
          icon={ClipboardDocumentListIcon}
          link="/tasks"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects !== null ? activeProjects : "Loading..."}
          icon={FolderIcon}
          link="/projects"
        />
        <StatCard
          title="Active Habits"
          value={activeHabits !== null ? activeHabits : "Loading..."}
          icon={BookOpenIcon}
          link="/habits"
        />
        <StatCard
          title="Emails Not Handled"
          value={unhandledEmails !== null ? unhandledEmails : "Loading..."}
          icon={EnvelopeIcon}
          link="/emails"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MoodTracker />
        <EnergyTracker />
      </div>

      <ProjectList />
    </div>
  );
};

export default Dashboard; 