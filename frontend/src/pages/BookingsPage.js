import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UsersIcon, CurrencyDollarIcon, PlusIcon, MapPinIcon, TagIcon, UserIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import bookingService from '../services/bookingService';
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from '../components/ui';

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
        setError(null);
        const response = await bookingService.getAllBookings();
        console.log('Bookings response:', response);
        
        // Ensure we always set an array, even if response.data is not an array
        const bookingsData = Array.isArray(response.data) ? response.data : [];
        
        // If API fails, use mock data
        if (bookingsData.length === 0 && !response.success) {
          const mockBookings = [
            {
              id: 1,
              field: {
                id: 1,
                name: 'Downtown Arena',
                address: '123 Main St',
                pricePerHour: 50.00,
                image: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Downtown+Arena'
              },
              team: {
                id: 1,
                name: 'Test Team'
              },
              creator: {
                id: 1,
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User'
              },
              startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(), // Tomorrow + 2 hours
              status: 'pending',
              totalPrice: 100.00,
              createdAt: new Date().toISOString(),
              notes: 'Test booking'
            },
            {
              id: 2,
              field: {
                id: 2,
                name: 'City Park Field',
                address: '456 Park Ave',
                pricePerHour: 35.00,
                image: 'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=City+Park+Field'
              },
              team: null,
              creator: {
                id: 2,
                username: 'player1',
                firstName: 'John',
                lastName: 'Doe'
              },
              startTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
              endTime: new Date(Date.now() - 86400000 + 3600000).toISOString(), // Yesterday + 1 hour
              status: 'completed',
              totalPrice: 35.00,
              createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
              notes: 'Completed booking'
            }
          ];
          setBookings(mockBookings);
        } else {
          setBookings(bookingsData);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
        setError('Failed to load bookings');
        
        // Fallback to mock data if API fails
        const mockBookings = [
          {
            id: 1,
            field: {
              id: 1,
              name: 'Downtown Arena',
              address: '123 Main St',
              pricePerHour: 50.00,
              image: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Downtown+Arena'
            },
            team: {
              id: 1,
              name: 'Test Team'
            },
            creator: {
              id: 1,
              username: 'admin',
              firstName: 'Admin',
              lastName: 'User'
            },
            startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(), // Tomorrow + 2 hours
            status: 'pending',
            totalPrice: 100.00,
            createdAt: new Date().toISOString(),
            notes: 'Test booking'
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
    navigate('/app/bookings/new');
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      if (newStatus === 'confirmed') {
        await bookingService.confirmBooking(bookingId);
      } else if (newStatus === 'completed') {
        await bookingService.completeBooking(bookingId);
      } else if (newStatus === 'cancelled') {
        await bookingService.cancelBooking(bookingId);
      } else {
        await bookingService.updateBooking(bookingId, { status: newStatus });
      }
      // Refresh bookings list
      const response = await bookingService.getAllBookings();
      const bookingsData = Array.isArray(response.data) ? response.data : [];
      setBookings(bookingsData);
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setError('Failed to update booking status');
    }
  };

  // Booking details page not implemented yet.

  const getStatusTone = (status) => {
    const tones = {
      pending: 'yellow',
      confirmed: 'green',
      cancelled: 'red',
      completed: 'blue'
    };
    return tones[status] || 'gray';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockIcon className="h-4 w-4" />,
      confirmed: <CheckCircleIcon className="h-4 w-4" />,
      cancelled: <XCircleIcon className="h-4 w-4" />,
      completed: <CheckCircleIcon className="h-4 w-4" />
    };
    return icons[status] || <ClockIcon className="h-4 w-4" />;
  };

  const getStatusActions = (booking) => {
    const actions = [];
    
    if (booking.status === 'pending') {
      if (isAdmin() || isFieldOwner()) {
        actions.push(
          <Button
            key="confirm"
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
          >
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Confirm
          </Button>
        );
      }
      if (booking.creator?.id === user?.id || isAdmin()) {
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="danger"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
          >
            <XCircleIcon className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        );
      }
    }
    
    if (booking.status === 'confirmed' && (isAdmin() || isFieldOwner())) {
      actions.push(
        <Button
          key="complete"
          size="sm"
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
          onClick={() => handleUpdateStatus(booking.id, 'completed')}
        >
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Complete
        </Button>
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
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">
            Manage your football field bookings and reservations
          </p>
        </div>
        <Button 
          onClick={handleCreateBooking}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardBody className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <Badge tone="gray" className="text-sm">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardBody>
      </Card>
            {/* Bookings List */}
      <Card className="overflow-hidden shadow-sm border-gray-200">
        <div className="divide-y divide-gray-200">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.field?.name || 'Unknown Field'}
                        </h3>
                      </div>
                      <Badge tone={getStatusTone(booking.status)} className="capitalize flex items-center gap-1">
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{booking.team?.name || 'No team'}</span>
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-900">${booking.totalPrice}</span>
                        <span className="text-gray-400 ml-1">({calculateDuration(booking.startTime, booking.endTime)}h)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center">
                          <UserIcon className="h-3 w-3 mr-1" />
                          <span>Booked by: {booking.creator?.firstName || booking.creator?.username || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          <span>Created: {formatDate(booking.createdAt)}</span>
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">{getStatusActions(booking)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <EmptyState
                icon={CalendarIcon}
                title="No bookings found"
                description={
                  statusFilter === 'all' 
                    ? 'Create your first booking to get started.' 
                    : `No ${statusFilter} bookings found.`
                }
                actionLabel="New Booking"
                onAction={handleCreateBooking}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BookingsPage;
