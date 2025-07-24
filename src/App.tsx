import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { TaskRefreshProvider } from './contexts/TaskRefreshContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TasksPage from './pages/TasksPage';
import BusinessesPage from './pages/BusinessesPage';
import PeoplePage from './pages/PeoplePage';
import ToolsPage from './pages/ToolsPage';
import GoalsPage from './pages/GoalsPage';
import LearningPage from './pages/LearningPage';
import HabitsDashboardPage from './pages/HabitsDashboardPage';
import EmailsPage from './pages/EmailsPage';
import JournalPage from './pages/JournalPage';
import MoodTrackerPage from './pages/MoodTrackerPage';
import MeetingsPage from './pages/MeetingsPage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import GoalDetailPage from './pages/GoalDetailPage';
import PersonDetailPage from './pages/PersonDetailPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TaskDetailPage from './pages/TaskDetailPage';
import BookDetailPage from './pages/BookDetailPage';
import HabitDetailPage from './pages/HabitDetailPage';
import WishListPage from './pages/WishListPage';
import SettingsPage from './pages/SettingsPage';

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
              <Route path="/learning" element={
                <ProtectedRoute>
                  <Layout>
                    <LearningPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/habits" element={
                <ProtectedRoute>
                  <Layout>
                    <HabitsDashboardPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/wishlist" element={
                <ProtectedRoute>
                  <Layout>
                    <WishListPage />
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
              <Route path="/meetings" element={
                <ProtectedRoute>
                  <Layout>
                    <MeetingsPage />
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
              <Route path="/mood-tracker" element={
                <ProtectedRoute>
                  <Layout>
                    <MoodTrackerPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Detail pages */}
              <Route path="/businesses/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <BusinessDetailPage />
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
              <Route path="/people/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <PersonDetailPage />
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
              <Route path="/tasks/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <TaskDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/books/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <BookDetailPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/habits/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <HabitDetailPage />
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
