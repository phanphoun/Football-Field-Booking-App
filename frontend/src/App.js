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
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import PublicTeamsPage from './pages/PublicTeamsPage';
import PublicTeamDetailsPage from './pages/PublicTeamDetailsPage';
import FieldDetailsPage from './pages/FieldDetailsPage';
import TeamCreatePage from './pages/TeamCreatePage';
import TeamDetailsPage from './pages/TeamDetailsPage';
import TeamManagePage from './pages/TeamManagePage';
import TeamMatchHistoryPage from './pages/TeamMatchHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import OwnerFieldsPage from './pages/OwnerFieldsPage';
import OwnerBookingsPage from './pages/OwnerBookingsPage';
import OwnerMatchesPage from './pages/OwnerMatchesPage';
import LeaguePage from './pages/League';
import OpenMatchesPage from './pages/OpenMatchesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminRoleRequestsPage from './pages/AdminRoleRequestsPage';
import { getPreferredStartPath } from './utils/navigationPreferences';

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
              <Route path="league" element={<LeaguePage />} />
              <Route path="teams" element={<PublicTeamsPage />} />
              <Route path="teams/:id" element={<PublicTeamDetailsPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            {/* Player/Captain/Admin app */}
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={['player', 'captain', 'field_owner', 'admin']} redirectTo="/">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to={getPreferredStartPath('app')} replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="fields" element={<FieldsPage />} />
              <Route path="league" element={<LeaguePage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route
                path="teams/create"
                element={
                  <ProtectedRoute allowedRoles={['player', 'captain', 'field_owner']} redirectTo="/app/teams">
                    <TeamCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route path="teams/:id" element={<TeamDetailsPage />} />
              <Route path="teams/:id/matches" element={<TeamMatchHistoryPage />} />
              <Route
                path="teams/:id/manage"
                element={
                  <ProtectedRoute allowedRoles={['player', 'captain', 'field_owner']} redirectTo="/app/teams">
                    <TeamManagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="bookings"
                element={
                  <ProtectedRoute allowedRoles={['player', 'captain', 'field_owner']} redirectTo="/app/dashboard">
                    <BookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="bookings/new"
                element={
                  <ProtectedRoute
                    allowedRoles={['captain', 'field_owner']}
                    fallback={
                      <Navigate
                        to="/app/settings"
                        replace
                        state={{ errorMessage: 'Access denied for creating bookings.' }}
                      />
                    }
                  >
                    <CreateBookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="open-matches"
                element={
                  <ProtectedRoute allowedRoles={['captain', 'field_owner']}>
                    <OpenMatchesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />

              {/* Admin-only (optional/minimal) */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/role-requests"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminRoleRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <Navigate to="/app/settings" replace />
                }
              />
            </Route>

            {/* Field Owner app */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['field_owner', 'admin']} redirectTo="/">
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to={getPreferredStartPath('owner')} replace />} />
              <Route path="dashboard" element={<OwnerDashboardPage />} />
              <Route path="fields" element={<OwnerFieldsPage />} />
              <Route path="bookings" element={<OwnerBookingsPage />} />
              <Route
                path="bookings/new"
                element={
                  <ProtectedRoute allowedRoles={['field_owner', 'admin']} redirectTo="/owner/bookings">
                    <CreateBookingPage />
                  </ProtectedRoute>
                }
              />
              <Route path="league" element={<LeaguePage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route
                path="teams/create"
                element={
                  <ProtectedRoute allowedRoles={['field_owner', 'admin']} redirectTo="/owner/teams">
                    <TeamCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="open-matches"
                element={
                  <ProtectedRoute allowedRoles={['field_owner', 'admin']} redirectTo="/owner/dashboard">
                    <OpenMatchesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="matches" element={<OwnerMatchesPage />} />
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
