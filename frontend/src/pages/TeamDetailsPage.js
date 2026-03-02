import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';
import { UsersIcon, MapPinIcon, ShieldCheckIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TeamDetailsPage = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);

  const isCaptainOfTeam = useMemo(() => {
    if (!team || !user) return false;
    return team.captainId === user.id;
  }, [team, user]);

  const membership = useMemo(() => {
    if (!team || !user) return null;
    const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
    return members.find((m) => m.userId === user.id) || null;
  }, [team, user]);

  const isInvited = useMemo(() => {
    return membership && membership.status === 'pending' && membership.isActive === false;
  }, [membership]);

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

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      setInviteError(null);
      setInviteSuccess(null);
      const response = await teamService.acceptInvite(id);
      if (response.success) {
        setInviteSuccess('You have joined the team');
        await refreshTeam();
      }
    } catch (err) {
      setInviteError(err?.error || 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setActionLoading(true);
      setInviteError(null);
      setInviteSuccess(null);
      const response = await teamService.declineInvite(id);
      if (response.success) {
        setInviteSuccess('Invitation declined');
        await refreshTeam();
      }
    } catch (err) {
      setInviteError(err?.error || 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo file size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('logo', file);

      const response = await teamService.uploadTeamLogo(id, formData);
      if (response.success) {
        setSuccessMessage('Team logo updated successfully!');
        await refreshTeam();
      }
    } catch (err) {
      setError(err?.error || 'Failed to upload logo');
    } finally {
      setActionLoading(false);
      // Clear the file input
      e.target.value = '';
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

      {inviteSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {inviteSuccess}
        </div>
      )}

      {inviteError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {inviteError}
        </div>
      )}

      {/* Team Logo Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Team Logo</h2>
          {isCaptainOfTeam && (
            <button
              onClick={() => document.getElementById('logo-upload').click()}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
            >
              Change Logo
            </button>
          )}
        </div>
        <div className="flex items-center justify-center">
          {team.logoUrl ? (
            <img 
              src={team.logoUrl.startsWith('http') ? team.logoUrl : `http://localhost:5000${team.logoUrl}`}
              alt={`${team.name} logo`}
              className="h-24 w-24 object-contain rounded-lg border border-gray-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`${team.logoUrl ? 'hidden' : 'flex'} h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50`}>
            <div className="text-center">
              <ShieldCheckIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">No logo</p>
            </div>
          </div>
        </div>
        {isCaptainOfTeam && (
          <div className="mt-4">
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="text-xs text-gray-500 text-center">
              Upload a team logo (JPG, PNG, GIF - Max 2MB)
            </p>
          </div>
        )}
      </div>

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
          ) : isInvited ? (
            <div className="flex flex-wrap gap-3">
              <div className="text-sm text-gray-700">You have been invited to join this team.</div>
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  {actionLoading ? '...' : 'Accept'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  {actionLoading ? '...' : 'Decline'}
                </button>
            </div>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Members</h2>
            {isCaptainOfTeam && (
              <span className="text-xs text-gray-500">{activeMembers.length}/{team.maxPlayers} players</span>
            )}
          </div>
          <div className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
            {activeMembers.length > 0 ? (
              activeMembers.map((m) => (
                <div key={m.userId} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {(m.user?.firstName || m.user?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {m.user?.firstName || m.user?.username || 'User'} {m.user?.lastName || ''}
                        </div>
                        {isCaptainOfTeam && (
                          <div className="text-xs text-gray-500">
                            {m.user?.email || 'No email'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 capitalize">{m.role}</div>
                      {isCaptainOfTeam && (
                        <div className="text-xs text-gray-400">
                          Joined: {new Date(m.createdAt || m.joinedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
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
