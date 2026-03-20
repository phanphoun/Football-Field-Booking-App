import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UsersIcon, CurrencyDollarIcon, PlusIcon } from '@heroicons/react/24/outline';
import bookingService from '../services/bookingService';
import { Badge, Button, Card, CardBody, EmptyState, Spinner, useDialog } from '../components/ui';
import { getTeamJerseyColors } from '../utils/teamColors';

const BookingsPage = () => {
  const { user, isAdmin, isFieldOwner } = useAuth();
  const { version } = useRealtime();
  const navigate = useNavigate();
  const { confirm } = useDialog();
  const canCreateBooking = user?.role === 'captain';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [openForOpponentsFilter, setOpenForOpponentsFilter] = useState('all');
  const [toggleLoadingMap, setToggleLoadingMap] = useState({});
  const [cancelMatchedLoadingMap, setCancelMatchedLoadingMap] = useState({});
  const [joinRequestsByBooking, setJoinRequestsByBooking] = useState({});
  const [joinRequestsLoadingMap, setJoinRequestsLoadingMap] = useState({});
  const [joinActionLoadingMap, setJoinActionLoadingMap] = useState({});
  const [cancellationLoadingMap, setCancellationLoadingMap] = useState({});

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
            booking?.status !== 'completed' &&
            booking?.status !== 'cancellation_pending'
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
    loadBookings();
  }, [loadBookings, version]);

  const handleCreateBooking = () => {
    if (!canCreateBooking) {
      navigate('/app/settings', {
        state: { focusRoleRequest: 'captain' }
      });
      return;
    }
    navigate('/app/bookings/new');
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      if (newStatus === 'confirmed') {
        await bookingService.confirmBooking(bookingId);
      } else if (newStatus === 'completed') {
        await bookingService.completeBooking(bookingId);
      } else if (newStatus === 'cancelled') {
        const confirmed = await confirm('Do you want to cancel your booking?', { title: 'Cancel Booking' });
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

  const handleRequestCancellation = async (booking) => {
    const confirmed = window.confirm('Do you want to request cancellation for this booking?');
    if (!confirmed) return;
    const reason = window.prompt('Optional: provide a reason for cancellation') || '';

    try {
      setCancellationLoadingMap((prev) => ({ ...prev, [booking.id]: true }));
      await bookingService.requestCancellation(booking.id, reason.trim());
      await loadBookings();
    } catch (err) {
      console.error('Failed to request cancellation:', err);
      setError(err.error || 'Failed to request cancellation');
    } finally {
      setCancellationLoadingMap((prev) => ({ ...prev, [booking.id]: false }));
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
    const confirmed = await confirm(
      `Do you want to cancel this matched game: ${booking.team?.name || 'Team A'} vs ${
        booking.opponentTeam?.name || 'Team B'
      }?`,
      { title: 'Cancel Matched Game' }
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
      cancellation_pending: 'orange',
      cancelled: 'red',
      completed: 'blue'
    };
    return tones[status] || 'gray';
  };

  const formatStatusLabel = (status) => (status ? status.replace('_', ' ') : status);

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
    const canDirectCancel = isAdmin() || isFieldOwner();
    const canRequestCancellation = isCaptainOwner(booking) && ['pending', 'confirmed'].includes(booking.status);

    if (booking.status === 'pending') {
      if (isAdmin() || isFieldOwner()) {
        actions.push(
          <Button key="confirm" size="sm" variant="outline" onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>
            Confirm
          </Button>
        );
      }
      if (canDirectCancel) {
        actions.push(
          <Button key="cancel" size="sm" variant="danger" onClick={() => handleUpdateStatus(booking.id, 'cancelled')}>
            Cancel Booking
          </Button>
        );
      }
    }

    if (booking.status === 'confirmed' && canDirectCancel) {
      actions.push(
        <Button key="cancel-confirmed" size="sm" variant="danger" onClick={() => handleUpdateStatus(booking.id, 'cancelled')}>
          Cancel Booking
        </Button>
      );
    }

    if (canRequestCancellation) {
      actions.push(
        <Button
          key="request-cancel"
          size="sm"
          variant="danger"
          onClick={() => handleRequestCancellation(booking)}
          disabled={!!cancellationLoadingMap[booking.id]}
        >
          {cancellationLoadingMap[booking.id] ? 'Requesting...' : 'Request Cancellation'}
        </Button>
      );
    }

    if (booking.status === 'confirmed' && (isAdmin() || isFieldOwner())) {
      actions.push(
        <Button key="complete" size="sm" variant="outline" onClick={() => handleUpdateStatus(booking.id, 'completed')}>
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
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-600">
            {canCreateBooking ? 'Manage your football field bookings' : 'Track your bookings here.'}
          </p>
        </div>
        <Button
          onClick={handleCreateBooking}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {canCreateBooking ? 'New Booking' : 'Request Captain Access'}
        </Button>
      </div>

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
              <option value="cancellation_pending">Cancellation Pending</option>
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
            filteredBookings.map((booking) => {
              const homeColors = getTeamJerseyColors(booking.team);
              const awayColors = booking.opponentTeam ? getTeamJerseyColors(booking.opponentTeam) : [];

              return (
              <div key={booking.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-3 mb-2">
                      {booking.field?.id ? (
                        <Link
                          to={`/app/fields/${booking.field.id}`}
                          className="text-lg font-medium text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                        >
                          {booking.field?.name || 'Unknown Field'}
                        </Link>
                      ) : (
                        <h3 className="text-lg font-medium text-gray-900">{booking.field?.name || 'Unknown Field'}</h3>
                      )}
                      <Badge tone={getStatusTone(booking.status)} className="capitalize">
                        {formatStatusLabel(booking.status)}
                      </Badge>
                      {booking.opponentTeam?.name ? (
                        <Badge tone="green">Matched</Badge>
                      ) : booking.openForOpponents ? (
                        <Badge tone="blue">Open for Opponents</Badge>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {booking.team?.name || 'No team'}
                        {booking.opponentTeam?.name ? ` vs ${booking.opponentTeam.name}` : ''}
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-900">${booking.totalPrice}</span>
                        <span className="text-gray-400 ml-1">({calculateDuration(booking.startTime, booking.endTime)}h)</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Booked by: {booking.creator?.firstName || booking.creator?.username || 'Unknown'} | Created:{' '}
                      {formatDate(booking.createdAt)}
                    </div>

                    {booking.status === 'pending' && isCaptainOwner(booking) && (
                      <div className="mt-2 inline-flex rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Waiting for owner approval. This slot is still open until confirmed.
                      </div>
                    )}

                    {booking.status === 'cancellation_pending' && (
                      <div className="mt-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
                        Cancellation requested. Waiting for field owner review.
                      </div>
                    )}

                    {booking.opponentTeam?.name && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-green-700 whitespace-nowrap overflow-hidden text-ellipsis">
                        Already matched: {booking.team?.name || 'Team A'} vs {booking.opponentTeam.name}
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
                          {homeColors.map((color, index) => (
                            <span key={`home-${color}-${index}`} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                          ))}
                          <span className="mx-0.5 text-gray-400">vs</span>
                          {awayColors.map((color, index) => (
                            <span key={`away-${color}-${index}`} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                          ))}
                        </span>
                      </div>
                    )}

                    {booking.opponentTeam?.name &&
                      isCaptainInMatchedBooking(booking) &&
                      booking.status !== 'cancelled' &&
                      booking.status !== 'completed' &&
                      booking.status !== 'cancellation_pending' && (
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

                    {isCaptainOwner(booking) &&
                      booking.status !== 'cancelled' &&
                      booking.status !== 'completed' &&
                      booking.status !== 'cancellation_pending' && (
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
            )})
          ) : (
            <div className="p-12 text-center">
              <EmptyState
                icon={CalendarIcon}
                title="No bookings found"
                description={
                  statusFilter === 'all' && openForOpponentsFilter === 'all'
                    ? canCreateBooking
                      ? 'Create your first booking to get started.'
                      : 'Please request to become captain in Settings.'
                    : 'No bookings found for the selected filters.'
                }
                actionLabel={canCreateBooking ? 'New Booking' : 'Request Captain Access'}
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
