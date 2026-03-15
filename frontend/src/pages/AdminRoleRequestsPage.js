import React, { useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { useDialog } from '../components/ui';

const FILTER_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' }
];

const roleLabel = (role) => {
  if (role === 'field_owner') return 'Field Owner';
  return role === 'captain' ? 'Captain' : role;
};

const statusClass = (status) => {
  if (status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
};

const AdminRoleRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [flash, setFlash] = useState(null);
  const { confirm } = useDialog();

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.getAdminRoleRequests(filter);
      setRequests(Array.isArray(response.data?.requests) ? response.data.requests : []);
    } catch (error) {
      setFlash({ type: 'error', message: error.error || 'Failed to load role requests.' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === 'pending').length,
      approved: requests.filter((item) => item.status === 'approved').length,
      rejected: requests.filter((item) => item.status === 'rejected').length
    };
  }, [requests]);

  const visibleRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((request) => {
      const requester = request.requester || {};
      const fullName = `${requester.firstName || ''} ${requester.lastName || ''}`.trim().toLowerCase();
      return (
        fullName.includes(keyword) ||
        String(requester.username || '').toLowerCase().includes(keyword) ||
        String(requester.email || '').toLowerCase().includes(keyword) ||
        String(request.requestedRole || '').toLowerCase().includes(keyword)
      );
    });
  }, [requests, search]);

  const handleReview = async (requestId, action) => {
    const confirmed = await confirm(`Are you sure you want to ${action} this request?`, {
      title: `${action === 'approve' ? 'Approve' : 'Reject'} Request`
    });
    if (!confirmed) return;

    try {
      setSubmittingId(requestId);
      await authService.reviewRoleRequest(requestId, action);
      setFlash({ type: 'success', message: `Request ${action === 'approve' ? 'approved' : 'rejected'}.` });
      await loadRequests();
    } catch (error) {
      setFlash({ type: 'error', message: error.error || 'Failed to review request.' });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Requests</h1>
          <p className="mt-1 text-sm text-gray-600">Review captain and field owner access requests.</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {flash && (
        <div className={`rounded-md border px-4 py-3 text-sm ${flash.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {flash.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Approved</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{stats.approved}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{stats.rejected}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, email, name, or role"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-gray-500">Loading requests...</div>
        ) : visibleRequests.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-gray-500">No role requests found.</div>
        ) : (
          visibleRequests.map((request) => {
            const requester = request.requester || {};
            const reviewer = request.reviewer || null;
            const isSubmitting = submittingId === request.id;
            const displayName = `${requester.firstName || ''} ${requester.lastName || ''}`.trim() || requester.username;

            return (
              <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {displayName}
                      <span className="ml-2 text-xs font-normal text-gray-500">@{requester.username}</span>
                    </p>
                    <p className="text-xs text-gray-500">{requester.email}</p>
                    <p className="text-sm text-gray-700">
                      Requested role: <span className="font-semibold">{roleLabel(request.requestedRole)}</span>
                    </p>
                    {request.note && <p className="text-sm text-gray-600">Note: {request.note}</p>}
                    <p className="text-xs text-gray-500">Submitted: {new Date(request.createdAt).toLocaleString()}</p>
                    {reviewer && request.reviewedAt && (
                      <p className="text-xs text-gray-500">Reviewed by {reviewer.username} at {new Date(request.reviewedAt).toLocaleString()}</p>
                    )}
                  </div>

                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                {request.status === 'pending' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleReview(request.id, 'approve')}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleReview(request.id, 'reject')}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminRoleRequestsPage;
