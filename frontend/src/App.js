import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FieldsPage from './pages/FieldsPage';
import TeamsPage from './pages/TeamsPage';
import BookingsPage from './pages/BookingsPage';
import CreateBookingPage from './pages/CreateBookingPage';
import ProfilePage from './pages/ProfilePage';

// Import layout components
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="fields" element={<FieldsPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="bookings/new" element={<CreateBookingPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin-only routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="users" element={<div>Admin Users Page (Coming Soon)</div>} />
              <Route path="settings" element={<div>Admin Settings Page (Coming Soon)</div>} />
            </Route>

            {/* Field owner routes */}
            <Route path="/owner" element={
              <ProtectedRoute requiredRole="field_owner">
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="my-fields" element={<div>My Fields Page (Coming Soon)</div>} />
              <Route path="field-analytics" element={<div>Field Analytics Page (Coming Soon)</div>} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
