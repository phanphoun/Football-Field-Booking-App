import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import bookingService from '../services/bookingService';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';

const statusTone = (status) => {
  const tones = { pending: 'yellow', confirmed: 'green', completed: 'blue', cancelled: 'red' };
  return tones[status] || 'gray';
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [captainedTeams, setCaptainedTeams] = useState([]);
  const [joinRequestsByTeam, setJoinRequestsByTeam] = useState([]);
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
          setCaptainedTeams([]);
          setJoinRequestsByTeam([]);
          return;
        }

        const [statsRes, bookingsRes, myTeamsRes, captainedRes, fieldsRes] = await Promise.all([
          apiService.get('/dashboard/stats'),
          bookingService.getAllBookings({ limit: 50 }),
          role === 'player' || role === 'captain' ? teamService.getMyTeams() : Promise.resolve({ data: [] }),
          role === 'captain' ? teamService.getCaptainedTeams() : Promise.resolve({ data: [] }),
          fieldService.getAllFields({ limit: 50 })
        ]);

        const statsData = statsRes.data && typeof statsRes.data === 'object' ? statsRes.data : {};
        const bookingData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const myTeamsData = Array.isArray(myTeamsRes.data) ? myTeamsRes.data : [];
        const captainedData = Array.isArray(captainedRes.data) ? captainedRes.data : [];
        const fieldsData = Array.isArray(fieldsRes.data) ? fieldsRes.data : [];

        setStats({
          role,
          ...statsData,
          fields: statsData.fields ?? fieldsData.length
        });
        setBookings(bookingData);
        setMyTeams(myTeamsData);
        setCaptainedTeams(captainedData);

        if (role === 'captain') {
          const requests = await Promise.all(
            captainedData.map(async (t) => {
              const r = await teamService.getJoinRequests(t.id);
              const pending = Array.isArray(r.data) ? r.data : [];
              return { teamId: t.id, teamName: t.name, pendingCount: pending.length };
            })
          );
          setJoinRequestsByTeam(
            requests.filter((r) => r.pendingCount > 0).sort((a, b) => b.pendingCount - a.pendingCount)
          );
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
      .filter((b) => b?.startTime && (b.status === 'pending' || b.status === 'confirmed'))
      .filter((b) => new Date(b.startTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [bookings]);

  const statCards = useMemo(() => {
    if (role === 'captain') {
      const pendingJoinRequests =
        stats?.pendingJoinRequests ?? joinRequestsByTeam.reduce((sum, t) => sum + t.pendingCount, 0);
      return [
        { name: 'Captained Teams', value: captainedTeams.length, icon: UsersIcon, color: 'bg-green-600' },
        { name: 'Pending Requests', value: pendingJoinRequests, icon: ClipboardDocumentCheckIcon, color: 'bg-yellow-600' },
        { name: 'My Bookings', value: stats?.bookings ?? bookings.length, icon: CalendarIcon, color: 'bg-blue-600' },
        { name: 'Fields Available', value: stats?.fields ?? 0, icon: BuildingOfficeIcon, color: 'bg-emerald-600' }
      ];
    }

    if (role === 'player') {
      return [
        { name: 'My Teams', value: stats?.teams ?? myTeams.length, icon: UsersIcon, color: 'bg-green-600' },
        { name: 'My Bookings', value: stats?.bookings ?? bookings.length, icon: CalendarIcon, color: 'bg-blue-600' },
        { name: 'Upcoming', value: upcomingBookings.length, icon: CalendarIcon, color: 'bg-yellow-600' },
        { name: 'Fields Available', value: stats?.fields ?? 0, icon: BuildingOfficeIcon, color: 'bg-emerald-600' }
      ];
    }

    // admin/fallback
    return [
      { name: 'Users', value: stats?.users ?? 0, icon: UserCircleIcon, color: 'bg-purple-600' },
      { name: 'Fields', value: stats?.fields ?? 0, icon: BuildingOfficeIcon, color: 'bg-blue-600' },
      { name: 'Teams', value: stats?.teams ?? 0, icon: UsersIcon, color: 'bg-green-600' },
      { name: 'Bookings', value: stats?.bookings ?? 0, icon: CalendarIcon, color: 'bg-yellow-600' }
    ];
  }, [role, stats, bookings.length, myTeams.length, upcomingBookings.length, captainedTeams.length, joinRequestsByTeam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            {role === 'captain'
              ? 'Manage your teams and approve join requests.'
              : role === 'player'
                ? 'Track your bookings and teams.'
                : 'Platform overview.'}
          </p>
        </div>
        <Badge tone="gray" className="capitalize">
          {role || 'user'}
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <CardBody className="p-5">
              <div className="flex items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="px-4 py-5 sm:px-6 flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {role === 'captain' ? 'Pending Join Requests' : 'Upcoming Bookings'}
            </h3>
            {role === 'captain' ? (
              <Button variant="outline" size="sm" onClick={() => navigate('/app/teams')}>
                Teams
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/app/bookings')}>
                Bookings
              </Button>
            )}
          </CardHeader>
          <div className="border-t border-gray-200">
            {role === 'captain' ? (
              joinRequestsByTeam.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {joinRequestsByTeam.slice(0, 6).map((t) => (
                    <div key={t.teamId} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{t.teamName}</div>
                        <div className="text-xs text-gray-500">{t.pendingCount} pending</div>
                      </div>
                      <Button as={Link} to={`/app/teams/${t.teamId}/manage`} size="sm">
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
                    description="When players request to join, they’ll appear here."
                  />
                </div>
              )
            ) : upcomingBookings.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {upcomingBookings.map((b) => (
                  <div key={b.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{b.field?.name || 'Field'}</div>
                      <div className="text-xs text-gray-500">{new Date(b.startTime).toLocaleString()}</div>
                    </div>
                    <Badge tone={statusTone(b.status)} className="capitalize">
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={CalendarIcon}
                  title="No upcoming bookings"
                  description="Browse fields and create your next booking."
                  actionLabel="Book a field"
                  onAction={() => navigate('/app/bookings/new')}
                />
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick actions</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <Button variant="outline" onClick={() => navigate('/fields')} className="w-full justify-between">
              Browse fields <span className="text-gray-400">→</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/teams')} className="w-full justify-between">
              Browse teams <span className="text-gray-400">→</span>
            </Button>
            {(role === 'player' || role === 'captain') && (
              <Button onClick={() => navigate('/app/bookings/new')} className="w-full justify-between">
                Create booking <span className="text-white/70">→</span>
              </Button>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

