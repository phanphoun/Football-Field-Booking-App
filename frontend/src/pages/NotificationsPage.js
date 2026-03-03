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
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      requests: (n) => n.metadata?.event === 'team_join_request'
    };
    return notifications.filter(byType[activeFilter] || byType.all);
  }, [notifications, activeFilter]);

  const markAsRead = async (notificationId) => {
    await apiService.put(`/notifications/${notificationId}`, {
      isRead: true,
      readAt: new Date().toISOString()
    });
  };

  const handleInviteAction = async (notification, action) => {
    const teamId = notification?.metadata?.teamId;
    if (!teamId) return;
    try {
      setActionLoading(true);
      setError(null);
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
    return user?.role === 'player' && notification.type === 'team_invite' && !notification.isRead;
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
