import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';
import { UsersIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const TeamDetailsPage = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const isCaptainOfTeam = useMemo(() => {
    if (!team || !user) return false;
    return team.captainId === user.id;
  }, [team, user]);

  const membership = useMemo(() => {
    if (!team || !user) return null;
    const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
    return members.find((m) => m.userId === user.id) || null;
  }, [team, user]);

  const refreshTeam = useCallback(async () => {
    const response = await teamService.getTeamById(id);
    setTeam(response.data || null);
  }, [id]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshTeam();
      } catch (err) {
        console.error('Failed to fetch team:', err);
        setError('Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id, refreshTeam]);

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      const response = await teamService.joinTeam(id);
      if (response.success) {
        setSuccessMessage('Join request submitted!');
        await refreshTeam();
      }
    } catch (err) {
      setError(err?.error || 'Failed to submit join request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      const response = await teamService.leaveTeam(id);
      if (response.success) {
        setSuccessMessage('You left the team.');
        await refreshTeam();
      }
    } catch (err) {
      setError(err?.error || 'Failed to leave team');
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

  const activeMembers = Array.isArray(team.teamMembers)
    ? team.teamMembers.filter((m) => m.status === 'active')
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Captain: {team.captain?.firstName || team.captain?.username || 'Unknown'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/teams')}
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          {(isCaptainOfTeam || isAdmin()) && (
            <Link
              to={`/app/teams/${team.id}/manage`}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Manage
            </Link>
          )}
        </div>
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

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {team.description && <p className="text-gray-700">{team.description}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <UsersIcon className="h-5 w-5 mr-2 text-gray-400" />
            {activeMembers.length}/{team.maxPlayers} active members
          </div>
          {team.homeField && (
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
              {team.homeField.name}
            </div>
          )}
          {team.skillLevel && (
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span className="capitalize">{team.skillLevel}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {isCaptainOfTeam ? (
            <div className="text-sm text-gray-700">You are the captain of this team.</div>
          ) : membership?.status === 'pending' ? (
            <div className="text-sm text-gray-700">Join request pending approval.</div>
          ) : membership?.status === 'active' ? (
            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? 'Leaving...' : 'Leave Team'}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={actionLoading}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? 'Requesting...' : 'Request to Join'}
            </button>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900">Members</h2>
          <div className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
            {activeMembers.length > 0 ? (
              activeMembers.map((m) => (
                <div key={m.userId} className="px-4 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-900">
                    {m.user?.firstName || m.user?.username || 'User'} {m.user?.lastName || ''}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{m.role}</div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">No active members yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailsPage;
