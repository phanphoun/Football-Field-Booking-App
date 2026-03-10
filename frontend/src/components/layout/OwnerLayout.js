import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  TrophyIcon,
  UserCircleIcon,
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  InboxIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const OwnerLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flash, setFlash] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationActionLoading, setNotificationActionLoading] = useState(false);
  const notificationsMenuRef = useRef(null);

  const pageInfo = useMemo(() => {
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

  const userDisplayName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'User';
  const profileItem = {
    name: 'Profile',
    href: '/owner/profile',
    icon: UserCircleIcon,
    current: location.pathname === '/owner/profile'
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
    }
  ];

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

  const parseMetadata = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  const resolveNotificationSenderName = (notification) => {
    return notification?.sender?.name || notification?.sender?.username || 'Unknown user';
  };

  const resolveNotificationSenderAvatar = (notification) => {
    const rawAvatar = notification?.sender?.avatarUrl;
    if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
    return `${API_ORIGIN}${normalizedPath}`;
  };

  const latestNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const response = await apiService.get('/notifications');
      const list = Array.isArray(response.data) ? response.data : [];
      const normalized = list.map((item) => ({
        ...item,
        metadata: parseMetadata(item.metadata)
      }));
      setNotifications(normalized);
      setUnreadNotifications(normalized.filter((item) => !item.isRead).length);
    } catch {
      setNotifications([]);
      setUnreadNotifications(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const markNotificationRead = async (notificationId) => {
    await apiService.put(`/notifications/${notificationId}`, {
      isRead: true,
      readAt: new Date().toISOString()
    });
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setNotificationActionLoading(true);
      await markNotificationRead(notificationId);
      await loadNotifications();
    } finally {
      setNotificationActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotificationActionLoading(true);
      const unread = latestNotifications.filter((item) => !item.isRead);
      if (unread.length === 0) return;
      await Promise.all(unread.map((item) => markNotificationRead(item.id)));
      await loadNotifications();
    } finally {
      setNotificationActionLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification || notificationActionLoading) return;

    try {
      if (!notification.isRead) {
        setNotificationActionLoading(true);
        await markNotificationRead(notification.id);
        await loadNotifications();
      }
    } finally {
      setNotificationActionLoading(false);
      setNotificationsMenuOpen(false);
    }

    if (notification.metadata?.bookingId || notification.type === 'booking') {
      navigate('/owner/bookings');
      return;
    }

    navigate('/owner/dashboard');
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, loadNotifications]);

  useEffect(() => {
    if (!notificationsMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notificationsMenuRef.current?.contains(event.target)) {
        setNotificationsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setNotificationsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [notificationsMenuOpen]);

  useEffect(() => {
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
          <div className="flex flex-1 flex-col overflow-y-auto">
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

            <div className="border-t border-gray-200 p-3">
              <Link
                to={profileItem.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                  profileItem.current
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <img
                  src={resolveAvatarUrl()}
                  alt={`${userDisplayName} avatar`}
                  className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-gray-100"
                  onError={(e) => {
                    const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{userDisplayName}</p>
                  <p className="text-xs text-gray-500 truncate">{formatRole(user?.role)}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-lg font-semibold text-gray-900">Owner Panel</h1>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
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

            <div className="border-t border-gray-200 p-3">
              <Link
                to={profileItem.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                  profileItem.current
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <img
                  src={resolveAvatarUrl()}
                  alt={`${userDisplayName} avatar`}
                  className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-gray-100"
                  onError={(e) => {
                    const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{userDisplayName}</p>
                  <p className="text-xs text-gray-500 truncate">{formatRole(user?.role)}</p>
                </div>
              </Link>
            </div>
          </div>
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

            <div className="ml-3 min-w-0 md:ml-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{pageInfo.title}</p>
              <p className="hidden truncate text-xs text-gray-500 sm:block">
                {pageInfo.subtitle}
                {user?.firstName ? ` | Welcome back, ${user.firstName}` : ''}
              </p>
            </div>

            <div className="ml-auto flex items-center space-x-4">
              <div className="relative" ref={notificationsMenuRef}>
                <button
                  onClick={() => setNotificationsMenuOpen((prev) => !prev)}
                  className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Notifications"
                  aria-expanded={notificationsMenuOpen}
                  aria-haspopup="menu"
                >
                  <BellAlertIcon className="h-6 w-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {notificationsMenuOpen && (
                  <div className="absolute right-0 top-full z-30 w-[min(92vw,380px)] pt-2">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                        <button
                          onClick={handleMarkAllAsRead}
                          disabled={notificationActionLoading || unreadNotifications === 0}
                          className="text-xs font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="px-4 py-8 text-center text-sm text-gray-500">Loading...</div>
                        ) : latestNotifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <InboxIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                            <p className="text-sm text-gray-500">No notifications yet.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {latestNotifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`cursor-pointer px-4 py-3 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${notification.isRead ? 'bg-white' : 'bg-blue-50/40'}`}
                                onClick={() => handleNotificationClick(notification)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleNotificationClick(notification);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                      <ClipboardDocumentCheckIcon className="h-4 w-4 text-blue-500" />
                                      <span className="truncate">{notification.title}</span>
                                    </p>
                                    <p
                                      className="mt-1 overflow-hidden text-xs text-gray-600"
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                      }}
                                    >
                                      {notification.message}
                                    </p>
                                    {notification.sender && (
                                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1">
                                        <img
                                          src={resolveNotificationSenderAvatar(notification)}
                                          alt={`${resolveNotificationSenderName(notification)} avatar`}
                                          className="h-4 w-4 rounded-full border border-gray-200 bg-gray-100 object-cover"
                                          onError={(e) => {
                                            const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                                            if (e.currentTarget.src !== fallbackUrl) {
                                              e.currentTarget.src = fallbackUrl;
                                            }
                                          }}
                                        />
                                        <span className="text-[10px] text-gray-700">
                                          {resolveNotificationSenderName(notification)}
                                        </span>
                                      </div>
                                    )}
                                    <p className="mt-1 text-[11px] text-gray-400">
                                      {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  {!notification.isRead && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                      New
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>
                                  {(notification.metadata?.bookingId || notification.type === 'booking') && (
                                    <button
                                      onClick={() => navigate('/owner/bookings')}
                                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      <EyeIcon className="h-3.5 w-3.5" />
                                      Open Booking
                                    </button>
                                  )}

                                  {!notification.isRead && (
                                    <button
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      disabled={notificationActionLoading}
                                      className="inline-flex items-center rounded-md border border-blue-200 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                                    >
                                      Mark read
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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

