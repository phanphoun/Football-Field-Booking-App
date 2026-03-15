import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';
import notificationService from '../services/notificationService';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Badge, Button, EmptyState, ImagePreviewModal, Spinner } from '../components/ui';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const resolveTeamLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
  const normalizedLogoPath = rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
  return `${API_ORIGIN}${normalizedLogoPath}`;
};

const PublicTeamsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deletingTeamId, setDeletingTeamId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const isAdmin = user?.role === 'admin';

  const canRequestJoin = (team) => {
    if (!isAuthenticated) return false;
    if (!user) return false;
    if (!['player', 'captain'].includes(user?.role || '')) return false;
    // Prevent captains from joining their own teams
    if (team.captainId === user?.id) return false;
    return true;
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamService.getPublicTeams();
        const teamsData = Array.isArray(response.data) ? response.data : [];
        setTeams(teamsData);
      } catch (err) {
        console.error('Failed to fetch public teams:', err);
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleRequestJoin = async (teamId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/teams/${teamId}` } });
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      const response = await teamService.joinTeam(teamId);
      if (response.success) {
        setSuccessMessage('Join request submitted!');
      }
    } catch (err) {
      setError(err?.error || 'Failed to submit join request');
    }
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
      setSuccessMessage(null);

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
      setTeams((prev) => prev.filter((team) => team.id !== teamId));
      setSuccessMessage('Team deleted successfully.');
      closeDeleteDialog();
    } catch (err) {
      setError(err?.error || 'Failed to delete team');
    } finally {
      setDeletingTeamId(null);
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
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isAdmin ? 'Admin view: view and delete teams.' : 'Discover football teams and request to join.'}
          </p>
        </div>
        <Badge tone="gray">{teams.length} results</Badge>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => {
            const teamLogoUrl = resolveTeamLogoUrl(team.logoUrl || team.logo_url || team.logo);

            return (
            <div
              key={team.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/teams/${team.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/teams/${team.id}`);
                }
              }}
              className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <div className="relative h-44">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <UsersIcon className="h-12 w-12 text-gray-300" />
                </div>
                {teamLogoUrl && (
                  <img
                    src={teamLogoUrl}
                    alt={`${team.name} logo`}
                    className="absolute inset-0 z-10 h-full w-full cursor-zoom-in object-cover object-center"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreviewImage({ url: teamLogoUrl, title: `${team.name} image` });
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{team.name}</h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{team.description || 'No description available.'}</p>
                  </div>
                  <Badge tone="gray">{team.memberCount || 0} members</Badge>
                </div>
              </div>

              <div className="px-6 text-sm text-gray-600 space-y-1">
                <div>Captain: {team.captain?.firstName || team.captain?.username || 'Unknown'}</div>
                {team.homeField?.name && <div>Home Field: {team.homeField.name}</div>}
                {team.skillLevel && (
                  <div className="flex items-center gap-2">
                    <span>Skill:</span>
                    <Badge tone="green" className="capitalize">
                      {team.skillLevel}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2 p-6 pt-5">
                <Button
                  as={Link}
                  to={`/teams/${team.id}`}
                  onClick={(event) => event.stopPropagation()}
                  variant="outline"
                  className="flex-1"
                >
                  View Details
                </Button>

                {isAdmin ? (
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      openDeleteDialog(team);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={deletingTeamId === team.id}
                  >
                    {deletingTeamId === team.id ? 'Deleting...' : 'Delete'}
                  </Button>
                ) : canRequestJoin(team) ? (
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRequestJoin(team.id);
                    }}
                    className="flex-1"
                  >
                    Request Join
                  </Button>
                ) : team.captainId === user?.id ? (
                  <Button
                    disabled
                    className="flex-1"
                  >
                    Your Team
                  </Button>
                ) : (
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate('/login', { state: { from: `/teams/${team.id}` } });
                    }}
                    className="flex-1"
                  >
                    Login to Join
                  </Button>
                )}
              </div>
            </div>
          )})
        ) : (
          <div className="col-span-full">
            <EmptyState icon={UsersIcon} title="No teams found" description="Check back later, or register as a captain to create a team." />
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
      <ImagePreviewModal
        open={Boolean(previewImage)}
        imageUrl={previewImage?.url}
        title={previewImage?.title || 'Team image'}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default PublicTeamsPage;
