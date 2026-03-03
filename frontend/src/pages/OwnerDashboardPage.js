import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
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

const OwnerDashboardPage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [fieldsRes, bookingsRes] = await Promise.all([
          fieldService.getMyFields(),
          bookingService.getAllBookings({ limit: 200 })
        ]);
        setFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : []);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
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

  const kpiCards = useMemo(
    () => [
      { name: 'My Fields', value: fields.length, icon: BuildingOfficeIcon, color: 'bg-blue-600' },
      { name: 'Pending Requests', value: pendingBookings.length, icon: ClockIcon, color: 'bg-yellow-600' },
      { name: 'Confirmed', value: confirmedBookings.length, icon: CalendarIcon, color: 'bg-green-600' },
      { name: 'Revenue (est.)', value: formatMoney(revenueEstimate), icon: ArrowTrendingUpIcon, color: 'bg-indigo-600' }
    ],
    [fields.length, pendingBookings.length, confirmedBookings.length, revenueEstimate]
  );

  const handleStatus = async (bookingId, nextStatus) => {
    try {
      setUpdatingId(bookingId);
      setError(null);

      if (nextStatus === 'confirmed') await bookingService.confirmBooking(bookingId);
      if (nextStatus === 'cancelled') await bookingService.cancelBooking(bookingId);
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your fields and respond to booking requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button as={Link} to="/owner/fields" variant="outline" size="sm">
            <PlusIcon className="h-4 w-4" />
            Add field
          </Button>
          <Button as={Link} to="/owner/bookings" size="sm">
            <ClockIcon className="h-4 w-4" />
            Review requests
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <Card key={c.name}>
            <CardBody className="p-5">
              <div className="flex items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}>
                  <c.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <div className="text-sm text-gray-500">{c.name}</div>
                  <div className="text-lg font-semibold text-gray-900">{c.value}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Pending booking requests</h2>
            <Badge tone="yellow">{pendingBookings.length} pending</Badge>
          </CardHeader>
          <div className="border-t border-gray-200">
            {pendingBookings.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {pendingBookings.slice(0, 6).map((b) => {
                  const isUpdating = updatingId === b.id;
                  return (
                    <div key={b.id} className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900 truncate">{b.field?.name || 'Field'}</div>
                          <Badge tone={statusTone(b.status)} className="capitalize">
                            {b.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {new Date(b.startTime).toLocaleString()} • {b.team?.name || 'Team'}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" disabled={isUpdating} onClick={() => handleStatus(b.id, 'confirmed')}>
                          <CheckCircleIcon className="h-4 w-4" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isUpdating}
                          onClick={() => handleStatus(b.id, 'cancelled')}
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={ClockIcon}
                  title="No pending requests"
                  description="When players create bookings for your fields, they'll show up here."
                />
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Upcoming confirmed</h2>
            <Badge tone="green">{upcomingConfirmed.length} upcoming</Badge>
          </CardHeader>
          <div className="border-t border-gray-200">
            {upcomingConfirmed.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {upcomingConfirmed.map((b) => (
                  <div key={b.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">{b.field?.name || 'Field'}</div>
                        <Badge tone="green">confirmed</Badge>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        {new Date(b.startTime).toLocaleString()} • {b.team?.name || 'Team'}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Badge tone="green">{formatMoney(b.totalPrice)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6">
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
      </div>

      <Card>
        <CardHeader className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">My fields</h2>
          <Button as={Link} to="/owner/fields" variant="outline" size="sm">
            Manage fields
          </Button>
        </CardHeader>
        <div className="border-t border-gray-200">
          {fields.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {fields.slice(0, 6).map((f) => (
                <div key={f.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-gray-900 truncate">{f.name}</div>
                      {f.status && (
                        <Badge tone={f.status === 'available' ? 'green' : 'gray'} className="capitalize">
                          {f.status}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 truncate">
                      {f.city}
                      {f.province ? `, ${f.province}` : ''} • {formatMoney(f.pricePerHour)}/hr
                    </div>
                  </div>
                  <Button as={Link} to="/owner/fields" size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={BuildingOfficeIcon}
                title="No fields yet"
                description="Create your first field to start receiving booking requests."
                actionLabel="Add field"
                onAction={() => navigate('/owner/fields')}
              />
            </div>
          )}
        </div>
      </Card>

      <div className="text-xs text-gray-500">
        Completed bookings: {completedBookings.length}. Revenue estimate includes confirmed + completed only.
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
