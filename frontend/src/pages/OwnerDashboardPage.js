import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  UsersIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  XCircleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import bookingService from '../services/bookingService';
import teamService from '../services/teamService';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';

const statusTone = (status) => {
  const tones = { pending: 'yellow', confirmed: 'green', completed: 'blue', cancelled: 'red' };
  return tones[status] || 'gray';
};

const formatMoney = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
};

const OwnerDashboardPage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [captainedTeams, setCaptainedTeams] = useState([]);
  const [joinRequestsByTeam, setJoinRequestsByTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [fieldsRes, bookingsRes, captainedRes] = await Promise.all([
          fieldService.getMyFields(),
          bookingService.getAllBookings({ limit: 200 }),
          teamService.getCaptainedTeams()
        ]);
        setFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : []);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        const captainedData = Array.isArray(captainedRes.data) ? captainedRes.data : [];
        setCaptainedTeams(captainedData);

        // Fetch join requests for each captained team
        if (captainedData.length > 0) {
          const requests = await Promise.all(
            captainedData.map(async (t) => {
              try {
                const r = await teamService.getJoinRequests(t.id);
                const pending = Array.isArray(r.data) ? r.data : [];
                return { teamId: t.id, teamName: t.name, pendingCount: pending.length };
              } catch {
                return { teamId: t.id, teamName: t.name, pendingCount: 0 };
              }
            })
          );
          setJoinRequestsByTeam(requests.filter((r) => r.pendingCount > 0).sort((a, b) => b.pendingCount - a.pendingCount));
        }
      } catch (err) {
        setError(err?.error || 'Failed to load owner dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerData();
  }, []);

  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === 'pending'), [bookings]);
  const confirmedBookings = useMemo(() => bookings.filter((b) => b.status === 'confirmed'), [bookings]);
  const completedBookings = useMemo(() => bookings.filter((b) => b.status === 'completed'), [bookings]);
  const upcomingConfirmed = useMemo(() => {
    const now = Date.now();
    return confirmedBookings
      .filter((b) => b?.startTime && new Date(b.startTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [confirmedBookings]);

  const revenueEstimate = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
  }, [bookings]);

  const pendingJoinRequests = useMemo(() => {
    return joinRequestsByTeam.reduce((sum, t) => sum + t.pendingCount, 0);
  }, [joinRequestsByTeam]);

  const kpiCards = useMemo(
    () => [
      { name: 'My Fields', value: fields.length, icon: BuildingOfficeIcon, color: 'bg-blue-600', bgHover: 'hover:bg-blue-700' },
      { name: 'My Teams', value: captainedTeams.length, icon: UsersIcon, color: 'bg-emerald-600', bgHover: 'hover:bg-emerald-700' },
      { name: 'Pending Bookings', value: pendingBookings.length, icon: ClockIcon, color: 'bg-yellow-600', bgHover: 'hover:bg-yellow-700' },
      { name: 'Revenue (est.)', value: formatMoney(revenueEstimate), icon: ArrowTrendingUpIcon, color: 'bg-indigo-600', bgHover: 'hover:bg-indigo-700' }
    ],
    [fields.length, captainedTeams.length, pendingBookings.length, revenueEstimate]
  );

  const handleStatus = async (bookingId, nextStatus) => {
    try {
      setUpdatingId(bookingId);
      setError(null);

      if (nextStatus === 'confirmed') {
        const confirmed = window.confirm('Do you want to confirm booking?');
        if (!confirmed) return;
        await bookingService.confirmBooking(bookingId);
      }
      if (nextStatus === 'cancelled') {
        const confirmed = window.confirm('Do you want to cancel booking?');
        if (!confirmed) return;
        await bookingService.cancelBooking(bookingId);
      }
      if (nextStatus === 'completed') await bookingService.completeBooking(bookingId);

      const bookingsRes = await bookingService.getAllBookings({ limit: 200 });
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
    } catch (err) {
      setError(err?.error || 'Failed to update booking');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            Owner Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">Manage your fields, teams, and respond to booking requests.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button as={Link} to="/owner/fields" variant="outline" size="sm" className="shadow-sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Field
          </Button>
          <Button as={Link} to="/app/teams/new" variant="outline" size="sm" className="shadow-sm">
            <UsersIcon className="h-4 w-4 mr-1" />
            Create Team
          </Button>
          <Button as={Link} to="/owner/bookings" size="sm" className="shadow-sm">
            <ClockIcon className="h-4 w-4 mr-1" />
            Review Requests
            {pendingBookings.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingBookings.length}</span>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-md text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <XCircleIcon className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <Card key={c.name} className="hover:shadow-md transition-shadow duration-200">
            <CardBody className="p-5">
              <div className="flex items-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.color} shadow-lg`}>
                  <c.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <div className="text-sm font-medium text-gray-500">{c.name}</div>
                  <div className="text-xl font-bold text-gray-900">{c.value}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Booking Requests */}
        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 flex items-center justify-between border-b border-yellow-100">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
              <h2 className="text-sm font-semibold text-gray-900">Pending Booking Requests</h2>
            </div>
            <Badge tone="yellow" className="shadow-sm">{pendingBookings.length} pending</Badge>
          </CardHeader>
          <div className="border-t border-gray-200">
            {pendingBookings.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {pendingBookings.slice(0, 6).map((b) => {
                  const isUpdating = updatingId === b.id;
                  return (
                    <div key={b.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <div className="text-sm font-semibold text-gray-900 truncate">{b.field?.name || 'Field'}</div>
                            <Badge tone={statusTone(b.status)} className="capitalize text-xs">
                              {b.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(b.startTime).toLocaleString()} • {b.team?.name || 'Team'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            disabled={isUpdating} 
                            onClick={() => handleStatus(b.id, 'confirmed')}
                            className="bg-green-600 hover:bg-green-700 border-green-600"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={isUpdating}
                            onClick={() => handleStatus(b.id, 'cancelled')}
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8">
                <EmptyState
                  icon={CheckCircleIcon}
                  title="All caught up!"
                  description="No pending booking requests at the moment."
                  className="text-green-600"
                />
              </div>
            )}
          </div>
        </Card>

        {/* My Teams & Join Requests */}
        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">My Teams</h2>
            </div>
            {pendingJoinRequests > 0 && (
              <Badge tone="yellow" className="shadow-sm">{pendingJoinRequests} requests</Badge>
            )}
          </CardHeader>
          <div className="border-t border-gray-200">
            {captainedTeams.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {captainedTeams.slice(0, 5).map((team) => {
                  const teamRequest = joinRequestsByTeam.find(r => r.teamId === team.id);
                  return (
                    <div key={team.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TrophyIcon className="h-4 w-4 text-yellow-500" />
                            <div className="text-sm font-semibold text-gray-900 truncate">{team.name}</div>
                            {team.skillLevel && (
                              <Badge tone="blue" className="capitalize text-xs">{team.skillLevel}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {team.homeField ? (
                              <span className="flex items-center gap-1">
                                <BuildingOfficeIcon className="h-3 w-3" />
                                {team.homeField.name}
                              </span>
                            ) : 'No home field'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {teamRequest && teamRequest.pendingCount > 0 && (
                            <Badge tone="yellow" className="text-xs">
                              {teamRequest.pendingCount} pending
                            </Badge>
                          )}
                          <Button 
                            as={Link} 
                            to={`/app/teams/${team.id}/manage`} 
                            size="sm" 
                            variant="outline"
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8">
                <EmptyState
                  icon={UsersIcon}
                  title="No teams yet"
                  description="Create a team to manage players and organize matches."
                  actionLabel="Create Team"
                  onAction={() => navigate('/app/teams/new')}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Upcoming Confirmed Bookings */}
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between border-b border-green-100">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-900">Upcoming Confirmed Bookings</h2>
          </div>
          <Badge tone="green" className="shadow-sm">{upcomingConfirmed.length} upcoming</Badge>
        </CardHeader>
        <div className="border-t border-gray-200">
          {upcomingConfirmed.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {upcomingConfirmed.map((b) => (
                <div key={b.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">{b.field?.name || 'Field'}</div>
                        <Badge tone="green" className="capitalize text-xs">confirmed</Badge>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(b.startTime).toLocaleString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />
                          {b.team?.name || 'Team'}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Badge tone="emerald" className="font-semibold bg-emerald-100 text-emerald-800">
                        {formatMoney(b.totalPrice)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={CalendarIcon}
                title="No upcoming bookings"
                description="Confirm pending requests to see your upcoming schedule."
                actionLabel="Go to requests"
                onAction={() => navigate('/owner/bookings')}
              />
            </div>
          )}
        </div>
      </Card>

      {/* My Fields */}
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between border-b border-blue-100">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">My Fields</h2>
          </div>
          <Button as={Link} to="/owner/fields" variant="outline" size="sm" className="shadow-sm">
            Manage Fields
          </Button>
        </CardHeader>
        <div className="border-t border-gray-200">
          {fields.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {fields.slice(0, 6).map((f) => (
                <div key={f.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">{f.name}</div>
                        {f.status && (
                          <Badge tone={f.status === 'available' ? 'green' : 'gray'} className="capitalize text-xs">
                            {f.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <MagnifyingGlassIcon className="h-3 w-3" />
                          {f.city}{f.province ? `, ${f.province}` : ''}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <CurrencyDollarIcon className="h-3 w-3" />
                          {formatMoney(f.pricePerHour)}/hr
                        </span>
                      </div>
                    </div>
                    <Button as={Link} to="/owner/fields" size="sm" variant="outline" className="shrink-0">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={BuildingOfficeIcon}
                title="No fields yet"
                description="Create your first field to start receiving booking requests."
                actionLabel="Add Field"
                onAction={() => navigate('/owner/fields')}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Footer Stats */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              {completedBookings.length} completed bookings
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <CurrencyDollarIcon className="h-4 w-4 text-indigo-500" />
              Revenue includes confirmed + completed only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;

