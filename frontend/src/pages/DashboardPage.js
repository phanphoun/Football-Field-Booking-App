import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import authService from '../services/authService';
import bookingService from '../services/bookingService';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';
import userService from '../services/userService';
import {
  BellAlertIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';

const statusTone = (status) => {
  const tones = { pending: 'yellow', confirmed: 'green', cancellation_pending: 'orange', completed: 'blue', cancelled: 'red' };
  return tones[status] || 'gray';
};

const roleTheme = {
  captain: {
    badge: 'Captain Overview',
    description: 'Manage your teams, approve join requests, and keep bookings under control.',
    accent: 'from-emerald-50 via-white to-blue-50'
  },
  player: {
    badge: 'Player Overview',
    description: 'Track invitations, team activity, and your next bookings in one place.',
    accent: 'from-blue-50 via-white to-violet-50'
  },
  admin: {
    badge: 'Platform Overview',
    description: 'Review account activity, role requests, and the latest bookings across the app.',
    accent: 'from-slate-50 via-white to-amber-50'
  },
  unknown: {
    badge: 'Account Overview',
    description: 'Review your latest activity and updates.',
    accent: 'from-slate-50 via-white to-slate-100'
  }
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;
  const canCreateBooking = role === 'captain';

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminRoleRequests, setAdminRoleRequests] = useState([]);
  const [captainedTeams, setCaptainedTeams] = useState([]);
  const [joinRequestsByTeam, setJoinRequestsByTeam] = useState([]);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!role) {
          setStats({ role: 'unknown', fields: 0, teams: 0, bookings: 0, activeBookings: 0 });
          setBookings([]);
          setMyTeams([]);
          setUsers([]);
          setAdminRoleRequests([]);
          setCaptainedTeams([]);
          setJoinRequestsByTeam([]);
          return;
        }

        const [statsRes, bookingsRes, myTeamsRes, captainedRes, fieldsRes, notificationsRes, usersRes, adminRequestsRes] =
          await Promise.all([
            apiService.get('/dashboard/stats'),
            bookingService.getAllBookings({ limit: 50 }),
            role === 'player' || role === 'captain' ? teamService.getMyTeams() : Promise.resolve({ data: [] }),
            role === 'captain' ? teamService.getCaptainedTeams() : Promise.resolve({ data: [] }),
            fieldService.getAllFields({ limit: 50, status: 'available' }),
            apiService.get('/notifications'),
            role === 'admin' ? userService.getAllUsers() : Promise.resolve({ data: [] }),
            role === 'admin' ? authService.getAdminRoleRequests('') : Promise.resolve({ data: { requests: [] } })
          ]);

        const statsData = statsRes.data && typeof statsRes.data === 'object' ? statsRes.data : {};
        const bookingData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const myTeamsData = Array.isArray(myTeamsRes.data) ? myTeamsRes.data : [];
        const captainedData = Array.isArray(captainedRes.data) ? captainedRes.data : [];
        const fieldsData = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];
        const notificationsData = Array.isArray(notificationsRes.data) ? notificationsRes.data : [];
        const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
        const adminRequestsData = Array.isArray(adminRequestsRes.data?.requests) ? adminRequestsRes.data.requests : [];

        setStats({
          role,
          ...statsData,
          fields: statsData.fields ?? fieldsData.length
        });
        setBookings(bookingData);
        setMyTeams(myTeamsData);
        setUsers(usersData);
        setNotifications(notificationsData);
        setAdminRoleRequests(adminRequestsData);
        setCaptainedTeams(captainedData);

        if (role === 'captain') {
          const requests = await Promise.all(
            captainedData.map(async (team) => {
              const response = await teamService.getJoinRequests(team.id);
              const pending = Array.isArray(response.data) ? response.data : [];
              return { teamId: team.id, teamName: team.name, pendingCount: pending.length };
            })
          );
          setJoinRequestsByTeam(requests.filter((item) => item.pendingCount > 0).sort((a, b) => b.pendingCount - a.pendingCount));
        } else {
          setJoinRequestsByTeam([]);
        }
      } catch (err) {
        setError(err?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [role]);

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((booking) => booking?.startTime && (booking.status === 'pending' || booking.status === 'confirmed'))
      .filter((booking) => new Date(booking.startTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [bookings]);

  const statCards = useMemo(() => {
    if (role === 'captain') {
      const pendingJoinRequests =
        stats?.pendingJoinRequests ?? joinRequestsByTeam.reduce((sum, item) => sum + item.pendingCount, 0);

      return [
        {
          name: 'Captained Teams',
          value: captainedTeams.length,
          icon: UsersIcon,
          iconWrap: 'bg-emerald-600',
          cardClass: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70',
          textClass: 'text-emerald-950',
          helper: 'Teams under your leadership'
        },
        {
          name: 'Pending Requests',
          value: pendingJoinRequests,
          icon: ClipboardDocumentCheckIcon,
          iconWrap: 'bg-amber-500',
          cardClass: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100/70',
          textClass: 'text-amber-950',
          helper: 'Players waiting for approval'
        },
        {
          name: 'My Bookings',
          value: stats?.bookings ?? bookings.length,
          icon: CalendarIcon,
          iconWrap: 'bg-blue-600',
          cardClass: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/70',
          textClass: 'text-blue-950',
          helper: 'Reservations you created'
        },
        {
          name: 'Fields Available',
          value: stats?.fields ?? 0,
          icon: BuildingOfficeIcon,
          iconWrap: 'bg-cyan-600',
          cardClass: 'border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-cyan-100/70',
          textClass: 'text-cyan-950',
          helper: 'Open venues to book'
        }
      ];
    }

    if (role === 'player') {
      const pendingInvites = notifications.filter((notification) => notification.type === 'team_invite' && !notification.isRead).length;

      return [
        {
          name: 'My Teams',
          value: stats?.teams ?? myTeams.length,
          icon: UsersIcon,
          iconWrap: 'bg-emerald-600',
          cardClass: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70',
          textClass: 'text-emerald-950',
          helper: 'Teams you currently joined'
        },
        {
          name: 'Invitations',
          value: pendingInvites,
          icon: BellAlertIcon,
          iconWrap: 'bg-amber-500',
          cardClass: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100/70',
          textClass: 'text-amber-950',
          helper: 'Unread team invites'
        },
        {
          name: 'My Bookings',
          value: stats?.bookings ?? bookings.length,
          icon: CalendarIcon,
          iconWrap: 'bg-blue-600',
          cardClass: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/70',
          textClass: 'text-blue-950',
          helper: 'Reservations you made'
        },
        {
          name: 'Upcoming',
          value: upcomingBookings.length,
          icon: CalendarIcon,
          iconWrap: 'bg-violet-600',
          cardClass: 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-violet-100/70',
          textClass: 'text-violet-950',
          helper: 'Next items on your schedule'
        }
      ];
    }

    const pendingRoleRequests = adminRoleRequests.filter((request) => request.status === 'pending').length;

    return [
      {
        name: 'Users',
        value: stats?.users ?? 0,
        icon: UserCircleIcon,
        iconWrap: 'bg-indigo-600',
        cardClass: 'border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-indigo-100/70',
        textClass: 'text-indigo-950',
        helper: 'Registered platform accounts'
      },
      {
        name: 'Fields',
        value: stats?.fields ?? 0,
        icon: BuildingOfficeIcon,
        iconWrap: 'bg-blue-600',
        cardClass: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/70',
        textClass: 'text-blue-950',
        helper: 'Published playing venues'
      },
      {
        name: 'Teams',
        value: stats?.teams ?? 0,
        icon: UsersIcon,
        iconWrap: 'bg-emerald-600',
        cardClass: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70',
        textClass: 'text-emerald-950',
        helper: 'Active registered teams'
      },
      {
        name: 'Pending Requests',
        value: pendingRoleRequests,
        icon: ClipboardDocumentCheckIcon,
        iconWrap: 'bg-amber-500',
        cardClass: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100/70',
        textClass: 'text-amber-950',
        helper: 'Access changes awaiting review'
      }
    ];
  }, [
    role,
    stats,
    joinRequestsByTeam,
    captainedTeams.length,
    bookings.length,
    myTeams.length,
    notifications,
    upcomingBookings.length,
    adminRoleRequests
  ]);

  const pendingAdminRoleRequests = useMemo(() => {
    return adminRoleRequests
      .filter((request) => request.status === 'pending')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 5);
  }, [adminRoleRequests]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        if (aTime !== bTime) return bTime - aTime;
        return Number(b.id || 0) - Number(a.id || 0);
      })
      .slice(0, 5);
  }, [users]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.startTime || 0).getTime();
        const bTime = new Date(b.createdAt || b.startTime || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [bookings]);

  const inviteNotifications = useMemo(() => {
    return notifications
      .filter((notification) => notification.type === 'team_invite' && !notification.isRead && notification.metadata?.teamId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [notifications]);

  const markNotificationRead = async (notificationId) => {
    await apiService.put(`/notifications/${notificationId}`, {
      isRead: true,
      readAt: new Date().toISOString()
    });
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      )
    );
  };

  const handleInviteAction = async (notification, action) => {
    const teamId = notification?.metadata?.teamId;
    if (!teamId) return;

    try {
      setInviteActionLoading(true);
      setError(null);
      if (action === 'accept') {
        await teamService.acceptInvite(teamId);
      } else {
        await teamService.declineInvite(teamId);
      }
      await markNotificationRead(notification.id);
      if (action === 'accept') {
        const myTeamsRes = await teamService.getMyTeams();
        setMyTeams(Array.isArray(myTeamsRes.data) ? myTeamsRes.data : []);
      }
    } catch (err) {
      setError(err?.error || `Failed to ${action} invitation`);
    } finally {
      setInviteActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const activeTheme = roleTheme[role] || roleTheme.unknown;

  return (
    <div className="space-y-8">
      <div className={`rounded-[28px] border border-slate-200 bg-gradient-to-br p-6 shadow-sm ${activeTheme.accent}`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-100">
              {activeTheme.badge}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{activeTheme.description}</p>
          </div>
          {role !== 'admin' && (
            <Badge tone="gray" className="capitalize">
              {role || 'user'}
            </Badge>
          )}
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name} className={`overflow-hidden ${stat.cardClass}`}>
            <CardBody className="p-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${stat.iconWrap}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.name}</div>
                  <div className={`mt-3 text-3xl font-bold leading-none ${stat.textClass}`}>{stat.value}</div>
                  <div className="mt-2 text-sm text-slate-600">{stat.helper}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {role === 'captain' ? 'Pending Join Requests' : role === 'admin' ? 'Pending Role Requests' : 'Upcoming Bookings'}
          </h3>
          {role === 'captain' ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/app/teams')}>
              Teams
            </Button>
          ) : role === 'admin' ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/app/admin/role-requests')}>
              Review All
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/app/bookings')}>
              Bookings
            </Button>
          )}
        </CardHeader>
        <div className="bg-white">
          {role === 'captain' ? (
            joinRequestsByTeam.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {joinRequestsByTeam.slice(0, 6).map((team) => (
                  <div key={team.teamId} className="flex items-center justify-between px-6 py-5 transition hover:bg-slate-50/80">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                      <div className="text-xs text-slate-500">{team.pendingCount} pending</div>
                    </div>
                    <Button as={Link} to={`/app/teams/${team.teamId}/manage`} size="sm">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={ClipboardDocumentCheckIcon}
                  title="No pending requests"
                  description="When players request to join, they will appear here."
                />
              </div>
            )
          ) : role === 'admin' ? (
            pendingAdminRoleRequests.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {pendingAdminRoleRequests.map((request) => {
                  const requester = request.requester || {};
                  const requesterName =
                    `${requester.firstName || ''} ${requester.lastName || ''}`.trim() || requester.username || 'Unknown user';

                  return (
                    <div key={request.id} className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50/80">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{requesterName}</div>
                        <div className="truncate text-xs text-gray-500">
                          Requested {String(request.requestedRole || '').replace('_', ' ')} access
                        </div>
                        <div className="mt-1 text-xs text-gray-400">{new Date(request.createdAt).toLocaleString()}</div>
                      </div>
                      <Button as={Link} to="/app/admin/role-requests" size="sm">
                        Review
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={ClipboardDocumentCheckIcon}
                  title="No pending role requests"
                  description="New captain and field owner requests will appear here for admin review."
                />
              </div>
            )
          ) : upcomingBookings.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between px-6 py-5 transition hover:bg-slate-50/80">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{booking.field?.name || 'Field'}</div>
                    <div className="text-xs text-gray-500">{new Date(booking.startTime).toLocaleString()}</div>
                  </div>
                  <Badge tone={statusTone(booking.status)} className="capitalize">
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={CalendarIcon}
                title="No upcoming bookings"
                description={
                  canCreateBooking ? 'Browse fields and create your next booking.' : 'Please request to become captain in Settings.'
                }
                actionLabel={canCreateBooking ? 'Book a field' : 'Request Captain Access'}
                onAction={() =>
                  navigate(
                    canCreateBooking ? '/app/bookings/new' : '/app/settings',
                    canCreateBooking ? undefined : { state: { focusRoleRequest: 'captain' } }
                  )
                }
              />
            </div>
          )}
        </div>
      </Card>

      {role === 'admin' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Newest Users</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/app/admin/users')}>
                Manage Users
              </Button>
            </CardHeader>
            <div className="bg-white">
              {recentUsers.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {recentUsers.map((member) => {
                    const displayName =
                      `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username || member.email;

                    return (
                      <div key={member.id} className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50/80">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">{displayName}</div>
                          <div className="truncate text-xs text-gray-500">@{member.username || 'user'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone="gray" className="capitalize">
                            {String(member.role || 'player').replace('_', ' ')}
                          </Badge>
                          <Badge
                            tone={member.status === 'active' ? 'green' : member.status === 'suspended' ? 'red' : 'gray'}
                            className="capitalize"
                          >
                            {member.status || 'active'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState icon={UserCircleIcon} title="No users found" description="User accounts will appear here after registration." />
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Latest Bookings</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/owner/bookings')}>
                View Bookings
              </Button>
            </CardHeader>
            <div className="bg-white">
              {recentBookings.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50/80">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{booking.field?.name || 'Field booking'}</div>
                        <div className="truncate text-xs text-gray-500">
                          {booking.team?.name || 'No team'} | {new Date(booking.startTime).toLocaleString()}
                        </div>
                      </div>
                      <Badge tone={statusTone(booking.status)} className="capitalize">
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState icon={CalendarIcon} title="No bookings yet" description="Recent bookings will appear here for quick admin review." />
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {role === 'player' && (
        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-lg font-medium text-gray-900">
              <BellAlertIcon className="h-5 w-5 text-amber-500" />
              Team Invitation Notifications
            </h3>
            <Badge tone="yellow">{inviteNotifications.length} pending</Badge>
          </CardHeader>
          <div className="bg-white">
            {inviteNotifications.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {inviteNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex flex-col gap-3 px-6 py-5 transition hover:bg-slate-50/80 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-xs text-gray-500">{notification.message}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleInviteAction(notification, 'accept')}
                        disabled={inviteActionLoading}
                        className="inline-flex items-center gap-1"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleInviteAction(notification, 'decline')}
                        disabled={inviteActionLoading}
                        className="inline-flex items-center gap-1"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={BellAlertIcon}
                  title="No invitation notifications"
                  description="When captains invite you to teams, they will appear here."
                />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
