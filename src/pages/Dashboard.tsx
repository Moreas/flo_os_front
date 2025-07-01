import React, { useEffect, useState } from 'react';
import { FlagIcon, ClipboardDocumentListIcon, FolderIcon, BookOpenIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import StatCard from '../components/ui/StatCard';
import MoodTracker from '../components/ui/MoodTracker';
import EnergyTracker from '../components/ui/EnergyTracker';
import ProjectList from '../components/ProjectList';
import { parseISO } from 'date-fns';
import API_BASE from '../apiBase';
import { useRefresh } from '../contexts/RefreshContext';
import { fetchWithCSRF } from '../api/fetchWithCreds';

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
  const [activeGoals, setActiveGoals] = useState<number | null>(null);
  const [tasksDueToday, setTasksDueToday] = useState<number | null>(null);
  const [activeProjects, setActiveProjects] = useState<number | null>(null);
  const [activeHabits, setActiveHabits] = useState<number | null>(null);
  const [unhandledEmails, setUnhandledEmails] = useState<number | null>(null);

  useEffect(() => {
    console.log('[Dashboard] Fetching dashboard data...');
    
    // Fetch goals
    fetchWithCSRF(`${API_BASE}/api/goals/`)
      .then(async res => {
        if (!res.ok) {
          console.error(`Goals API error: ${res.status} ${res.statusText}`);
          throw new Error(`Failed to fetch goals: ${res.status}`);
        }
        const goals = await res.json();
        console.log('[Dashboard] Goals fetched:', goals.length);
        const activeGoalsCount = goals.filter((g: any) => !g.is_completed).length;
        setActiveGoals(activeGoalsCount);
      })
      .catch((error) => {
        console.error('Goals API error:', error);
        setActiveGoals(0);
      });
    
    // Fetch tasks
    fetchWithCSRF(`${API_BASE}/api/tasks/`)
      .then(async res => {
        if (!res.ok) {
          console.error(`Tasks API error: ${res.status} ${res.statusText}`);
          throw new Error(`Failed to fetch tasks: ${res.status}`);
        }
        const tasks = await res.json();
        console.log('[Dashboard] Tasks fetched:', tasks.length);
        const now = new Date();
        const todayCount = tasks.filter((t: any) => {
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
    fetchWithCSRF(`${API_BASE}/api/projects/`)
      .then(async res => {
        if (!res.ok) {
          console.error(`Projects API error: ${res.status} ${res.statusText}`);
          throw new Error(`Failed to fetch projects: ${res.status}`);
        }
        const projects = await res.json();
        console.log('[Dashboard] Projects fetched:', projects.length);
        const activeProjectsCount = projects.filter((p: any) => p.status === 'active').length;
        setActiveProjects(activeProjectsCount);
      })
      .catch((error) => {
        console.error('Projects API error:', error);
        setActiveProjects(0);
      });
    
    // Fetch habits
    fetchWithCSRF(`${API_BASE}/api/habits/`)
      .then(async res => {
        if (!res.ok) {
          console.error(`Habits API error: ${res.status} ${res.statusText}`);
          throw new Error(`Failed to fetch habits: ${res.status}`);
        }
        const habits = await res.json();
        console.log('[Dashboard] Habits fetched:', habits.length);
        const activeHabitsCount = habits.filter((h: any) => h.is_active).length;
        setActiveHabits(activeHabitsCount);
      })
      .catch((error) => {
        console.error('Habits API error:', error);
        setActiveHabits(0);
      });

    // Fetch emails
    fetchWithCSRF(`${API_BASE}/api/emails/`)
      .then(async res => {
        if (!res.ok) {
          console.error(`Emails API error: ${res.status} ${res.statusText}`);
          throw new Error(`Failed to fetch emails: ${res.status}`);
        }
        const emails = await res.json();
        console.log('[Dashboard] Emails fetched:', emails.length);
        const unhandledCount = emails.filter((e: any) => e.is_handled === false).length;
        setUnhandledEmails(unhandledCount);
      })
      .catch((error) => {
        console.error('Emails API error:', error);
        setUnhandledEmails(0);
      });
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