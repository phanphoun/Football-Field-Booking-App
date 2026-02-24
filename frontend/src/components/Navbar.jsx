import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Menu, X, LogOut, Home, Calendar, Users, Trophy, Settings } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const getNavItems = () => {
    if (!user) {
      return [
        { path: '/', label: 'Home', icon: Home },
        { path: '/fields', label: 'Fields', icon: Calendar },
        { path: '/login', label: 'Login', icon: User },
        { path: '/register', label: 'Register', icon: User },
      ];
    }

    const baseItems = [
      { path: '/', label: 'Home', icon: Home },
      { path: '/fields', label: 'Fields', icon: Calendar },
      { path: '/bookings', label: 'My Bookings', icon: Calendar },
      { path: '/teams', label: 'Teams', icon: Users },
      { path: '/matchmaking', label: 'Matchmaking', icon: Trophy },
    ];

    const roleSpecificItems = [];
    
    if (user.role === 'field_owner') {
      roleSpecificItems.push({ path: '/field-owner-dashboard', label: 'My Fields', icon: Settings });
    } else if (user.role === 'team_captain') {
      roleSpecificItems.push({ path: '/captain-dashboard', label: 'Captain Dashboard', icon: Settings });
    }

    roleSpecificItems.push({ path: '/profile', label: 'Profile', icon: User });

    return [...baseItems, ...roleSpecificItems];
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FB</span>
              </div>
              <span className="font-bold text-xl text-gray-900">FieldBook Cambodia</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
              
              {user && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut size={18} />
                    <span>Logout</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
