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
import DailyHabitsPage from './pages/DailyHabitsPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <RefreshProvider>
        <TaskRefreshProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes with Layout */}
            <Route path="/" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />
            <Route path="/projects" element={
              <Layout>
                <Projects />
              </Layout>
            } />
            <Route path="/tasks" element={
              <Layout>
                <TasksPage />
              </Layout>
            } />
            <Route path="/businesses" element={
              <Layout>
                <BusinessesPage />
              </Layout>
            } />
            <Route path="/people" element={
              <Layout>
                <PeoplePage />
              </Layout>
            } />
            <Route path="/tools" element={
              <Layout>
                <ToolsPage />
              </Layout>
            } />
            <Route path="/goals" element={
              <Layout>
                <GoalsPage />
              </Layout>
            } />
            <Route path="/journal" element={
              <Layout>
                <JournalPage />
              </Layout>
            } />
            <Route path="/emails" element={
              <Layout>
                <EmailsPage />
              </Layout>
            } />
            <Route path="/health" element={
              <Layout>
                <HealthPage />
              </Layout>
            } />
            <Route path="/finance" element={
              <Layout>
                <FinancePage />
              </Layout>
            } />
            <Route path="/meetings" element={
              <Layout>
                <MeetingsPage />
              </Layout>
            } />
            <Route path="/projects/:id" element={
              <Layout>
                <ProjectDetailPage />
              </Layout>
            } />
            <Route path="/businesses/:id" element={
              <Layout>
                <BusinessDetailPage />
              </Layout>
            } />
            <Route path="/people/:id" element={
              <Layout>
                <PersonDetailPage />
              </Layout>
            } />
            <Route path="/search" element={
              <Layout>
                <SearchResultsPage />
              </Layout>
            } />
            <Route path="/goals/:id" element={
              <Layout>
                <GoalDetailPage />
              </Layout>
            } />
            <Route path="/notifications" element={
              <Layout>
                <NotificationsPage />
              </Layout>
            } />
            <Route path="/calendar" element={
              <Layout>
                <CalendarPage />
              </Layout>
            } />
            <Route path="/books" element={
              <Layout>
                <BooksPage />
              </Layout>
            } />
            <Route path="/habits" element={
              <Layout>
                <HabitsPage />
              </Layout>
            } />
            <Route path="/habits/:habitId" element={
              <Layout>
                <HabitDetailPage />
              </Layout>
            } />
            <Route path="/habits-dashboard" element={
              <Layout>
                <HabitsDashboardPage />
              </Layout>
            } />
            <Route path="/daily-habits" element={
              <Layout>
                <DailyHabitsPage />
              </Layout>
            } />
          </Routes>
        </TaskRefreshProvider>
      </RefreshProvider>
    </Router>
  );
}

export default App;
