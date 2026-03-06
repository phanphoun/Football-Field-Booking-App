import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, MapPinIcon, PlusIcon, CheckIcon, XMarkIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import teamService from '../services/teamService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const resolveTeamLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
  const normalizedLogoPath = rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
  return `${API_ORIGIN}${normalizedLogoPath}`;
};

const TeamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamsAndInvitations = async () => {
      try {
        setLoading(true);

        const [teamsRes, invitationsRes] = await Promise.all([
          teamService.getMyTeams(),
          teamService.getMyInvitations()
        ]);
        setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
        setInvitations(Array.isArray(invitationsRes.data) ? invitationsRes.data : []);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setError(err?.error || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamsAndInvitations();
  }, [user?.id]);

  const handleCreateTeam = () => {
    navigate('/app/teams/create');
  };

  // eslint-disable-next-line no-unused-vars
  const handleJoinTeam = async (teamId) => {
    try {
      await teamService.joinTeam(teamId);
      // Refresh teams list
      const response = await teamService.getAllTeams();
      const teamsData = Array.isArray(response.data) ? response.data : [];
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to join team:', err);
      setError('Failed to join team');
    }
  };

  const handleViewTeam = (teamId) => {
    navigate(`/app/teams/${teamId}`);
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
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
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
    return team.TeamMembers?.filter(member => member.status === 'accepted').length || 0;
  };

  // eslint-disable-next-line no-unused-vars
  const isUserInTeam = (team) => {
    return team.TeamMembers?.some(member => 
      member.userId === user?.id && member.status === 'accepted'
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
          <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>
          <p className="mt-1 text-sm text-gray-600">
            View your active teams and manage membership requests if you are a captain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/teams')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Browse Teams
          </button>
          {user && (
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
            <div key={team.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50 flex relative overflow-hidden shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      {teamLogoUrl && (
                        <img
                          src={teamLogoUrl}
                          alt={`${team.name} logo`}
                          className="w-full h-full object-contain rounded-lg border border-gray-200 bg-white relative z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">{team.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
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

                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewTeam(team.id)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Open
                  </button>
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
              {user && (
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
    </div>
  );
};

export default TeamsPage;
