import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  UserPlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';
import userService from '../services/userService';
import MemberDetailsModal from '../components/ui/MemberDetailsModal';

const TeamManagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [searchingPlayers, setSearchingPlayers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  useEffect(() => {
    const term = inviteEmail.trim();
    if (!term || term.length < 2) {
      setSuggestions([]);
      setSearchingPlayers(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setSearchingPlayers(true);
        const res = await userService.searchUsers(term, { role: 'player', teamId: id });
        if (!cancelled) {
          setSuggestions(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSearchingPlayers(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [inviteEmail, id]);

  const handleInviteChange = (value) => {
    setInviteEmail(value);
    setSelectedInvite(null);
    setInviteError(null);
    setInviteSuccess(null);
  };

  const chooseSuggestion = (candidate) => {
    setInviteEmail(candidate.email || '');
    setSelectedInvite(candidate);
    setSuggestions([]);
  };

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

  // Note: modal rendered via selectedMember state below

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
  const pendingCount = Array.isArray(requests) ? requests.length : 0;
  
  const handleInvite = async () => {
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setInviteError('Player email is required');
      return;
    }
    try {
      setActionLoading(true);
      setInviteError(null);
      setInviteSuccess(null);
      const data = {
        email: selectedInvite?.email ? selectedInvite.email.toLowerCase() : normalizedEmail
      };
      const response = await teamService.inviteMember(id, data);
      if (response.success) {
        setInviteSuccess('Invitation sent');
        setInviteEmail('');
        setSelectedInvite(null);
        setSuggestions([]);
        await refresh();
      }
    } catch (err) {
      setInviteError(err?.error || 'Failed to send invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const openMemberDetails = (member) => {
    setSelectedMember(member);
  };

  const closeMemberDetails = () => setSelectedMember(null);

  const handleDeleteTeam = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await teamService.deleteTeam(id);
      setSuccessMessage('Team deleted successfully');
      setTimeout(() => {
        navigate('/app/teams');
      }, 1000);
    } catch (err) {
      setError(err?.error || 'Failed to delete team');
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {selectedMember && (
        <MemberDetailsModal member={selectedMember} onClose={closeMemberDetails} />
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="mt-1 text-sm text-gray-600">{team.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                <UsersIcon className="h-3.5 w-3.5" />
                {activeMembers.length} Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                {pendingCount} Pending
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/app/teams/${team.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Link>
            {isCaptainOfTeam && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Team
              </button>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Team</h3>
          <p className="text-red-800 mb-4">
            Are you sure you want to delete <strong>{team.name}</strong>? This action cannot be undone and all team data will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDeleteTeam}
              disabled={actionLoading}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Yes, Delete Team'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={actionLoading}
              className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
        {/* invite form column */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Invite Player</h2>
              <p className="text-xs text-gray-500 mt-1">Only existing player accounts can be invited.</p>
            </div>
            <UserPlusIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="p-6 space-y-4">
            {inviteSuccess && (
              <div className="text-sm text-green-700 inline-flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                {inviteSuccess}
              </div>
            )}
            {inviteError && (
              <div className="text-sm text-red-700 inline-flex items-center gap-2">
                <XCircleIcon className="h-4 w-4" />
                {inviteError}
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inviteEmail}
                  onChange={(e) => handleInviteChange(e.target.value)}
                  placeholder="Type player name, username, or email"
                  className="w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                {searchingPlayers && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md px-3 py-2 text-xs text-gray-500">
                    Searching players...
                  </div>
                )}
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md max-h-44 overflow-auto">
                    {suggestions.map((u) => (
                      <li
                        key={u.id}
                        onClick={() => chooseSuggestion(u)}
                        className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="font-medium">{u.firstName || u.username} {u.lastName || ''}</div>
                        <div className="text-xs text-gray-500">{u.username} {u.email ? `- ${u.email}` : ''}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={handleInvite}
                disabled={actionLoading || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50"
              >
                <UserPlusIcon className="h-4 w-4" />
                {actionLoading ? 'Sending...' : 'Invite'}
              </button>
            </div>
            {selectedInvite && (
              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                Selected: <span className="font-medium">{selectedInvite.firstName || selectedInvite.username}</span> ({selectedInvite.email})
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Pending Requests</h2>
            <span className="text-xs text-gray-500">{pendingCount} requests</span>
          </div>
          <div className="p-6">
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.userId} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{req.user?.firstName || req.user?.username || 'User'} {req.user?.lastName || ''}</div>
                      <div className="text-xs text-gray-500">@{req.user?.username || 'unknown'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateRequest(req.userId, 'active')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateRequest(req.userId, 'inactive')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-3.5 w-3.5" />
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

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Active Members</h2>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <UserGroupIcon className="h-4 w-4" />
              {activeMembers.length} members
            </span>
          </div>
          <div className="p-6">
            {activeMembers.length > 0 ? (
              <div className="space-y-3">
                {activeMembers.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="text-sm text-gray-900 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                        {(m.user?.firstName || m.user?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <button onClick={() => openMemberDetails(m)} className="text-left">
                        <div className="font-medium">{m.user?.firstName || m.user?.username || 'User'}</div>
                        <div className="text-xs text-gray-500">{m.user?.username}</div>
                      </button>
                      <span className="ml-2 text-xs text-gray-500 capitalize">({m.role})</span>
                    </div>
                    {m.userId !== team.captainId && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleRemoveMember(m.userId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-50"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
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

