import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/AdminDashboard';
import PlayerDashboard from './pages/PlayerDashboard';
import FieldOwnerDashboard from './pages/FieldOwnerDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/player-dashboard" element={<PlayerDashboard />} />
        <Route path="/field-owner-dashboard" element={<FieldOwnerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
