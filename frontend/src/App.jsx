import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Fields from './pages/Fields';
import FieldDetails from './pages/FieldDetails';
import Bookings from './pages/Bookings';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import Matchmaking from './pages/Matchmaking';
import LeagueMatches from './pages/LeagueMatches';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fields" element={<Fields />} />
            <Route path="/fields/:id" element={<FieldDetails />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<TeamDetails />} />
            <Route path="/matchmaking" element={<Matchmaking />} />
            <Route path="/leagues" element={<LeagueMatches />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
