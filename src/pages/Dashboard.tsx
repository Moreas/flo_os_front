import React, { useEffect, useState } from 'react';
import { FlagIcon, ClipboardDocumentListIcon, FolderIcon, BookOpenIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import StatCard from '../components/ui/StatCard';
import MoodTracker from '../components/ui/MoodTracker';
import EnergyTracker from '../components/ui/EnergyTracker';
import ProjectList from '../components/ProjectList';
import axios from 'axios';
import { parseISO } from 'date-fns';
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
  const [activeHabits, setActiveHabits] = useState<number>(0);
  const [unhandledEmails, setUnhandledEmails] = useState<number>(0);

  useEffect(() => {
    // Fetch goals
    axios.get(`${API_BASE}/api/goals/`)
      .then(res => {
        const goals = res.data || [];
        const activeGoalsCount = goals.filter((g: any) => !g.is_completed).length;
        setActiveGoals(activeGoalsCount);
      })
      .catch((error) => {
        console.error('Goals API error:', error);
        setActiveGoals(0);
      });
    
    // Fetch tasks
    axios.get(`${API_BASE}/api/tasks/`)
      .then(res => {
        const tasks = res.data || [];
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
    axios.get(`${API_BASE}/api/projects/`)
      .then(res => {
        const projects = res.data || [];
        const activeProjectsCount = projects.filter((p: any) => p.status === 'active').length;
        setActiveProjects(activeProjectsCount);
      })
      .catch((error) => {
        console.error('Projects API error:', error);
        setActiveProjects(0);
      });
    
    // Fetch habits
    axios.get(`${API_BASE}/api/habits/`)
      .then(res => {
        const habits = res.data || [];
        const activeHabitsCount = habits.filter((h: any) => h.is_active).length;
        setActiveHabits(activeHabitsCount);
      })
      .catch((error) => {
        console.error('Habits API error:', error);
        setActiveHabits(0);
      });
    // Fetch emails
    axios.get(`${API_BASE}/api/emails/`)
      .then(res => {
        const emails = res.data || [];
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
          value={activeGoals}
          icon={FlagIcon}
          link="/goals"
        />
        <StatCard
          title="Tasks Due Today"
          value={tasksDueToday}
          icon={ClipboardDocumentListIcon}
          link="/tasks"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={FolderIcon}
          link="/projects"
        />
        <StatCard
          title="Active Habits"
          value={activeHabits}
          icon={BookOpenIcon}
          link="/habits"
        />
        <StatCard
          title="Emails Not Handled"
          value={unhandledEmails}
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