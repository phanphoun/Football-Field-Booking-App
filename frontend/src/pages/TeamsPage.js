import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import teamService from '../services/teamService';

const TeamsPage = () => {
  const { user, isCaptain, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamsAndInvitations = async () => {
      try {
        setLoading(true);
        const [teamsResponse, invitationsResponse] = await Promise.all([
          teamService.getAllTeams(),
          teamService.getMyInvitations()
        ]);
        // Ensure we always set an array, even if response.data is not an array
        const teamsData = Array.isArray(teamsResponse.data) ? teamsResponse.data : [];
        const invitationData = Array.isArray(invitationsResponse.data) ? invitationsResponse.data : [];
        setTeams(teamsData);
        setInvitations(invitationData);
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
    navigate('/teams/create');
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

  const extractApiArray = (response) => {
    if (!response) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.data?.data)) return response.data.data.data;
    return [];
  };

  const handleInvitationDecision = async (invitationId, status) => {
    try {
      await teamService.respondToInvitation(invitationId, status);
      setInvitations((prev) => prev.filter((invitation) => invitation.id !== invitationId));

      const response = await teamService.getAllTeams();
      const teamsData = extractApiArray(response);
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to process invitation:', err);
      setError(`Failed to ${status === 'accepted' ? 'accept' : 'decline'} invitation`);
    }
  };

  const handleViewTeam = (teamId) => {
    navigate(`/app/teams/${teamId}`);
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
    return team.TeamMembers?.filter(member => member.status === 'active').length || 0;
  };

  // eslint-disable-next-line no-unused-vars
  const isUserInTeam = (team) => {
    return team.TeamMembers?.some(member => 
      member.userId === user?.id && member.status === 'active'
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
          {(isCaptain() || isAdmin()) && (
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
        <div className="mb-6 space-y-3">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-900">
                You&apos;ve been invited to join <strong>{invitation.team?.name || 'a team'}</strong>.
              </p>
              <div className="mt-2 text-xs text-blue-800 space-y-1">
                <p>
                  Captain:{' '}
                  {invitation.team?.captain?.firstName ||
                    invitation.team?.captain?.username ||
                    'Unknown'}
                </p>
                {invitation.team?.description && (
                  <p className="line-clamp-2">{invitation.team.description}</p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleInvitationDecision(invitation.id, 'accepted')}
                  className="bg-green-600 text-white px-4 py-1 rounded text-sm font-medium hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleInvitationDecision(invitation.id, 'declined')}
                  className="bg-red-600 text-white px-4 py-1 rounded text-sm font-medium hover:bg-red-700"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => (
            <div key={team.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
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
          ))
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
              {(isCaptain() || isAdmin()) && (
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
