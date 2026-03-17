import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import bookingService from '../services/bookingService';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner, useDialog } from '../components/ui';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const statusTone = (status) => {
  const tones = { pending: 'yellow', confirmed: 'green', cancellation_pending: 'orange', completed: 'blue', cancelled: 'red' };
  return tones[status] || 'gray';
};

const formatStatusLabel = (status) => (status ? status.replace('_', ' ') : status);

const formatMoney = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
};

const formatBookingSchedule = (startValue, endValue) => {
  const start = startValue ? new Date(startValue) : null;
  const end = endValue ? new Date(endValue) : null;

  if (!start) return '-';
  return `${start.toLocaleString()}${end ? ` - ${end.toLocaleTimeString()}` : ''}`;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
};

const formatTimeOnly = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleTimeString();
};

const resolveAvatarUrl = (user) => {
  const rawAvatar = user?.avatarUrl || user?.avatar_url;
  if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
  if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
  return `${API_ORIGIN}${rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`}`;
};

const OwnerBookingsPage = () => {
  const [searchParams] = useSearchParams();
  const { confirm } = useDialog();
  const fieldIdFilter = searchParams.get('fieldId');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [decisionLoading, setDecisionLoading] = useState(null);

  const refresh = useCallback(async () => {
    const filters = { limit: 200 };
    if (fieldIdFilter) filters.fieldId = fieldIdFilter;
    const res = await bookingService.getAllBookings(filters);
    setBookings(Array.isArray(res.data) ? res.data : []);
  }, [fieldIdFilter]);

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
  }, [refresh]);

  const counts = useMemo(() => {
    const base = { all: bookings.length, pending: 0, confirmed: 0, cancellation_pending: 0, completed: 0, cancelled: 0 };
    for (const b of bookings) {
      if (b?.status && Object.prototype.hasOwnProperty.call(base, b.status)) base[b.status] += 1;
    }
    return base;
  }, [bookings]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const handleStatus = async (booking, nextStatus) => {
    try {
      setUpdatingId(booking.id);
      setError(null);

      if (nextStatus === 'confirmed') {
        const confirmed = await confirm('Do you want to accept this booking request?', {
          title: 'Accept Booking'
        });
        if (!confirmed) return;
        await bookingService.confirmBooking(booking.id);
      }
      if (nextStatus === 'cancelled') {
        const confirmed = await confirm('Do you want to cancel booking?', { title: 'Cancel Booking' });
        if (!confirmed) return;
        await bookingService.cancelBooking(booking.id);
      }

      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to update booking');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancellationDecision = async (booking, action) => {
    try {
      setDecisionLoading(booking.id);
      setError(null);
      const confirmed = window.confirm(
        action === 'approve'
          ? 'Approve this cancellation request? The booking will be cancelled.'
          : 'Reject this cancellation request? The booking will stay active.'
      );
      if (!confirmed) return;
      await bookingService.decideCancellation(booking.id, action);
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to respond to cancellation request');
    } finally {
      setDecisionLoading(null);
    }
  };

  const captainDisplayName = (booking) => {
    if (booking?.team?.captain?.firstName || booking?.team?.captain?.lastName) {
      return `${booking.team?.captain?.firstName || ''} ${booking.team?.captain?.lastName || ''}`.trim();
    }
    return booking?.team?.captain?.username || 'Unknown';
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
    { key: 'cancellation_pending', label: 'Cancellation Pending', count: counts.cancellation_pending },
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/80 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Booked</div>
              <div className="mt-3 text-4xl font-bold leading-none text-blue-950">{counts.confirmed}</div>
              <p className="mt-2 text-sm text-blue-700/80">Confirmed bookings ready for play.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-blue-600 shadow-sm ring-1 ring-blue-100">
              <CalendarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/80 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Completed</div>
              <div className="mt-3 text-4xl font-bold leading-none text-emerald-950">{counts.completed}</div>
              <p className="mt-2 text-sm text-emerald-700/80">Finished matches recorded successfully.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-emerald-600 shadow-sm ring-1 ring-emerald-100">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
          </div>
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
                const isUpdating = updatingId === b.id || decisionLoading === b.id;
                const start = b?.startTime ? new Date(b.startTime) : null;
                const end = b?.endTime ? new Date(b.endTime) : null;
                const captainName = captainDisplayName(b);
                const homeTeamName = b.team?.name || 'Home Team';
                const awayTeamName = b.opponentTeam?.name || 'Away Team';
                const hasResult = !!b.matchResult?.id;

                return (
                  <div key={b.id} className="flex flex-col gap-4 px-6 py-4 transition hover:bg-slate-50/80 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">{b.field?.name || 'Field'}</div>
                        <Badge tone={statusTone(b.status)} className="capitalize">
                          {formatStatusLabel(b.status)}
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
                    </div>

                    <div className="flex justify-start lg:justify-end">
                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <div className="flex flex-wrap items-center gap-2">
                          {b.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-xs"
                                disabled={isUpdating}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleStatus(b, 'confirmed');
                                }}
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                Accept Booking
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                className="h-7 px-2.5 text-xs"
                                disabled={isUpdating}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleStatus(b, 'cancelled');
                                }}
                              >
                                <XCircleIcon className="h-4 w-4" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {b.status === 'cancellation_pending' && (
                            <>
                              <Button
                                size="sm"
                                disabled={isUpdating}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCancellationDecision(b, 'approve');
                                }}
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                Approve Cancellation
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={isUpdating}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCancellationDecision(b, 'reject');
                                }}
                              >
                                <XCircleIcon className="h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          {b.status === 'confirmed' && <Badge tone="blue">Use Matches page to complete</Badge>}
                          {b.status === 'completed' && <Badge tone="blue">Completed</Badge>}
                          {b.status === 'cancelled' && <Badge tone="gray">No actions</Badge>}
                        </div>
                      </div>
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
