import React, { useEffect, useMemo, useState } from 'react';
import fieldService from '../services/fieldService';
import bookingService from '../services/bookingService';
import { BuildingOfficeIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

const OwnerDashboardPage = () => {
  const [fields, setFields] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [fieldsRes, bookingsRes] = await Promise.all([
          fieldService.getMyFields(),
          bookingService.getAllBookings({ limit: 10 })
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

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === 'pending').length,
    [bookings]
  );
  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed').length,
    [bookings]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your fields and booking requests.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-blue-100 text-blue-700">
            <BuildingOfficeIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">My Fields</div>
            <div className="text-xl font-semibold text-gray-900">{fields.length}</div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-yellow-100 text-yellow-700">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Pending Requests</div>
            <div className="text-xl font-semibold text-gray-900">{pendingCount}</div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-green-100 text-green-700">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Confirmed Bookings</div>
            <div className="text-xl font-semibold text-gray-900">{confirmedCount}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Recent Booking Requests</h2>
        </div>
        <div className="p-6">
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{b.field?.name || 'Field'}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(b.startTime).toLocaleString()} • {b.team?.name || 'Team'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 capitalize">{b.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-6">No bookings yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;

