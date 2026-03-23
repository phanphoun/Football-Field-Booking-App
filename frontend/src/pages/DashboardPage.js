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
  ArrowRightIcon,
  BellAlertIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AnimatedStatValue, Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';

const statusTone = (status) => {
  const tones = { pending: 'yellow', confirmed: 'green', completed: 'blue', cancelled: 'red' };
  return tones[status] || 'gray';
};

const roleTheme = {
  captain: {
    badge: 'Captain Overview',
    description: 'Manage your teams, approve join requests, and keep bookings under control.',
    accent: 'from-emerald-50 via-white to-blue-50'
  },
  field_owner: {
    badge: 'Field Owner App View',
    description: 'Use the app workspace to manage teams, review invitations, and create bookings as an owner.',
    accent: 'from-sky-50 via-white to-emerald-50'
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
  const isCaptain = role === 'captain';
  const isFieldOwner = role === 'field_owner';
  const isPlayerWorkspace = role === 'player' || isFieldOwner;
  const canCreateBooking = isCaptain || isFieldOwner;

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
            role === 'player' || role === 'captain' || role === 'field_owner'
              ? teamService.getMyTeams()
              : Promise.resolve({ data: [] }),
            isCaptain ? teamService.getCaptainedTeams() : Promise.resolve({ data: [] }),
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

        if (isCaptain) {
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
  }, [isCaptain, role]);

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((booking) => booking?.startTime && (booking.status === 'pending' || booking.status === 'confirmed'))
      .filter((booking) => new Date(booking.startTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [bookings]);

  const statCards = useMemo(() => {
    if (isCaptain) {
      const pendingJoinRequests =
        stats?.pendingJoinRequests ?? joinRequestsByTeam.reduce((sum, item) => sum + item.pendingCount, 0);

      return [
        {
          name: 'Captained Teams',
          value: captainedTeams.length,
          icon: UsersIcon,
          iconWrap: 'bg-emerald-600',
          cardClass: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70',
          textClass: 'text-emerald-950'
        },
        {
          name: 'Pending Requests',
          value: pendingJoinRequests,
          icon: ClipboardDocumentCheckIcon,
          iconWrap: 'bg-amber-500',
          cardClass: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100/70',
          textClass: 'text-amber-950'
        },
        {
          name: 'My Bookings',
          value: stats?.bookings ?? bookings.length,
          icon: CalendarIcon,
          iconWrap: 'bg-blue-600',
          cardClass: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/70',
          textClass: 'text-blue-950'
        },
        {
          name: 'Fields Available',
          value: stats?.fields ?? 0,
          icon: BuildingOfficeIcon,
          iconWrap: 'bg-cyan-600',
          cardClass: 'border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-cyan-100/70',
          textClass: 'text-cyan-950'
        }
      ];
    }

    if (isPlayerWorkspace) {
      const pendingInvites = notifications.filter((notification) => notification.type === 'team_invite' && !notification.isRead).length;

      return [
        {
          name: 'My Teams',
          value: stats?.teams ?? myTeams.length,
          icon: UsersIcon,
          iconWrap: 'bg-emerald-600',
          cardClass: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70',
          textClass: 'text-emerald-950'
        },
        {
          name: 'Invitations',
          value: pendingInvites,
          icon: BellAlertIcon,
          iconWrap: 'bg-amber-500',
          cardClass: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100/70',
          textClass: 'text-amber-950'
        },
        {
          name: 'Team Bookings',
          value: stats?.bookings ?? bookings.length,
          icon: CalendarIcon,
          iconWrap: 'bg-blue-600',
          cardClass: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/70',
          textClass: 'text-blue-950'
        },
        {
          name: 'Upcoming',
          value: upcomingBookings.length,
          icon: CalendarIcon,
          iconWrap: 'bg-violet-600',
          cardClass: 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-violet-100/70',
          textClass: 'text-violet-950'
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
        textClass: 'text-indigo-950'
      },
      {
        name: 'Fields',
        value: stats?.fields ?? 0,
        icon: BuildingOfficeIcon,
        iconWrap: 'bg-blue-600',
        cardClass: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/70',
        textClass: 'text-blue-950'
      },
      {
        name: 'Teams',
        value: stats?.teams ?? 0,
        icon: UsersIcon,
        iconWrap: 'bg-emerald-600',
        cardClass: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70',
        textClass: 'text-emerald-950'
      },
      {
        name: 'Pending Requests',
        value: pendingRoleRequests,
        icon: ClipboardDocumentCheckIcon,
        iconWrap: 'bg-amber-500',
        cardClass: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100/70',
        textClass: 'text-amber-950'
      }
    ];
  }, [
    isCaptain,
    isPlayerWorkspace,
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

  const spotlightStats = useMemo(() => {
    if (isCaptain) {
      return [
        {
          label: 'Next booking',
          value: upcomingBookings[0]?.field?.name || 'Nothing scheduled',
          note: upcomingBookings[0]?.startTime ? new Date(upcomingBookings[0].startTime).toLocaleString() : 'Create a booking to get started'
        },
        {
          label: 'Teams managed',
          value: String(captainedTeams.length),
          note: captainedTeams.length > 0 ? 'Active captain workspaces' : 'Create or captain a team'
        },
        {
          label: 'Join queue',
          value: String(joinRequestsByTeam.reduce((sum, item) => sum + item.pendingCount, 0)),
          note: 'Requests waiting for your review'
        }
      ];
    }

    if (isPlayerWorkspace) {
      return [
        {
          label: 'Next match day',
          value: upcomingBookings[0]?.field?.name || 'No upcoming booking',
          note: upcomingBookings[0]?.startTime ? new Date(upcomingBookings[0].startTime).toLocaleString() : 'Watch for team activity and invites'
        },
        {
          label: 'My teams',
          value: String(myTeams.length),
          note: myTeams.length > 0 ? 'Teams you currently belong to' : 'Join a team to unlock match activity'
        },
        {
          label: 'Open invites',
          value: String(inviteNotifications.length),
          note: 'Unread team invitations'
        }
      ];
    }

    return [
      {
        label: 'Role queue',
        value: String(pendingAdminRoleRequests.length),
        note: 'Pending approvals requiring admin action'
      },
      {
        label: 'Newest user',
        value:
          (`${recentUsers[0]?.firstName || ''} ${recentUsers[0]?.lastName || ''}`.trim() ||
            recentUsers[0]?.username ||
            'No recent users'),
        note: recentUsers[0]?.createdAt ? new Date(recentUsers[0].createdAt).toLocaleString() : 'New registrations will show here'
      },
      {
        label: 'Recent bookings',
        value: String(recentBookings.length),
        note: 'Latest activity across the platform'
      }
    ];
  }, [
    isCaptain,
    isPlayerWorkspace,
    upcomingBookings,
    captainedTeams.length,
    joinRequestsByTeam,
    myTeams.length,
    inviteNotifications.length,
    pendingAdminRoleRequests.length,
    recentUsers,
    recentBookings.length
  ]);

  const quickActions = useMemo(() => {
    if (isCaptain) {
      return [
        { label: 'Create booking', helper: 'Reserve a field for your team', to: canCreateBooking ? '/app/bookings/new' : '/app/bookings' },
        { label: 'Manage teams', helper: 'Review members and requests', to: '/app/teams' },
        { label: 'Find fields', helper: 'Browse available venues', to: '/app/fields' }
      ];
    }

    if (isFieldOwner) {
      return [
        { label: 'Create booking', helper: 'Reserve a field while using the app workspace', to: '/app/bookings/new' },
        { label: 'Explore teams', helper: 'Join or manage team activity', to: '/app/teams' },
        { label: 'Browse fields', helper: 'Discover venues near you', to: '/app/fields' }
      ];
    }

    if (role === 'player') {
      return [
        { label: 'View bookings', helper: 'See your upcoming sessions', to: '/app/bookings' },
        { label: 'Explore teams', helper: 'Join a squad or manage memberships', to: '/app/teams' },
        { label: 'Browse fields', helper: 'Discover venues near you', to: '/app/fields' }
      ];
    }

    return [
      { label: 'Review role requests', helper: 'Approve captain and owner access', to: '/app/admin/role-requests' },
      { label: 'Manage users', helper: 'Inspect platform members', to: '/app/admin/users' },
      { label: 'Check bookings', helper: 'Monitor booking activity', to: '/app/bookings' }
    ];
  }, [canCreateBooking, isCaptain, isFieldOwner, role]);

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
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-100">
              {activeTheme.badge}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{activeTheme.description}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  as={Link}
                  to={action.to}
                  variant={action.label === quickActions[0].label ? 'primary' : 'outline'}
                  size="sm"
                  className={`rounded-xl px-4 ${action.label === quickActions[0].label ? 'shadow-sm shadow-emerald-600/20' : 'border-slate-300 bg-white/90'}`}
                >
                  {action.label}
                  {action.label === quickActions[0].label && <ArrowRightIcon className="h-4 w-4" />}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
            {spotlightStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                <div className="mt-2 truncate text-lg font-bold text-slate-950">{item.value}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name} className={`overflow-hidden ${stat.cardClass}`}>
            <CardBody className="px-4 py-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${stat.iconWrap}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{stat.name}</div>
                  <AnimatedStatValue value={stat.value} className={`mt-1.5 text-[1.8rem] font-bold leading-none ${stat.textClass}`} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {role === 'captain' ? 'Pending Join Requests' : role === 'admin' ? 'Pending Role Requests' : 'Upcoming Bookings'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {role === 'captain'
                ? 'Keep team membership flowing by clearing request queues quickly.'
                : role === 'admin'
                  ? 'Recent access requests that need review from the admin side.'
                  : 'Your next confirmed or pending sessions in chronological order.'}
            </p>
          </div>
          {isCaptain ? (
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
          {isCaptain ? (
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

      {role !== 'admin' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
                <p className="mt-1 text-sm text-slate-500">Latest booking activity connected to your account.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/app/bookings')}>
                View all
              </Button>
            </CardHeader>
            <div className="bg-white">
              {recentBookings.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {recentBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50/80">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{booking.field?.name || 'Field booking'}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">
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
                  <EmptyState
                    icon={CalendarIcon}
                    title="No recent bookings"
                    description="Once bookings are created, the latest activity will appear here."
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{isCaptain ? 'Team Snapshot' : 'Team Activity'}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {isCaptain
                    ? 'Quick view of the teams you lead and their pending workload.'
                    : 'Your current team footprint and invitation activity.'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/app/teams')}>
                Open teams
              </Button>
            </CardHeader>
            <div className="bg-white p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {isCaptain ? 'Captained teams' : 'Joined teams'}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-950">
                    {isCaptain ? captainedTeams.length : myTeams.length}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {isCaptain ? 'Teams you actively manage' : 'Teams where you are currently a member'}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {isCaptain ? 'Pending join requests' : 'Pending invitations'}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-950">
                    {isCaptain
                      ? joinRequestsByTeam.reduce((sum, item) => sum + item.pendingCount, 0)
                      : inviteNotifications.length}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {isCaptain ? 'Players waiting for a decision' : 'Invites waiting for your response'}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
                {isCaptain
                  ? 'Tip: clear join requests quickly to keep your squad ready for bookings and open matches.'
                  : 'Tip: accepting invitations and tracking bookings here gives you a faster path into upcoming matches.'}
              </div>
            </div>
          </Card>
        </div>
      )}

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

      {isPlayerWorkspace && (
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
