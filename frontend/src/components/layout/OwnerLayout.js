import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  TrophyIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [flash, setFlash] = useState(null);

  const pageInfo = React.useMemo(() => {
    const path = location.pathname;
    const entries = [
      { match: '/owner/dashboard', title: 'Owner Dashboard', subtitle: 'Track field performance and booking flow' },
      { match: '/owner/fields', title: 'My Fields', subtitle: 'Create, update, and manage your fields' },
      { match: '/owner/bookings', title: 'Booking Requests', subtitle: 'Confirm or cancel incoming booking requests' },
      { match: '/owner/matches', title: 'Matches', subtitle: 'View team vs team matches and enter final results' },
      { match: '/owner/profile', title: 'Profile', subtitle: 'Manage your owner account settings' }
    ];
    const current = entries.find((entry) => path.startsWith(entry.match));
    return current || { title: 'Owner Panel', subtitle: 'Manage your field business' };
  }, [location.pathname]);

  const handleLogout = () => {
    const confirmed = window.confirm('Do you want to logout?');
    if (!confirmed) return;
    logout();
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/owner/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/owner/dashboard'
    },
    {
      name: 'My Fields',
      href: '/owner/fields',
      icon: BuildingOfficeIcon,
      current: location.pathname.startsWith('/owner/fields')
    },
    {
      name: 'Booking Requests',
      href: '/owner/bookings',
      icon: CalendarIcon,
      current: location.pathname.startsWith('/owner/bookings')
    },
    {
      name: 'Matches',
      href: '/owner/matches',
      icon: TrophyIcon,
      current: location.pathname.startsWith('/owner/matches')
    },
    {
      name: 'Profile',
      href: '/owner/profile',
      icon: UserCircleIcon,
      current: location.pathname === '/owner/profile'
    }
  ];

  const getUserRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      field_owner: 'bg-blue-100 text-blue-800',
      captain: 'bg-green-100 text-green-800',
      player: 'bg-gray-100 text-gray-800',
      guest: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || colors.field_owner;
  };

  const formatRole = (role) => {
    return role ? role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Field Owner';
  };

  const resolveAvatarUrl = () => {
    const rawAvatar = user?.avatarUrl || user?.avatar_url;
    if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
    return `${API_ORIGIN}${normalizedPath}`;
  };

  React.useEffect(() => {
    const successMessage = location.state?.successMessage;
    const errorMessage = location.state?.errorMessage;

    if (!successMessage && !errorMessage) return;

    setFlash({
      type: successMessage ? 'success' : 'error',
      message: successMessage || errorMessage
    });

    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: {}
    });
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-gray-900">Owner Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg font-semibold text-gray-900">Owner Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 md:hidden"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="ml-3 min-w-0 md:hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{pageInfo.title}</p>
              <p className="text-xs text-gray-500 truncate hidden sm:block">
                {pageInfo.subtitle}
                {user?.firstName ? ` | Welcome back, ${user.firstName}` : ''}
              </p>
            </div>

            <div className="flex items-center space-x-4 ml-auto">
              <div
                className="relative"
                onMouseEnter={() => setProfileMenuOpen(true)}
                onMouseLeave={() => setProfileMenuOpen(false)}
              >
                <button
                  type="button"
                  className="flex items-center space-x-3 rounded-md px-2 py-1 hover:bg-gray-50"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserRoleColor(
                      user?.role
                    )}`}
                  >
                    {formatRole(user?.role)}
                  </span>
                </div>
                <img
                  src={resolveAvatarUrl()}
                  alt={`${user?.firstName || user?.username || 'User'} avatar`}
                  className="h-8 w-8 rounded-full object-cover border border-gray-200 bg-gray-100"
                  onError={(e) => {
                    const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 z-20">
                    <div className="w-44 rounded-md border border-gray-200 bg-white shadow-lg py-1">
                      <Link
                        to="/owner/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                      >
                        <UserCircleIcon className="h-4 w-4" />
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {flash && (
                <div
                  className={`mb-4 px-4 py-3 rounded-md text-sm border ${
                    flash.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{flash.message}</span>
                    <button
                      type="button"
                      onClick={() => setFlash(null)}
                      className="text-xs font-medium underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;

