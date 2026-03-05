import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UsersIcon, CurrencyDollarIcon, PlusIcon } from '@heroicons/react/24/outline';
import bookingService from '../services/bookingService';
import teamService from '../services/teamService';
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from '../components/ui';

const BookingsPage = () => {
  const { user, isAdmin, isFieldOwner } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [openMatches, setOpenMatches] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [selectedJoinTeamByMatch, setSelectedJoinTeamByMatch] = useState({});
  const [joiningMatchId, setJoiningMatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const [bookingsRes, openMatchesRes, teamsRes] = await Promise.all([
          bookingService.getAllBookings(),
          bookingService.getOpenMatches(),
          teamService.getMyTeams().catch(() => ({ data: [] }))
        ]);
        // Ensure we always set an array, even if response.data is not an array
        const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const openMatchesData = Array.isArray(openMatchesRes.data) ? openMatchesRes.data : [];
        const myTeamsData = Array.isArray(teamsRes.data) ? teamsRes.data : [];
        setBookings(bookingsData);
        setOpenMatches(openMatchesData);
        setMyTeams(myTeamsData);
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
      const [response, openMatchesResponse] = await Promise.all([
        bookingService.getAllBookings(),
        bookingService.getOpenMatches()
      ]);
      const bookingsData = Array.isArray(response.data) ? response.data : [];
      const openMatchesData = Array.isArray(openMatchesResponse.data) ? openMatchesResponse.data : [];
      setBookings(bookingsData);
      setOpenMatches(openMatchesData);
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setError('Failed to update booking status');
    }
  };

  const canJoinOpenMatches = user?.role === 'player' || user?.role === 'captain' || user?.role === 'admin';

  const handleJoinMatch = async (matchId) => {
    const teamId = Number(selectedJoinTeamByMatch[matchId]);
    if (!teamId) {
      setError('Please select your team before joining the match.');
      return;
    }

    try {
      setJoiningMatchId(matchId);
      setError(null);
      setSuccessMessage(null);
      await bookingService.joinOpenMatch(matchId, teamId);
      const [bookingsRes, openMatchesRes] = await Promise.all([
        bookingService.getAllBookings(),
        bookingService.getOpenMatches()
      ]);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setOpenMatches(Array.isArray(openMatchesRes.data) ? openMatchesRes.data : []);
      setSuccessMessage('Joined match successfully. Waiting for owner confirmation.');
    } catch (err) {
      setError(err?.error || 'Failed to join match');
    } finally {
      setJoiningMatchId(null);
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

  const getDisplayStatus = (booking) => {
    if (booking?.status === 'pending' && booking?.opponentTeamId) {
      return 'pending owner confirmation';
    }
    if (booking?.status === 'pending' && booking?.isMatchmaking && !booking?.opponentTeamId) {
      return 'waiting for opponent';
    }
    return booking?.status || 'unknown';
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
            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
          >
            Confirm
          </Button>
        );
      }
      if (booking.createdBy === user?.id || isAdmin()) {
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="danger"
            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
          >
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
          onClick={() => handleUpdateStatus(booking.id, 'completed')}
        >
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
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your football field bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="gray">{filteredBookings.length} results</Badge>
          <Button onClick={handleCreateBooking}>
            <PlusIcon className="h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {/* Filters */}
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
          </div>
        </CardBody>
      </Card>

      {canJoinOpenMatches && (
        <Card className="mb-6">
          <CardBody className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Open Matches</h2>
              <Badge tone="blue">{openMatches.length}</Badge>
            </div>
            {openMatches.length > 0 ? (
              <div className="space-y-3">
                {openMatches.map((match) => {
                  const isJoining = joiningMatchId === match.id;
                  const isOwnMatch = Number(match.createdBy) === Number(user?.id);
                  return (
                    <div
                      key={match.id}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-3 sm:flex sm:items-center sm:justify-between"
                    >
                      <div className="text-sm text-gray-700">
                        <div className="font-medium text-gray-900">
                          {match.field?.name || 'Field'} • {new Date(match.startTime).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          Team 1: {match.team?.name || 'Unknown'} • Status: Looking for opponent
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 sm:mt-0">
                        <select
                          value={selectedJoinTeamByMatch[match.id] || ''}
                          onChange={(e) =>
                            setSelectedJoinTeamByMatch((prev) => ({ ...prev, [match.id]: e.target.value }))
                          }
                          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                          disabled={isJoining || !myTeams.length || isOwnMatch}
                        >
                          <option value="">Select team</option>
                          {myTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={isJoining || !myTeams.length || isOwnMatch}
                          onClick={() => handleJoinMatch(match.id)}
                        >
                          Join Match
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={UsersIcon}
                title="No open matches"
                description="Open matches will appear here when teams create bookings in open match mode."
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* Bookings List */}
      <Card className="overflow-hidden">
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
                      <Badge tone={getStatusTone(booking.status)} className="capitalize">
                        {getDisplayStatus(booking)}
                      </Badge>
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
                        {booking.opponentTeam?.name ? ` vs ${booking.opponentTeam.name}` : ''}
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

                  <div className="flex items-center space-x-2 ml-4">{getStatusActions(booking)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6">
              <EmptyState
                icon={CalendarIcon}
                title="No bookings found"
                description={
                  statusFilter === 'all' ? 'Create your first booking to get started.' : `No ${statusFilter} bookings found.`
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
