import React, { useEffect, useMemo, useState } from 'react';
import bookingService from '../services/bookingService';

const OwnerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const refresh = async () => {
    const res = await bookingService.getAllBookings({ limit: 50 });
    setBookings(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        setError(err?.error || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const handleStatus = async (bookingId, status) => {
    try {
      setActionLoading(true);
      setError(null);
      if (status === 'confirmed') await bookingService.confirmBooking(bookingId);
      else if (status === 'completed') await bookingService.completeBooking(bookingId);
      else if (status === 'cancelled') await bookingService.cancelBooking(bookingId);
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to update booking');
    } finally {
      setActionLoading(false);
    }
  };

  const badge = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return map[status] || map.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
          <p className="mt-1 text-sm text-gray-600">Review and update bookings for your fields.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filtered.length > 0 ? (
            filtered.map((b) => (
              <div key={b.id} className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">{b.field?.name || 'Field'}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(b.startTime).toLocaleString()} • {b.team?.name || 'Team'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleStatus(b.id, 'confirmed')}
                        className="px-3 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleStatus(b.id, 'cancelled')}
                        className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatus(b.id, 'completed')}
                      className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-sm text-gray-500">No bookings found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerBookingsPage;

