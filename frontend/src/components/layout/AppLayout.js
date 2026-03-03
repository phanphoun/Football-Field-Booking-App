import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon, 
  UserCircleIcon,
  BellAlertIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import apiService from '../../services/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const AppLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/app/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/app/dashboard'
    },
    {
      name: 'Fields',
      href: '/app/fields',
      icon: BuildingOfficeIcon,
      current: location.pathname.startsWith('/app/fields')
    },
    {
      name: 'League',
      href: '/app/league',
      icon: TrophyIcon,
      current: location.pathname.startsWith('/app/league')
    },
    {
      name: 'Teams',
      href: '/app/teams',
      icon: UsersIcon,
      current: location.pathname.startsWith('/app/teams')
    },
    {
      name: 'Bookings',
      href: '/app/bookings',
      icon: CalendarIcon,
      current: location.pathname.startsWith('/app/bookings')
    },
    {
      name: 'Profile',
      href: '/app/profile',
      icon: UserCircleIcon,
      current: location.pathname === '/app/profile'
    }
  ];

  const adminNavigation = [
    {
      name: 'Manage Users',
      href: '/app/admin/users',
      icon: UsersIcon,
      current: location.pathname === '/app/admin/users'
    },
    {
      name: 'Settings',
      href: '/app/admin/settings',
      icon: HomeIcon,
      current: location.pathname === '/app/admin/settings'
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
    return colors[role] || colors.player;
  };

  const formatRole = (role) => {
    return role ? role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Player';
  };

  const resolveAvatarUrl = () => {
    const rawAvatar = user?.avatarUrl || user?.avatar_url;
    if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
    return `${API_ORIGIN}${normalizedPath}`;
  };

  useEffect(() => {
    const loadUnreadNotifications = async () => {
      try {
        const response = await apiService.get('/notifications', { isRead: false });
        const list = Array.isArray(response.data) ? response.data : [];
        setUnreadNotifications(list.length);
      } catch {
        setUnreadNotifications(0);
      }
    };

    loadUnreadNotifications();
    const interval = setInterval(loadUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-gray-900">Football Booking</h1>
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
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
            
            {/* Admin navigation */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-red-100 text-red-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        item.current ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}
              </>
            )}


          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg font-semibold text-gray-900">Football Booking</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
            
            {/* Admin navigation */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-red-100 text-red-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        item.current ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}
              </>
            )}


          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 md:hidden"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="ml-auto flex items-center space-x-4">
              {/* Notifications button on left of user/logout */}
              <button
                onClick={() => navigate('/app/notifications')}
                className="relative p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                aria-label="Notifications"
              >
                <BellAlertIcon className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* User menu */}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserRoleColor(user?.role)}`}>
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
                        to="/app/profile"
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

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
