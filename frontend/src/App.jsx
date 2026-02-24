import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { authService } from './services/api';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Fields from './pages/Fields';
import FieldDetails from './pages/FieldDetails';
import Bookings from './pages/Bookings';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import Matchmaking from './pages/Matchmaking';
import Profile from './pages/Profile';
import FieldOwnerDashboard from './pages/FieldOwnerDashboard';
import CaptainDashboard from './pages/CaptainDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Protected Route wrapper
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (requiredRole && user.role !== requiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  };

  // Guest Route wrapper
  const GuestRoute = ({ children }) => {
    if (user) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/fields" element={<Fields />} />
            <Route path="/fields/:id" element={<FieldDetails />} />
            
            {/* Guest Routes */}
            <Route path="/login" element={
              <GuestRoute>
                <Login onLogin={handleLogin} />
              </GuestRoute>
            } />
            <Route path="/register" element={
              <GuestRoute>
                <Register onLogin={handleLogin} />
              </GuestRoute>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard user={user} />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile user={user} />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <Bookings user={user} />
              </ProtectedRoute>
            } />
            <Route path="/teams" element={
              <ProtectedRoute>
                <Teams user={user} />
              </ProtectedRoute>
            } />
            <Route path="/teams/:id" element={
              <ProtectedRoute>
                <TeamDetails user={user} />
              </ProtectedRoute>
            } />
            <Route path="/matchmaking" element={
              <ProtectedRoute>
                <Matchmaking user={user} />
              </ProtectedRoute>
            } />

            {/* Role-Specific Routes */}
            <Route path="/field-owner-dashboard" element={
              <ProtectedRoute requiredRole="field_owner">
                <FieldOwnerDashboard user={user} />
              </ProtectedRoute>
            } />
            <Route path="/captain-dashboard" element={
              <ProtectedRoute requiredRole="team_captain">
                <CaptainDashboard user={user} />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
