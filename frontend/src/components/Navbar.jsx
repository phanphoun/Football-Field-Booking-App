import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy, MapPin, Users, Calendar, Zap, User, LogOut } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // TODO: Connect to auth context
    const location = useLocation();

    const toggleMenu = () => setIsOpen(!isOpen);

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/', label: 'Home', icon: Trophy },
        { path: '/fields', label: 'Fields', icon: MapPin },
        { path: '/teams', label: 'Teams', icon: Users },
        { path: '/matchmaking', label: 'Matchmaking', icon: Zap },
        { path: '/bookings', label: 'My Bookings', icon: Calendar },
        { path: '/leagues', label: 'Leagues', icon: Trophy },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-container container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <Trophy size={32} />
                    </div>
                    <div className="logo-text">
                        <span className="logo-title">FieldBook</span>
                        <span className="logo-subtitle">Cambodia</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-menu">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Auth Buttons */}
                <div className="navbar-actions">
                    {isLoggedIn ? (
                        <>
                            <Link to="/profile" className="btn btn-ghost btn-sm">
                                <User size={18} />
                                <span>Profile</span>
                            </Link>
                            <button className="btn btn-outline btn-sm" onClick={() => setIsLoggedIn(false)}>
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost btn-sm">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button className="navbar-toggle" onClick={toggleMenu}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`navbar-mobile ${isOpen ? 'open' : ''}`}>
                <div className="navbar-mobile-menu">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link-mobile ${isActive(link.path) ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <Icon size={20} />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
                <div className="navbar-mobile-actions">
                    {isLoggedIn ? (
                        <>
                            <Link to="/profile" className="btn btn-ghost" onClick={() => setIsOpen(false)}>
                                <User size={18} />
                                <span>Profile</span>
                            </Link>
                            <button className="btn btn-outline" onClick={() => { setIsLoggedIn(false); setIsOpen(false); }}>
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost" onClick={() => setIsOpen(false)}>
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary" onClick={() => setIsOpen(false)}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
