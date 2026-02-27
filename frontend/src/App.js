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
import LandingPage from './pages/LandingPage';
import PublicTeamsPage from './pages/PublicTeamsPage';
import PublicTeamDetailsPage from './pages/PublicTeamDetailsPage';
import FieldDetailsPage from './pages/FieldDetailsPage';
import TeamCreatePage from './pages/TeamCreatePage';
import TeamDetailsPage from './pages/TeamDetailsPage';
import TeamManagePage from './pages/TeamManagePage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import OwnerFieldsPage from './pages/OwnerFieldsPage';
import OwnerBookingsPage from './pages/OwnerBookingsPage';

// Import layout components
import AppLayout from './components/layout/AppLayout';
import PublicLayout from './components/layout/PublicLayout';
import OwnerLayout from './components/layout/OwnerLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public (Guest) routes */}
            <Route element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="fields" element={<FieldsPage />} />
              <Route path="fields/:id" element={<FieldDetailsPage />} />
              <Route path="teams" element={<PublicTeamsPage />} />
              <Route path="teams/:id" element={<PublicTeamDetailsPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            {/* Player/Captain/Admin app */}
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={['player', 'captain', 'admin']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="fields" element={<FieldsPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route
                path="teams/create"
                element={
                  <ProtectedRoute allowedRoles={['captain', 'admin']}>
                    <TeamCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route path="teams/:id" element={<TeamDetailsPage />} />
              <Route
                path="teams/:id/manage"
                element={
                  <ProtectedRoute allowedRoles={['captain', 'admin']}>
                    <TeamManagePage />
                  </ProtectedRoute>
                }
              />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="bookings/new" element={<CreateBookingPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Admin-only (optional/minimal) */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div>Admin Users Page (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div>Admin Settings Page (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Field Owner app */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['field_owner', 'admin']}>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboardPage />} />
              <Route path="fields" element={<OwnerFieldsPage />} />
              <Route path="bookings" element={<OwnerBookingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
