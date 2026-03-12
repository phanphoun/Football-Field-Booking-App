import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import bookingService from '../services/bookingService';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';

const statusTone = (status) => {
  const tones = { pending: 'yellow', confirmed: 'green', completed: 'blue', cancelled: 'red' };
  return tones[status] || 'gray';
};

const formatMoney = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
};

const OwnerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedMembers, setExpandedMembers] = useState({});

  const refresh = async () => {
    const res = await bookingService.getAllBookings({ limit: 200 });
    setBookings(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        setError(err?.error || 'Failed to load booking requests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts = useMemo(() => {
    const base = { all: bookings.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const b of bookings) {
      if (b?.status && Object.prototype.hasOwnProperty.call(base, b.status)) base[b.status] += 1;
    }
    return base;
  }, [bookings]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

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

      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to update booking');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleMembers = (bookingId) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const tabs = [
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
    { key: 'all', label: 'All', count: counts.all }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking requests</h1>
          <p className="mt-1 text-sm text-gray-600">Confirm or cancel booking requests. Match completion is managed in Matches.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button as={Link} to="/owner/fields" variant="outline" size="sm">
            <BuildingOfficeIcon className="h-4 w-4" />
            My fields
          </Button>
          <Button as={Link} to="/owner/matches" variant="outline" size="sm">
            <CalendarIcon className="h-4 w-4" />
            Matches
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-blue-700">Booked</div>
          <div className="mt-1 text-2xl font-bold text-blue-900">{counts.confirmed}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-emerald-700">Completed</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">{counts.completed}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 transition ${
              statusFilter === t.key
                ? 'bg-blue-600 text-white ring-blue-600'
                : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
            }`}
            type="button"
          >
            <span>{t.label}</span>
            <span className={`${statusFilter === t.key ? 'text-white/80' : 'text-gray-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Requests</div>
            <div className="text-xs text-gray-500">Showing: {statusFilter}</div>
          </div>
          <Badge tone={statusFilter === 'pending' ? 'yellow' : 'gray'}>{filtered.length} items</Badge>
        </CardHeader>

        <div className="border-t border-gray-200">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={ClockIcon} title="No bookings" description="Try another filter, or wait for new booking requests." />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((b) => {
                const isUpdating = updatingId === b.id;
                const start = b?.startTime ? new Date(b.startTime) : null;
                const end = b?.endTime ? new Date(b.endTime) : null;
                const captainName =
                  b?.team?.captain?.firstName || b?.team?.captain?.lastName
                    ? `${b.team?.captain?.firstName || ''} ${b.team?.captain?.lastName || ''}`.trim()
                    : b?.team?.captain?.username || 'Unknown';
                const members = Array.isArray(b?.team?.teamMembers) ? b.team.teamMembers : [];
                const isMembersExpanded = !!expandedMembers[b.id];
                const homeTeamName = b.team?.name || 'Home Team';
                const awayTeamName = b.opponentTeam?.name || 'Away Team';
                const hasResult = !!b.matchResult?.id;

                return (
                  <div key={b.id} className="px-6 py-4 flex flex-col gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">{b.field?.name || 'Field'}</div>
                        <Badge tone={statusTone(b.status)} className="capitalize">
                          {b.status}
                        </Badge>
                        <Badge tone="green">{formatMoney(b.totalPrice)}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {start ? start.toLocaleString() : '-'}
                          {end ? ` - ${end.toLocaleTimeString()}` : ''}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="truncate">Team: {b.team?.name || 'Team'}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        Captain: <span className="font-medium text-gray-800">{captainName}</span>
                      </div>
                      {hasResult && (
                        <div className="mt-1 text-xs text-emerald-700">
                          Result recorded: {homeTeamName} {b.matchResult.homeScore} - {b.matchResult.awayScore} {awayTeamName}
                        </div>
                      )}
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => toggleMembers(b.id)}
                          className="text-xs font-medium text-blue-700 hover:text-blue-800 underline"
                        >
                          {isMembersExpanded ? 'Hide team members' : `View all members (${members.length})`}
                        </button>
                      </div>
                      {isMembersExpanded && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                          {members.length > 0 ? (
                            <div className="space-y-1">
                              {members.map((member) => {
                                const userName =
                                  member?.user?.firstName || member?.user?.lastName
                                    ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                                    : member?.user?.username || `User #${member.userId}`;
                                return (
                                  <div key={`${b.id}-${member.userId}`} className="text-xs text-gray-700">
                                    {userName} ({member.role}, {member.status})
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">No members found.</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
                      {b.status === 'pending' && (
                        <>
                          <Button size="sm" disabled={isUpdating} onClick={() => handleStatus(b.id, 'confirmed')}>
                            <CheckCircleIcon className="h-4 w-4" />
                            Confirm
                          </Button>
                          <Button size="sm" variant="danger" disabled={isUpdating} onClick={() => handleStatus(b.id, 'cancelled')}>
                            <XCircleIcon className="h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {b.status === 'confirmed' && <Badge tone="blue">Use Matches page to complete</Badge>}
                      {b.status === 'completed' && <Badge tone="blue">Completed</Badge>}
                      {b.status === 'cancelled' && <Badge tone="gray">No actions</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <CardBody className="px-6 py-4 text-xs text-gray-500">
          Tip: Confirm pending requests quickly to improve your field booking rate.
        </CardBody>
      </Card>
    </div>
  );
};

export default OwnerBookingsPage;
