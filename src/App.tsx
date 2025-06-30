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
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
      <AuthProvider>
      <RefreshProvider>
        <TaskRefreshProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes with Layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute>
                  <Layout>
                    <TasksPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/businesses" element={
                <ProtectedRoute>
                  <Layout>
                    <BusinessesPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/people" element={
                <ProtectedRoute>
                  <Layout>
                    <PeoplePage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/tools" element={
                <ProtectedRoute>
                  <Layout>
                    <ToolsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/goals" element={
                <ProtectedRoute>
                  <Layout>
                    <GoalsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/journal" element={
                <ProtectedRoute>
                  <Layout>
                    <JournalPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/emails" element={
                <ProtectedRoute>
                  <Layout>
                    <EmailsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/health" element={
                <ProtectedRoute>
                  <Layout>
                    <HealthPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/finance" element={
                <ProtectedRoute>
                  <Layout>
                    <FinancePage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/meetings" element={
                <ProtectedRoute>
                  <Layout>
                    <MeetingsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/projects/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/businesses/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <BusinessDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/people/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <PersonDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <Layout>
                    <SearchResultsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/goals/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <GoalDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Layout>
                    <NotificationsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/books" element={
                <ProtectedRoute>
                  <Layout>
                    <BooksPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/habits" element={
                <ProtectedRoute>
                  <Layout>
                    <HabitsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/habits/:habitId" element={
                <ProtectedRoute>
                  <Layout>
                    <HabitDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/habits-dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <HabitsDashboardPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/daily-habits" element={
                <ProtectedRoute>
                  <Layout>
                    <DailyHabitsPage />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
        </TaskRefreshProvider>
      </RefreshProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
