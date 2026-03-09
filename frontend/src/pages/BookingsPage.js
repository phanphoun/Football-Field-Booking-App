<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UsersIcon, CurrencyDollarIcon, PlusIcon, UserIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
=======
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UsersIcon, CurrencyDollarIcon, PlusIcon } from '@heroicons/react/24/outline';
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
import bookingService from '../services/bookingService';
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from '../components/ui';

const BookingsPage = () => {
  const { user, isAdmin, isFieldOwner } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [openForOpponentsFilter] = useState('all');
  const [toggleLoadingMap, setToggleLoadingMap] = useState({});
  const [cancelMatchedLoadingMap, setCancelMatchedLoadingMap] = useState({});
  const [joinRequestsByBooking, setJoinRequestsByBooking] = useState({});
  const [joinRequestsLoadingMap, setJoinRequestsLoadingMap] = useState({});
  const [joinActionLoadingMap, setJoinActionLoadingMap] = useState({});

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingService.getAllBookings();
      const bookingsData = Array.isArray(response.data) ? response.data : [];
      setBookings(bookingsData);

      if (user?.role === 'captain') {
        const targetBookings = bookingsData.filter(
          (booking) =>
            booking?.team?.captainId === user?.id &&
            booking?.openForOpponents &&
            !booking?.opponentTeam?.name &&
            booking?.status !== 'cancelled' &&
            booking?.status !== 'completed'
        );

        if (targetBookings.length > 0) {
          setJoinRequestsLoadingMap((prev) => {
            const next = { ...prev };
            for (const booking of targetBookings) next[booking.id] = true;
            return next;
          });

          const results = await Promise.all(
            targetBookings.map(async (booking) => {
              try {
                const res = await bookingService.getBookingJoinRequests(booking.id);
                return { bookingId: booking.id, requests: Array.isArray(res.data) ? res.data : [] };
              } catch {
                return { bookingId: booking.id, requests: [] };
              }
            })
          );

          setJoinRequestsByBooking((prev) => {
            const next = { ...prev };
            for (const result of results) {
              next[result.bookingId] = result.requests;
            }
            return next;
          });

          setJoinRequestsLoadingMap((prev) => {
            const next = { ...prev };
            for (const booking of targetBookings) next[booking.id] = false;
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
<<<<<<< HEAD
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
=======
    loadBookings();
  }, [loadBookings]);
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154

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
        const confirmed = window.confirm('Do you want to cancel your booking?');
        if (!confirmed) return;
        await bookingService.cancelBooking(bookingId);
      } else {
        await bookingService.updateBooking(bookingId, { status: newStatus });
      }
      await loadBookings();
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setError('Failed to update booking status');
    }
  };

  const isCaptainOwner = (booking) => user?.role === 'captain' && booking.team?.captainId === user?.id;
  const isCaptainInMatchedBooking = (booking) =>
    user?.role === 'captain' && (booking.team?.captainId === user?.id || booking.opponentTeam?.captainId === user?.id);

  const handleToggleOpenForOpponents = async (booking) => {
    try {
      setToggleLoadingMap((prev) => ({ ...prev, [booking.id]: true }));
      await bookingService.setOpenForOpponents(booking.id, !booking.openForOpponents);
      await loadBookings();
    } catch (err) {
      console.error('Failed to toggle open for opponents:', err);
      setError(err.error || 'Failed to update Open for Opponents');
    } finally {
      setToggleLoadingMap((prev) => ({ ...prev, [booking.id]: false }));
    }
  };

  const handleCancelMatchedOpponent = async (booking) => {
    const confirmed = window.confirm(
      `Do you want to cancel this matched game: ${booking.team?.name || 'Team A'} vs ${
        booking.opponentTeam?.name || 'Team B'
      }?`
    );
    if (!confirmed) return;

    try {
      setCancelMatchedLoadingMap((prev) => ({ ...prev, [booking.id]: true }));
      await bookingService.cancelMatchedOpponent(booking.id);
      await loadBookings();
    } catch (err) {
      console.error('Failed to cancel matched opponent:', err);
      setError(err.error || 'Failed to cancel matched match');
    } finally {
      setCancelMatchedLoadingMap((prev) => ({ ...prev, [booking.id]: false }));
    }
  };

  const handleRespondToJoinRequest = async (bookingId, requestId, action) => {
    const key = `${bookingId}-${requestId}-${action}`;
    try {
      setJoinActionLoadingMap((prev) => ({ ...prev, [key]: true }));
      await bookingService.respondToJoinRequest(bookingId, requestId, action);
      await loadBookings();
    } catch (err) {
      console.error(`Failed to ${action} join request:`, err);
      setError(err.error || `Failed to ${action} join request`);
    } finally {
      setJoinActionLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getStatusTone = (status) => {
    const tones = {
      pending: 'yellow',
      confirmed: 'green',
      cancelled: 'red',
      completed: 'blue'
    };
    return tones[status] || 'gray';
  };

  // const getStatusIcon = (status) => {
  //   const icons = {
  //     pending: <ClockIcon className="h-4 w-4" />,
  //     confirmed: <CheckCircleIcon className="h-4 w-4" />,
  //     cancelled: <XCircleIcon className="h-4 w-4" />,
  //     completed: <CheckCircleIcon className="h-4 w-4" />
  //   };
  //   return icons[status] || <ClockIcon className="h-4 w-4" />;
  // };

  const getStatusActions = (booking) => {
    const actions = [];
    const canUserCancelBooking =
      booking.createdBy === user?.id ||
      booking.team?.captainId === user?.id ||
      booking.opponentTeam?.captainId === user?.id ||
      isAdmin();

    if (booking.status === 'pending') {
      if (isAdmin() || isFieldOwner()) {
        actions.push(
<<<<<<< HEAD
          <Button
            key="confirm"
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
          >
            <CheckCircleIcon className="h-3 w-3 mr-1" />
=======
          <Button key="confirm" size="sm" variant="outline" onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
            Confirm
          </Button>
        );
      }
<<<<<<< HEAD
      if (canUserCancelBooking) {
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
=======
      if (booking.creator?.id === user?.id || isAdmin()) {
        actions.push(
          <Button key="cancel" size="sm" variant="danger" onClick={() => handleUpdateStatus(booking.id, 'cancelled')}>
            Cancel Booking
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
          </Button>
        );
      }
    }

    if (booking.status === 'confirmed' && canUserCancelBooking) {
      actions.push(
        <Button key="cancel-confirmed" size="sm" variant="danger" onClick={() => handleUpdateStatus(booking.id, 'cancelled')}>
          Cancel Booking
        </Button>
      );
    }

    if (booking.status === 'confirmed' && (isAdmin() || isFieldOwner())) {
      actions.push(
<<<<<<< HEAD
        <Button
          key="complete"
          size="sm"
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
          onClick={() => handleUpdateStatus(booking.id, 'completed')}
        >
          <CheckCircleIcon className="h-3 w-3 mr-1" />
=======
        <Button key="complete" size="sm" variant="outline" onClick={() => handleUpdateStatus(booking.id, 'completed')}>
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
          Complete
        </Button>
      );
    }

    return actions;
  };

  const filteredBookings = Array.isArray(bookings)
    ? bookings.filter((booking) => {
        const statusMatch = statusFilter === 'all' ? true : booking.status === statusFilter;
        const openForOpponentsMatch =
          openForOpponentsFilter === 'all'
            ? true
            : openForOpponentsFilter === 'open'
            ? Boolean(booking.openForOpponents)
            : !booking.openForOpponents;
        return statusMatch && openForOpponentsMatch;
      })
    : [];

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / (1000 * 60 * 60);
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
<<<<<<< HEAD
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">
            Manage your football field bookings and reservations
          </p>
=======
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your football field bookings</p>
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
        </div>
        <Button 
          onClick={handleCreateBooking}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Booking
        </Button>
      </div>

<<<<<<< HEAD
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
=======
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}

      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {user?.role === 'captain' && (
              <>
                <label className="text-sm font-medium text-gray-700">Opponent Match</label>
                <select
                  value={openForOpponentsFilter}
                  onChange={(e) => setOpenForOpponentsFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                >
                  <option value="all">All</option>
                  <option value="open">Open for Opponents</option>
                  <option value="closed">Not Open</option>
                </select>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{booking.field?.name || 'Unknown Field'}</h3>
                      <Badge tone={getStatusTone(booking.status)} className="capitalize">
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
                        {booking.status}
                      </Badge>
                      {booking.opponentTeam?.name ? (
                        <Badge tone="green">Matched</Badge>
                      ) : booking.openForOpponents ? (
                        <Badge tone="blue">Open for Opponents</Badge>
                      ) : null}
                    </div>
<<<<<<< HEAD
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
=======

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                      </div>
<<<<<<< HEAD
                      <div className="flex items-center min-w-0">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        <span className="truncate whitespace-nowrap">
                          {booking.team?.name || 'No team'}
                          {booking.opponentTeam?.name ? ` vs ${booking.opponentTeam.name}` : ''}
                        </span>
=======
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {booking.team?.name || 'No team'}
                        {booking.opponentTeam?.name ? ` vs ${booking.opponentTeam.name}` : ''}
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-900">${booking.totalPrice}</span>
                        <span className="text-gray-400 ml-1">({calculateDuration(booking.startTime, booking.endTime)}h)</span>
                      </div>
                    </div>

<<<<<<< HEAD
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
=======
                    <div className="mt-2 text-xs text-gray-500">
                      Booked by: {booking.creator?.firstName || booking.creator?.username || 'Unknown'} | Created:{' '}
                      {formatDate(booking.createdAt)}
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
                    </div>

                    {booking.status === 'pending' && isCaptainOwner(booking) && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Waiting for field owner approval. Other captains can still request this same slot until owner confirms
                        one booking.
                      </div>
                    )}

                    {booking.opponentTeam?.name && (
                      <div className="mt-2 text-sm text-green-700 whitespace-nowrap overflow-hidden text-ellipsis">
                        Already matched: {booking.team?.name || 'Team A'} vs {booking.opponentTeam.name}
                      </div>
                    )}

                    {booking.opponentTeam?.name &&
                      isCaptainInMatchedBooking(booking) &&
                      booking.status !== 'cancelled' &&
                      booking.status !== 'completed' && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancelMatchedOpponent(booking)}
                            disabled={!!cancelMatchedLoadingMap[booking.id]}
                          >
                            {cancelMatchedLoadingMap[booking.id] ? 'Cancelling Match...' : 'Cancel Matched Opponent'}
                          </Button>
                        </div>
                      )}

                    {isCaptainOwner(booking) && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <div className="mt-4">
                        <div className="flex items-center flex-wrap gap-2">
                          {!booking.opponentTeam?.name && (
                            <Button
                              size="sm"
                              variant={booking.openForOpponents ? 'warning' : 'primary'}
                              onClick={() => handleToggleOpenForOpponents(booking)}
                              disabled={!!toggleLoadingMap[booking.id]}
                            >
                              {toggleLoadingMap[booking.id]
                                ? 'Updating...'
                                : booking.openForOpponents
                                ? 'Close Match'
                                : 'Open Match'}
                            </Button>
                          )}

                        </div>

                        {booking.openForOpponents && !booking.opponentTeam?.name && (
                          <div className="mt-3 rounded-md border border-gray-200 bg-white p-3">
                            <p className="text-sm font-medium text-gray-800 mb-2">Join Requests</p>
                            {joinRequestsLoadingMap[booking.id] ? (
                              <p className="text-sm text-gray-500">Loading requests...</p>
                            ) : Array.isArray(joinRequestsByBooking[booking.id]) &&
                              joinRequestsByBooking[booking.id].length > 0 ? (
                              <div className="space-y-2">
                                {joinRequestsByBooking[booking.id].map((request) => {
                                  const captainName =
                                    request?.requesterTeam?.captain?.firstName || request?.requesterTeam?.captain?.lastName
                                      ? `${request.requesterTeam?.captain?.firstName || ''} ${
                                          request.requesterTeam?.captain?.lastName || ''
                                        }`.trim()
                                      : request?.requesterTeam?.captain?.username || 'Unknown captain';
                                  return (
                                    <div
                                      key={request.id}
                                      className="border border-gray-100 rounded-md p-2 flex items-center justify-between gap-3"
                                    >
                                      <div>
                                        <p className="text-sm text-gray-800">
                                          {request.requesterTeam?.name || 'Unknown team'} ({request.status})
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">Captain: {captainName}</p>
                                        {request.message && <p className="text-xs text-gray-500 mt-1">"{request.message}"</p>}
                                      </div>

                                      {request.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => handleRespondToJoinRequest(booking.id, request.id, 'accept')}
                                            disabled={!!joinActionLoadingMap[`${booking.id}-${request.id}-accept`]}
                                          >
                                            Approve Join
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleRespondToJoinRequest(booking.id, request.id, 'reject')}
                                            disabled={!!joinActionLoadingMap[`${booking.id}-${request.id}-reject`]}
                                          >
                                            Decline
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No requests yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
<<<<<<< HEAD
                  statusFilter === 'all' 
                    ? 'Create your first booking to get started.' 
                    : `No ${statusFilter} bookings found.`
=======
                  statusFilter === 'all' && openForOpponentsFilter === 'all'
                    ? 'Create your first booking to get started.'
                    : 'No bookings found for the selected filters.'
>>>>>>> 213091dce9910aacf1e0729325582b7720d3a154
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
