import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, BuildingOfficeIcon, UsersIcon, CurrencyDollarIcon, PlusIcon } from '@heroicons/react/24/outline';
import bookingService from '../services/bookingService';

const BookingsPage = () => {
  const { user, isAdmin, isFieldOwner } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getAllBookings();
        // Ensure we always set an array, even if response.data is not an array
        const bookingsData = Array.isArray(response.data) ? response.data : [];
        setBookings(bookingsData);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
        setError('Failed to load bookings');
        
        // Fallback to mock data if API fails
        const mockBookings = [
          {
            id: 1,
            field: {
              name: 'Downtown Arena',
              address: '123 Main St',
              pricePerHour: 50.00
            },
            team: {
              name: 'Test Team'
            },
            creator: {
              username: 'admin',
              firstName: 'Admin',
              lastName: 'User'
            },
            startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(), // Tomorrow + 2 hours
            status: 'pending',
            totalPrice: 100.00,
            createdAt: new Date().toISOString()
          }
        ];
        setBookings(mockBookings);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCreateBooking = () => {
    navigate('/bookings/new');
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await bookingService.updateBookingStatus(bookingId, { status: newStatus });
      // Refresh bookings list
      const response = await bookingService.getAllBookings();
      const bookingsData = Array.isArray(response.data) ? response.data : [];
      setBookings(bookingsData);
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setError('Failed to update booking status');
    }
  };

  const handleViewBooking = (bookingId) => {
    navigate(`/bookings/${bookingId}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || colors.pending;
  };

  const getStatusActions = (booking) => {
    const actions = [];
    
    if (booking.status === 'pending') {
      if (isAdmin() || isFieldOwner()) {
        actions.push(
          <button
            key="confirm"
            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Confirm
          </button>
        );
      }
      if (booking.createdBy === user?.id || isAdmin()) {
        actions.push(
          <button
            key="cancel"
            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Cancel
          </button>
        );
      }
    }
    
    if (booking.status === 'confirmed' && (isAdmin() || isFieldOwner())) {
      actions.push(
        <button
          key="complete"
          onClick={() => handleUpdateStatus(booking.id, 'completed')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Complete
        </button>
      );
    }
    
    return actions;
  };

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    if (statusFilter === 'all') return true;
    return booking.status === statusFilter;
  }) : [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / (1000 * 60 * 60); // hours
    return duration.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your football field bookings
          </p>
        </div>
        <button
          onClick={handleCreateBooking}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Booking
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {booking.field?.name || 'Unknown Field'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(booking.startTime)}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {booking.team?.name || 'No team'}
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        ${booking.totalPrice} ({calculateDuration(booking.startTime, booking.endTime)}h)
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Booked by: {booking.creator?.firstName || booking.creator?.username || 'Unknown'} • 
                      Created: {formatDate(booking.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewBooking(booking.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                    {getStatusActions(booking).length > 0 && (
                      <>
                        <span className="text-gray-300">•</span>
                        {getStatusActions(booking)}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all' 
                  ? "Get started by creating a new booking." 
                  : `No ${statusFilter} bookings found.`}
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreateBooking}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Booking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
