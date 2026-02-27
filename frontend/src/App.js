<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/frontend/src/App.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/frontend/src/App.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/frontend/src/App.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/frontend/src/App.js
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
        <header className="text-center">
          <img src={logo} className="w-24 h-24 mx-auto mb-4 animate-spin" alt="logo" />
          <p className="text-gray-700 mb-6">
            Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.js</code> and save to reload.
          </p>
          <a
            className="text-blue-500 hover:text-blue-700 font-semibold underline"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    </div>
  );
}

export default App;
=======
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/frontend/src/App.js
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/frontend/src/App.js
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

// Import pages (we'll create these next)
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FieldsPage from './pages/FieldsPage';
import TeamsPage from './pages/TeamsPage';
import BookingsPage from './pages/BookingsPage';
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
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/frontend/src/App.js
