import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, MapPinIcon, PlusIcon, CheckIcon, XMarkIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import teamService from '../services/teamService';
import notificationService from '../services/notificationService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const resolveTeamLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
  const normalizedLogoPath = rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
  return `${API_ORIGIN}${normalizedLogoPath}`;
};

const normalizeTeamsResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.teams)) return payload.teams;
  return [];
};

const TeamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [error, setError] = useState(null);
  const isAdmin = user?.role === 'admin';
  const canCreateTeam = !!user && !isAdmin && user?.role !== 'player';

  useEffect(() => {
    const fetchTeamsAndInvitations = async () => {
      try {
        setLoading(true);
        const [teamsRes, invitationsRes] = await Promise.all([
          isAdmin ? teamService.getAllTeams({ limit: 200 }) : teamService.getMyTeams(),
          isAdmin ? Promise.resolve({ data: [] }) : teamService.getMyInvitations()
        ]);
        setTeams(normalizeTeamsResponse(teamsRes.data));
        setInvitations(Array.isArray(invitationsRes.data) ? invitationsRes.data : []);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setError(err?.error || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamsAndInvitations();
  }, [user?.id, isAdmin]);

  const handleCreateTeam = () => {
    navigate('/app/teams/create');
  };

  // eslint-disable-next-line no-unused-vars
  const handleJoinTeam = async (teamId) => {
    try {
      await teamService.joinTeam(teamId);
      // Refresh teams list
      const response = await teamService.getAllTeams();
      const teamsData = normalizeTeamsResponse(response.data);
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to join team:', err);
      setError('Failed to join team');
    }
  };

  const handleViewTeam = (teamId) => {
    navigate(`/app/teams/${teamId}`);
  };

  const openDeleteDialog = (team) => {
    setTeamToDelete(team);
    setDeleteMessage('');
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
    setDeleteMessage('');
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete?.id) return;
    const message = deleteMessage.trim();
    if (!message) {
      setError('Please enter a message to captain before deleting.');
      return;
    }

    const teamId = teamToDelete.id;
    try {
      setDeletingTeamId(teamId);
      setError(null);
      const captainUserId = teamToDelete?.captainId || teamToDelete?.captain?.id;

      if (captainUserId) {
        await notificationService.create({
          userId: captainUserId,
          type: 'system',
          title: `Team deleted by admin: ${teamToDelete.name}`,
          message,
          metadata: {
            event: 'team_deleted_by_admin',
            teamId: teamToDelete.id,
            teamName: teamToDelete.name,
            actorId: user?.id
          }
        });
      }

      await teamService.deleteTeam(teamId);
      setTeams((prev) => prev.filter((item) => item.id !== teamId));
      closeDeleteDialog();
    } catch (err) {
      setError(err?.error || 'Failed to delete team');
    } finally {
      setDeletingTeamId(null);
    }
  };

  const handleAcceptInvite = async (teamId) => {
    try {
      setActionLoading(true);
      setError(null);
      await teamService.acceptInvite(teamId);
      const [teamsRes, invitationsRes] = await Promise.all([
        teamService.getMyTeams(),
        teamService.getMyInvitations()
      ]);
      setTeams(normalizeTeamsResponse(teamsRes.data));
      setInvitations(Array.isArray(invitationsRes.data) ? invitationsRes.data : []);
    } catch (err) {
      setError(err?.error || 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvite = async (teamId) => {
    try {
      setActionLoading(true);
      setError(null);
      await teamService.declineInvite(teamId);
      const invitationsRes = await teamService.getMyInvitations();
      setInvitations(Array.isArray(invitationsRes.data) ? invitationsRes.data : []);
    } catch (err) {
      setError(err?.error || 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
      professional: 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  // eslint-disable-next-line no-unused-vars
  const getPreferredTimeColor = (time) => {
    const colors = {
      morning: 'bg-blue-100 text-blue-800',
      evening: 'bg-purple-100 text-purple-800',
      flexible: 'bg-green-100 text-green-800'
    };
    return colors[time] || 'bg-gray-100 text-gray-800';
  };

  // eslint-disable-next-line no-unused-vars
  const calculateWinRate = (wins, losses, draws) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  // eslint-disable-next-line no-unused-vars
  const getMemberCount = (team) => {
    return team.TeamMembers?.filter(member => member.status === 'active' && member.isActive !== false).length || 0;
  };

  // eslint-disable-next-line no-unused-vars
  const isUserInTeam = (team) => {
    return team.TeamMembers?.some(member => 
      member.userId === user?.id && member.status === 'active' && member.isActive !== false
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? 'All Teams' : 'My Teams'}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isAdmin
              ? 'Admin view of all teams. You can open or delete any team.'
              : 'View your active teams and manage membership requests if you are a captain'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/teams')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Browse Teams
          </button>
          {canCreateTeam && (
            <button
              onClick={handleCreateTeam}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Team
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {invitations.length > 0 && (
        <div className="mb-8 bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-amber-900 inline-flex items-center gap-2">
              <BellAlertIcon className="h-4 w-4" />
              Team Invitations
            </h2>
            <span className="text-xs text-amber-700">{invitations.length} pending</span>
          </div>
          <div className="p-4 space-y-3">
            {invitations.map((team) => (
              <div key={team.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{team.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Invited by: {team.captain?.firstName || team.captain?.username || 'Captain'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptInvite(team.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(team.id)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Decline
                  </button>
                  <button
                    onClick={() => handleViewTeam(team.id)}
                    className="px-3 py-2 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    View Team
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => {
            const teamLogoUrl = resolveTeamLogoUrl(team.logoUrl || team.logo_url || team.logo);

            return (
            <div key={team.id} className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="relative h-48">
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <UsersIcon className="h-14 w-14 text-gray-300" />
                </div>
                {teamLogoUrl && (
                  <img
                    src={teamLogoUrl}
                    alt={`${team.name} logo`}
                    className="relative z-10 h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{team.name}</h3>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(team.skillLevel)}`}>
                      {team.skillLevel}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    Captain: {team.captain?.firstName || team.captain?.username || 'Unknown'}
                  </div>
                  {team.homeField && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {team.homeField.name}
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 min-h-[40px] line-clamp-2">
                  {team.description || 'No description available.'}
                </p>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewTeam(team.id)}
                    className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => openDeleteDialog(team)}
                      disabled={deletingTeamId === team.id}
                      className="border border-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {deletingTeamId === team.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )})
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Browse teams to request to join, or create your own team if you are a captain.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => navigate('/teams')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Browse Teams
              </button>
              {canCreateTeam && (
                <button
                  onClick={handleCreateTeam}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Team
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {deleteDialogOpen && teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Delete Team</h2>
              <p className="mt-1 text-sm text-gray-600">
                Send a message to captain before deleting <span className="font-semibold">{teamToDelete.name}</span>.
              </p>
            </div>
            <div className="px-5 py-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Message to captain</label>
              <textarea
                value={deleteMessage}
                onChange={(e) => setDeleteMessage(e.target.value)}
                rows={4}
                placeholder="Explain why this team is being deleted..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingTeamId === teamToDelete.id}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={deletingTeamId === teamToDelete.id}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingTeamId === teamToDelete.id ? 'Deleting...' : 'Send & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
