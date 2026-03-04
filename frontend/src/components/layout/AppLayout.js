import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon, 
  UserCircleIcon,
  BellAlertIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  InboxIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import teamService from '../../services/teamService';
import bookingService from '../../services/bookingService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const AppLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationActionLoading, setNotificationActionLoading] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [flash, setFlash] = useState(null);

  const handleLogout = () => {
    const confirmed = window.confirm('Do you want to logout?');
    if (!confirmed) return;
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
    ...(user?.role === 'captain'
      ? [
          {
            name: 'Open Matches',
            href: '/app/open-matches',
            icon: UsersIcon,
            current: location.pathname.startsWith('/app/open-matches')
          }
        ]
      : []),
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

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, loadNotifications]);

  const markNotificationRead = async (notificationId) => {
    await apiService.put(`/notifications/${notificationId}`, {
      isRead: true,
      readAt: new Date().toISOString()
    });
  };

  const canRespondToInvite = (notification) => {
    return (
      !notification?.isRead &&
      notification?.type === 'team_invite'
    );
  };

  const canRespondToLeaveRequest = (notification) => {
    const title = String(notification?.title || '').toLowerCase();
    return (
      !notification?.isRead &&
      (
        notification?.metadata?.event === 'team_leave_request' ||
        title.startsWith('leave request for ')
      )
    );
  };

  const canRespondToJoinRequest = (notification) => {
    return !notification?.isRead && notification?.metadata?.event === 'team_join_request';
  };

  const canRespondToBookingJoinRequest = (notification) => {
    const eventName = notification?.metadata?.event;
    return (
      !notification?.isRead &&
      (eventName === 'booking_join_request' || eventName === 'open_match_join_request') &&
      !!notification?.metadata?.bookingId &&
      !!notification?.metadata?.requestId
    );
  };

  const extractLeaveRequestTeamName = (notification) => {
    const title = String(notification?.title || '');
    const titlePrefix = 'Leave request for ';
    if (title.startsWith(titlePrefix)) {
      return title.slice(titlePrefix.length).trim().toLowerCase();
    }
    const message = String(notification?.message || '');
    const quoted = message.match(/"([^"]+)"/);
    if (quoted?.[1]) return quoted[1].trim().toLowerCase();
    return '';
  };

  const extractLeaveRequesterName = (notification) => {
    const message = String(notification?.message || '');
    const match = message.match(/^(.*?)\s+requested to leave/i);
    return match?.[1]?.trim().toLowerCase() || '';
  };

  const resolveLeaveRequestContext = async (notification) => {
    let teamId = notification?.metadata?.teamId || null;
    let requesterId = notification?.metadata?.requesterId || notification?.sender?.id || null;

    if (!teamId) {
      const captainedRes = await teamService.getCaptainedTeams();
      const captainedTeams = Array.isArray(captainedRes?.data) ? captainedRes.data : [];
      const teamName = extractLeaveRequestTeamName(notification);
      const byName = teamName
        ? captainedTeams.find((team) => String(team?.name || '').trim().toLowerCase() === teamName)
        : null;
      teamId = byName?.id || (captainedTeams.length === 1 ? captainedTeams[0]?.id : null);
    }

    if (!requesterId && teamId) {
      const membersRes = await teamService.getTeamMembers(teamId);
      const members = Array.isArray(membersRes?.data) ? membersRes.data : [];
      const senderName = String(resolveNotificationSenderName(notification) || '').trim().toLowerCase();
      const requesterName = extractLeaveRequesterName(notification);
      const byName = members.find((member) => {
        const userData = member?.user || {};
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim().toLowerCase();
        const username = String(userData.username || '').trim().toLowerCase();
        return (
          (senderName && (fullName === senderName || username === senderName)) ||
          (requesterName && (fullName === requesterName || username === requesterName))
        );
      });
      requesterId = byName?.userId || byName?.user?.id || null;
    }

    return { teamId, requesterId };
  };

  const extractJoinRequestTeamName = (notification) => {
    const title = String(notification?.title || '');
    const titlePrefix = 'Join request for ';
    if (title.startsWith(titlePrefix)) {
      return title.slice(titlePrefix.length).trim().toLowerCase();
    }
    const message = String(notification?.message || '');
    const quoted = message.match(/"([^"]+)"/);
    if (quoted?.[1]) return quoted[1].trim().toLowerCase();
    return '';
  };

  const extractJoinRequesterName = (notification) => {
    const message = String(notification?.message || '');
    const match = message.match(/^(.*?)\s+requested to join/i);
    return match?.[1]?.trim().toLowerCase() || '';
  };

  const resolveJoinRequestContext = async (notification) => {
    let teamId = notification?.metadata?.teamId || null;
    let requesterId = notification?.metadata?.requesterId || notification?.sender?.id || null;

    if (!teamId) {
      const captainedRes = await teamService.getCaptainedTeams();
      const captainedTeams = Array.isArray(captainedRes?.data) ? captainedRes.data : [];
      const teamName = extractJoinRequestTeamName(notification);
      const byName = teamName
        ? captainedTeams.find((team) => String(team?.name || '').trim().toLowerCase() === teamName)
        : null;
      teamId = byName?.id || (captainedTeams.length === 1 ? captainedTeams[0]?.id : null);
    }

    if (!requesterId && teamId) {
      const membersRes = await teamService.getTeamMembers(teamId);
      const members = Array.isArray(membersRes?.data) ? membersRes.data : [];
      const senderName = String(resolveNotificationSenderName(notification) || '').trim().toLowerCase();
      const requesterName = extractJoinRequesterName(notification);
      const byName = members.find((member) => {
        if (member?.status !== 'pending') return false;
        const userData = member?.user || {};
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim().toLowerCase();
        const username = String(userData.username || '').trim().toLowerCase();
        return (
          (senderName && (fullName === senderName || username === senderName)) ||
          (requesterName && (fullName === requesterName || username === requesterName))
        );
      });
      requesterId = byName?.userId || byName?.user?.id || null;
    }

    return { teamId, requesterId };
  };

  const extractTeamNameFromNotification = (notification) => {
    const title = notification?.title || '';
    const titlePrefix = 'Invitation to join ';
    if (title.startsWith(titlePrefix)) {
      return title.slice(titlePrefix.length).trim().toLowerCase();
    }

    const message = notification?.message || '';
    const quoted = message.match(/"([^"]+)"/);
    if (quoted?.[1]) return quoted[1].trim().toLowerCase();
    return '';
  };

  const resolveInviteTeamId = async (notification) => {
    if (notification?.metadata?.teamId) return notification.metadata.teamId;

    const invitationsResponse = await teamService.getMyInvitations();
    const invitations = Array.isArray(invitationsResponse?.data) ? invitationsResponse.data : [];
    if (invitations.length === 0) return null;

    const targetTeamName = extractTeamNameFromNotification(notification);
    const inviterId = notification?.metadata?.inviterId;

    const byName = targetTeamName
      ? invitations.find((team) => (team?.name || '').trim().toLowerCase() === targetTeamName)
      : null;
    if (byName?.id) return byName.id;

    const byInviter = inviterId
      ? invitations.find((team) => Number(team?.captain?.id) === Number(inviterId))
      : null;
    if (byInviter?.id) return byInviter.id;

    if (invitations.length === 1 && invitations[0]?.id) return invitations[0].id;
    return null;
  };

  const handleInviteAction = async (notification, action) => {
    try {
      setNotificationActionLoading(true);
      const teamId = await resolveInviteTeamId(notification);
      if (!teamId) return;
      if (action === 'accept') {
        await teamService.acceptInvite(teamId);
      } else {
        await teamService.declineInvite(teamId);
      }
      await markNotificationRead(notification.id);
      await loadNotifications();
    } finally {
      setNotificationActionLoading(false);
    }
  };

  const handleLeaveRequestAction = async (notification, action) => {
    try {
      setNotificationActionLoading(true);
      const { teamId, requesterId } = await resolveLeaveRequestContext(notification);
      if (!teamId || !requesterId) return;
      await teamService.respondLeaveRequest(teamId, requesterId, action);
      await markNotificationRead(notification.id);
      await loadNotifications();
    } finally {
      setNotificationActionLoading(false);
    }
  };

  const handleJoinRequestAction = async (notification, action) => {
    try {
      setNotificationActionLoading(true);
      const { teamId, requesterId } = await resolveJoinRequestContext(notification);
      if (!teamId || !requesterId) return;
      await teamService.updateMember(teamId, requesterId, {
        status: action === 'accept' ? 'active' : 'inactive'
      });
      await markNotificationRead(notification.id);
      await loadNotifications();
    } catch (err) {
      setFlash({
        type: 'error',
        message: err?.error || 'Failed to process join request'
      });
    } finally {
      setNotificationActionLoading(false);
    }
  };

  const handleBookingJoinRequestAction = async (notification, action) => {
    try {
      setNotificationActionLoading(true);
      const bookingId = notification?.metadata?.bookingId;
      const requestId = notification?.metadata?.requestId;
      if (!bookingId || !requestId) return;
      await bookingService.respondToJoinRequest(bookingId, requestId, action === 'accept' ? 'accept' : 'reject');
      await markNotificationRead(notification.id);
      await loadNotifications();
    } catch (err) {
      setFlash({
        type: 'error',
        message: err?.error || 'Failed to process opponent join request'
      });
    } finally {
      setNotificationActionLoading(false);
    }
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
              {/* Notifications dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setNotificationsMenuOpen(true)}
                onMouseLeave={() => setNotificationsMenuOpen(false)}
              >
                <button
                  onClick={() => setNotificationsMenuOpen((prev) => !prev)}
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

                {notificationsMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 z-30 w-[min(92vw,380px)]">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                        <button
                          onClick={() => navigate('/app/notifications')}
                          className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                        >
                          View all
                        </button>
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="px-4 py-8 text-center text-sm text-gray-500">Loading...</div>
                        ) : latestNotifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <InboxIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No notifications yet.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {latestNotifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 ${notification.isRead ? 'bg-white' : 'bg-emerald-50/40'}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5">
                                      {notification.type === 'team_invite' ? (
                                        <BellAlertIcon className="h-4 w-4 text-amber-500" />
                                      ) : (
                                        <ClipboardDocumentCheckIcon className="h-4 w-4 text-blue-500" />
                                      )}
                                      <span className="truncate">{notification.title}</span>
                                    </p>
                                    <p
                                      className="mt-1 text-xs text-gray-600 overflow-hidden"
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
                                          className="h-4 w-4 rounded-full object-cover border border-gray-200 bg-gray-100"
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
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                      New
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {canRespondToInvite(notification) && (
                                    <>
                                      <button
                                        onClick={() => handleInviteAction(notification, 'accept')}
                                        disabled={notificationActionLoading}
                                        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                      >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleInviteAction(notification, 'decline')}
                                        disabled={notificationActionLoading}
                                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                      >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {canRespondToLeaveRequest(notification) && (
                                    <>
                                      <button
                                        onClick={() => handleLeaveRequestAction(notification, 'accept')}
                                        disabled={notificationActionLoading}
                                        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                      >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        Approve Leave
                                      </button>
                                      <button
                                        onClick={() => handleLeaveRequestAction(notification, 'decline')}
                                        disabled={notificationActionLoading}
                                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                      >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {canRespondToJoinRequest(notification) && (
                                    <>
                                      <button
                                        onClick={() => handleJoinRequestAction(notification, 'accept')}
                                        disabled={notificationActionLoading}
                                        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                      >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        Approve Join
                                      </button>
                                      <button
                                        onClick={() => handleJoinRequestAction(notification, 'decline')}
                                        disabled={notificationActionLoading}
                                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                      >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {canRespondToBookingJoinRequest(notification) && (
                                    <>
                                      <button
                                        onClick={() => handleBookingJoinRequestAction(notification, 'accept')}
                                        disabled={notificationActionLoading}
                                        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                      >
                                        <CheckIcon className="h-3.5 w-3.5" />
                                        Approve Join
                                      </button>
                                      <button
                                        onClick={() => handleBookingJoinRequestAction(notification, 'decline')}
                                        disabled={notificationActionLoading}
                                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                      >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {notification.metadata?.teamId && (
                                    <button
                                      onClick={() => navigate(`/app/teams/${notification.metadata.teamId}`)}
                                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      <EyeIcon className="h-3.5 w-3.5" />
                                      View Team
                                    </button>
                                  )}

                                  {!notification.isRead && (
                                    <button
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      disabled={notificationActionLoading}
                                      className="inline-flex items-center rounded-md border border-emerald-200 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
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

export default AppLayout;
