import React, { useEffect, useMemo, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import notificationService from '../services/notificationService';
import realtimeService from '../services/realtimeService';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';

const toneByType = (type) => {
  const map = {
    booking: 'yellow',
    team_invite: 'blue',
    match_result: 'green',
    system: 'gray'
  };
  return map[type] || 'gray';
};

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    const res = await notificationService.getAll();
    setItems(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        setError(err?.error || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();

    const socket = realtimeService.connect({
      onMessage: (message) => {
        if (message?.event !== 'notification:new' || !message?.payload?.id) return;
        setItems((previous) => {
          const exists = previous.some((item) => item.id === message.payload.id);
          if (exists) return previous;
          return [message.payload, ...previous];
        });
      }
    });

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to mark notification as read');
    }
  };

  const markAll = async () => {
    try {
      await notificationService.markAllRead();
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to mark all notifications as read');
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
          <h1 className="text-2xl font-bold text-slate-900">Notification Center</h1>
          <p className="mt-1 text-sm text-slate-600">All your booking, team, and system updates in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="gray">{items.length} total</Badge>
          <Badge tone={unreadCount > 0 ? 'yellow' : 'gray'}>{unreadCount} unread</Badge>
          <Button variant="outline" size="sm" onClick={markAll}>
            Mark all read
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Latest notifications</h2>
        </CardHeader>
        <div className="border-t border-slate-200">
          {items.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {items.map((n) => (
                <CardBody
                  key={n.id}
                  className={`flex items-start justify-between gap-4 ${!n.isRead ? 'bg-amber-50/40' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{n.title}</h3>
                      <Badge tone={toneByType(n.type)}>{n.type}</Badge>
                      {!n.isRead && <Badge tone="yellow">new</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && (
                    <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </CardBody>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState icon={BellIcon} title="No notifications yet" description="You are all caught up." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
