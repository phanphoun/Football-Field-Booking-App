import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellAlertIcon,
  CheckIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import teamService from '../services/teamService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const NotificationsPage = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadNotifications = async () => {
    const response = await apiService.get('/notifications');
    setNotifications(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadNotifications();
      } catch (err) {
        setError(err?.error || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredNotifications = useMemo(() => {
    const byType = {
      all: () => true,
      invites: (n) => n.type === 'team_invite',
      requests: (n) => ['team_join_request', 'team_leave_request'].includes(n.metadata?.event)
    };
    return notifications.filter(byType[activeFilter] || byType.all);
  }, [notifications, activeFilter]);

  const markAsRead = async (notificationId) => {
    await apiService.put(`/notifications/${notificationId}`, {
      isRead: true,
      readAt: new Date().toISOString()
    });
  };

  const extractTeamNameFromNotification = (notification) => {
    const title = notification?.title || '';
    const titlePrefix = 'Invitation to join ';
    if (title.startsWith(titlePrefix)) {
      return title.slice(titlePrefix.length).trim().toLowerCase();
    }

    const message = notification?.message || '';
    const quoted = message.match(/"([^"]+)"/);
    if (quoted?.[1]) return quoted[1].trim().toLowerCase();
    return '';
  };

  const resolveInviteTeamId = async (notification) => {
    if (notification?.metadata?.teamId) return notification.metadata.teamId;

    const invitationsResponse = await teamService.getMyInvitations();
    const invitations = Array.isArray(invitationsResponse?.data) ? invitationsResponse.data : [];
    if (invitations.length === 0) return null;

    const targetTeamName = extractTeamNameFromNotification(notification);
    const inviterId = notification?.metadata?.inviterId;

    const byName = targetTeamName
      ? invitations.find((team) => (team?.name || '').trim().toLowerCase() === targetTeamName)
      : null;
    if (byName?.id) return byName.id;

    const byInviter = inviterId
      ? invitations.find((team) => Number(team?.captain?.id) === Number(inviterId))
      : null;
    if (byInviter?.id) return byInviter.id;

    if (invitations.length === 1 && invitations[0]?.id) return invitations[0].id;
    return null;
  };

  const handleInviteAction = async (notification, action) => {
    try {
      setActionLoading(true);
      setError(null);
      const teamId = await resolveInviteTeamId(notification);
      if (!teamId) {
        throw new Error('Cannot find invitation team. Please refresh and try again.');
      }
      if (action === 'accept') {
        await teamService.acceptInvite(teamId);
      } else {
        await teamService.declineInvite(teamId);
      }
      await markAsRead(notification.id);
      await loadNotifications();
    } catch (err) {
      setError(err?.error || `Failed to ${action} invitation`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkRead = async (notification) => {
    try {
      setActionLoading(true);
      setError(null);
      await markAsRead(notification.id);
      await loadNotifications();
    } catch (err) {
      setError(err?.error || 'Failed to update notification');
    } finally {
      setActionLoading(false);
    }
  };

  const canRespondToInvite = (notification) => {
    return (
      !notification?.isRead &&
      notification?.type === 'team_invite'
    );
  };

  const canRespondToLeaveRequest = (notification) => {
    const title = String(notification?.title || '').toLowerCase();
    return (
      !notification?.isRead &&
      (
        notification?.metadata?.event === 'team_leave_request' ||
        title.startsWith('leave request for ')
      )
    );
  };

  const canRespondToJoinRequest = (notification) => {
    const title = String(notification?.title || '').toLowerCase();
    return (
      !notification?.isRead &&
      (
        notification?.metadata?.event === 'team_join_request' ||
        title.startsWith('join request for ')
      )
    );
  };

  const extractLeaveRequestTeamName = (notification) => {
    const title = String(notification?.title || '');
    const titlePrefix = 'Leave request for ';
    if (title.startsWith(titlePrefix)) {
      return title.slice(titlePrefix.length).trim().toLowerCase();
    }
    const message = String(notification?.message || '');
    const quoted = message.match(/"([^"]+)"/);
    if (quoted?.[1]) return quoted[1].trim().toLowerCase();
    return '';
  };

  const extractLeaveRequesterName = (notification) => {
    const message = String(notification?.message || '');
    const match = message.match(/^(.*?)\s+requested to leave/i);
    return match?.[1]?.trim().toLowerCase() || '';
  };

  const resolveLeaveRequestContext = async (notification) => {
    let teamId = notification?.metadata?.teamId || null;
    let requesterId = notification?.metadata?.requesterId || notification?.sender?.id || null;

    if (!teamId) {
      const captainedRes = await teamService.getCaptainedTeams();
      const captainedTeams = Array.isArray(captainedRes?.data) ? captainedRes.data : [];
      const teamName = extractLeaveRequestTeamName(notification);
      const byName = teamName
        ? captainedTeams.find((team) => String(team?.name || '').trim().toLowerCase() === teamName)
        : null;
      teamId = byName?.id || (captainedTeams.length === 1 ? captainedTeams[0]?.id : null);
    }

    if (!requesterId && teamId) {
      const membersRes = await teamService.getTeamMembers(teamId);
      const members = Array.isArray(membersRes?.data) ? membersRes.data : [];
      const senderName = String(resolveSenderName(notification) || '').trim().toLowerCase();
      const requesterName = extractLeaveRequesterName(notification);
      const byName = members.find((member) => {
        const userData = member?.user || {};
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim().toLowerCase();
        const username = String(userData.username || '').trim().toLowerCase();
        return (
          (senderName && (fullName === senderName || username === senderName)) ||
          (requesterName && (fullName === requesterName || username === requesterName))
        );
      });
      requesterId = byName?.userId || byName?.user?.id || null;
    }

    return { teamId, requesterId };
  };

  const extractJoinRequestTeamName = (notification) => {
    const title = String(notification?.title || '');
    const titlePrefix = 'Join request for ';
    if (title.startsWith(titlePrefix)) {
      return title.slice(titlePrefix.length).trim().toLowerCase();
    }
    const message = String(notification?.message || '');
    const quoted = message.match(/"([^"]+)"/);
    if (quoted?.[1]) return quoted[1].trim().toLowerCase();
    return '';
  };

  const extractJoinRequesterName = (notification) => {
    const message = String(notification?.message || '');
    const match = message.match(/^(.*?)\s+requested to join/i);
    return match?.[1]?.trim().toLowerCase() || '';
  };

  const resolveJoinRequestContext = async (notification) => {
    let teamId = notification?.metadata?.teamId || null;
    let requesterId = notification?.metadata?.requesterId || notification?.sender?.id || null;

    if (!teamId) {
      const captainedRes = await teamService.getCaptainedTeams();
      const captainedTeams = Array.isArray(captainedRes?.data) ? captainedRes.data : [];
      const teamName = extractJoinRequestTeamName(notification);
      const byName = teamName
        ? captainedTeams.find((team) => String(team?.name || '').trim().toLowerCase() === teamName)
        : null;
      teamId = byName?.id || (captainedTeams.length === 1 ? captainedTeams[0]?.id : null);
    }

    if (!requesterId && teamId) {
      const membersRes = await teamService.getTeamMembers(teamId);
      const members = Array.isArray(membersRes?.data) ? membersRes.data : [];
      const senderName = String(resolveSenderName(notification) || '').trim().toLowerCase();
      const requesterName = extractJoinRequesterName(notification);
      const byName = members.find((member) => {
        if (member?.status !== 'pending') return false;
        const userData = member?.user || {};
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim().toLowerCase();
        const username = String(userData.username || '').trim().toLowerCase();
        return (
          (senderName && (fullName === senderName || username === senderName)) ||
          (requesterName && (fullName === requesterName || username === requesterName))
        );
      });
      requesterId = byName?.userId || byName?.user?.id || null;
    }

    return { teamId, requesterId };
  };

  const handleLeaveRequestAction = async (notification, action) => {
    try {
      setActionLoading(true);
      setError(null);
      const { teamId, requesterId } = await resolveLeaveRequestContext(notification);
      if (!teamId || !requesterId) {
        throw new Error('Cannot resolve leave request details. Please open the team page and manage members there.');
      }
      await teamService.respondLeaveRequest(teamId, requesterId, action);
      await markAsRead(notification.id);
      await loadNotifications();
    } catch (err) {
      setError(err?.error || `Failed to ${action} leave request`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRequestAction = async (notification, action) => {
    try {
      setActionLoading(true);
      setError(null);
      const { teamId, requesterId } = await resolveJoinRequestContext(notification);
      if (!teamId || !requesterId) {
        throw new Error('Cannot resolve join request details. Please open the team page and manage requests there.');
      }
      await teamService.updateMember(teamId, requesterId, {
        status: action === 'accept' ? 'active' : 'inactive'
      });
      await markAsRead(notification.id);
      await loadNotifications();
    } catch (err) {
      setError(err?.error || `Failed to ${action} join request`);
    } finally {
      setActionLoading(false);
    }
  };

  const resolveSenderName = (notification) => {
    return notification?.sender?.name || notification?.sender?.username || 'Unknown user';
  };

  const resolveSenderAvatar = (notification) => {
    const rawAvatar = notification?.sender?.avatarUrl;
    if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    return `${API_ORIGIN}${rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications & Requests</h1>
        <p className="mt-1 text-sm text-gray-600">
          View all team invitations and request updates in one place.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'invites', label: 'Invitations' },
            { key: 'requests', label: 'Join Requests' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                activeFilter === tab.key
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <InboxIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No notifications found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${
                    notification.isRead ? 'border-gray-200 bg-white' : 'border-emerald-200 bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
                        {notification.type === 'team_invite' ? (
                          <BellAlertIcon className="h-4 w-4 text-amber-500" />
                        ) : (
                          <ClipboardDocumentCheckIcon className="h-4 w-4 text-blue-500" />
                        )}
                        {notification.title}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      {notification.sender && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1">
                          <img
                            src={resolveSenderAvatar(notification)}
                            alt={`${resolveSenderName(notification)} avatar`}
                            className="h-5 w-5 rounded-full object-cover border border-gray-200 bg-gray-100"
                            onError={(e) => {
                              const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                              if (e.currentTarget.src !== fallbackUrl) {
                                e.currentTarget.src = fallbackUrl;
                              }
                            }}
                          />
                          <span className="text-[11px] text-gray-700">
                            Sender: <span className="font-semibold">{resolveSenderName(notification)}</span>
                          </span>
                        </div>
                      )}
                      <p className="text-[11px] text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        New
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {canRespondToInvite(notification) && (
                      <>
                        <button
                          onClick={() => handleInviteAction(notification, 'accept')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleInviteAction(notification, 'decline')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Decline
                        </button>
                      </>
                    )}

                    {canRespondToLeaveRequest(notification) && (
                      <>
                        <button
                          onClick={() => handleLeaveRequestAction(notification, 'accept')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve Leave
                        </button>
                        <button
                          onClick={() => handleLeaveRequestAction(notification, 'decline')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Decline
                        </button>
                      </>
                    )}

                    {canRespondToJoinRequest(notification) && (
                      <>
                        <button
                          onClick={() => handleJoinRequestAction(notification, 'accept')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve Join
                        </button>
                        <button
                          onClick={() => handleJoinRequestAction(notification, 'decline')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Decline
                        </button>
                      </>
                    )}

                    {notification.metadata?.teamId && (
                      <button
                        onClick={() => navigate(`/app/teams/${notification.metadata.teamId}`)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        View Team
                      </button>
                    )}

                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkRead(notification)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
