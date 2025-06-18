import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TasksPage from './pages/TasksPage';
import BusinessesPage from './pages/BusinessesPage';
import PeoplePage from './pages/PeoplePage';
import ToolsPage from './pages/ToolsPage';
import GoalsPage from './pages/GoalsPage';
import JournalPage from './pages/JournalPage';
import EmailsPage from './pages/EmailsPage';
import HealthPage from './pages/HealthPage';
import FinancePage from './pages/FinancePage';
import MeetingsPage from './pages/MeetingsPage';
import { TaskRefreshProvider } from './contexts/TaskRefreshContext';
import { RefreshProvider } from './contexts/RefreshContext';
import ProjectDetailPage from './pages/ProjectDetailPage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import PersonDetailPage from './pages/PersonDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import CalendarPage from './pages/CalendarPage';
import BooksPage from './pages/BooksPage';
import HabitsPage from './pages/HabitsPage';
import HabitDetailPage from './pages/HabitDetailPage';
import HabitsDashboardPage from './pages/HabitsDashboardPage';

function App() {
  return (
    <Router>
      <RefreshProvider>
        <TaskRefreshProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/businesses" element={<BusinessesPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/emails" element={<EmailsPage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/businesses/:id" element={<BusinessDetailPage />} />
              <Route path="/people/:id" element={<PersonDetailPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/goals/:id" element={<GoalDetailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/habits" element={<HabitsPage />} />
              <Route path="/habits/:habitId" element={<HabitDetailPage />} />
              <Route path="/habits-dashboard" element={<HabitsDashboardPage />} />
            </Routes>
          </Layout>
        </TaskRefreshProvider>
      </RefreshProvider>
    </Router>
  );
}

export default App;
