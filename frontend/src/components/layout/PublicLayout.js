import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui';

const PublicLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref = user?.role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = useMemo(
    () => [
      { to: '/', label: 'Home' },
      { to: '/fields', label: 'Fields' },
      { to: '/teams', label: 'Teams' }
    ],
    []
  );

  const isActivePath = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <span className="h-8 w-8 rounded-lg bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                FB
              </span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">Football Booking</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-gray-700">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-md hover:text-gray-900 hover:bg-gray-100 ${
                    isActivePath(item.to) ? 'text-gray-900 bg-gray-100' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-gray-100 text-gray-700"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>

              {isAuthenticated ? (
                <>
                  <Button as={Link} to={dashboardHref} variant="outline" size="sm" className="hidden sm:inline-flex">
                    Go to Dashboard
                  </Button>
                  <Button onClick={handleLogout} size="sm" className="hidden sm:inline-flex">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
                    Login
                  </Button>
                  <Button as={Link} to="/register" size="sm" className="hidden sm:inline-flex">
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4">
              <div className="pt-2 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActivePath(item.to) ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="pt-3 flex gap-2">
                {isAuthenticated ? (
                  <>
                    <Button as={Link} to={dashboardHref} variant="outline" size="sm" className="flex-1">
                      Dashboard
                    </Button>
                    <Button onClick={handleLogout} size="sm" className="flex-1">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button as={Link} to="/login" variant="outline" size="sm" className="flex-1">
                      Login
                    </Button>
                    <Button as={Link} to="/register" size="sm" className="flex-1">
                      Register
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
