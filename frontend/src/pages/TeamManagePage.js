import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';

const TeamManagePage = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const isCaptainOfTeam = useMemo(() => {
    if (!team || !user) return false;
    return team.captainId === user.id;
  }, [team, user]);

  const refresh = useCallback(async () => {
    const [teamRes, membersRes, requestsRes] = await Promise.all([
      teamService.getTeamById(id),
      teamService.getTeamMembers(id),
      teamService.getJoinRequests(id)
    ]);

    setTeam(teamRes.data || null);
    setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        setError(err?.error || 'Failed to load team management data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, refresh]);

  const handleUpdateRequest = async (requestUserId, nextStatus) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      await teamService.updateMember(id, requestUserId, { status: nextStatus });
      setSuccessMessage(nextStatus === 'active' ? 'Request approved.' : 'Request denied.');
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      await teamService.removeMember(id, memberUserId);
      setSuccessMessage('Member removed.');
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900">Team not found</h1>
        <Link to="/app/teams" className="mt-4 inline-block text-green-700 hover:text-green-800">
          Back to Teams
        </Link>
      </div>
    );
  }

  if (!isCaptainOfTeam && !isAdmin()) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-lg font-semibold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-600">Only the captain (or admin) can manage this team.</p>
      </div>
    );
  }

  const activeMembers = Array.isArray(members)
    ? members.filter((m) => m.status === 'active' && m.isActive !== false)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Team</h1>
          <p className="mt-1 text-sm text-gray-600">{team.name}</p>
        </div>
        <Link
          to={`/app/teams/${team.id}`}
          className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Pending Requests</h2>
          </div>
          <div className="p-6">
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.userId} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                    <div className="text-sm text-gray-900">
                      {req.user?.firstName || req.user?.username || 'User'} {req.user?.lastName || ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateRequest(req.userId, 'active')}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateRequest(req.userId, 'inactive')}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-6">No pending requests.</div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Active Members</h2>
          </div>
          <div className="p-6">
            {activeMembers.length > 0 ? (
              <div className="space-y-3">
                {activeMembers.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                    <div className="text-sm text-gray-900">
                      {m.user?.firstName || m.user?.username || 'User'} {m.user?.lastName || ''}
                      <span className="ml-2 text-xs text-gray-500 capitalize">({m.role})</span>
                    </div>
                    {m.userId !== team.captainId && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleRemoveMember(m.userId)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-6">No active members.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagePage;
