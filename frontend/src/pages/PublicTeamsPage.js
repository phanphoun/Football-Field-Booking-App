import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import teamService from '../services/teamService';
import notificationService from '../services/notificationService';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Badge, Button, EmptyState, ImagePreviewModal, Spinner, useToast } from '../components/ui';
import { getTeamJerseyColors } from '../utils/teamColors';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const resolveTeamLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
  const normalizedLogoPath = rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
  return `${API_ORIGIN}${normalizedLogoPath}`;
};

<<<<<<< HEAD
const hasPendingJoinRequest = (team, userId) => {
  if (!team || !userId) return false;

  if (team.joinRequestPending || team.hasPendingJoinRequest || team.membershipStatus === 'pending' || team.userMembershipStatus === 'pending') {
    return true;
  }

  if (Array.isArray(team.teamMembers)) {
    return team.teamMembers.some((member) => member.userId === userId && member.status === 'pending');
  }

  return false;
=======
const formatSkillLevel = (skillLevel, text) => {
  const normalized = String(skillLevel || '').toLowerCase();
  if (normalized === 'beginner') return text('Beginner', 'ដំបូង');
  if (normalized === 'intermediate') return text('Intermediate', 'មធ្យម');
  if (normalized === 'advanced') return text('Advanced', 'ខ្ពស់');
  if (normalized === 'professional') return text('Professional', 'អាជីព');
  return skillLevel || text('Unknown', 'មិនស្គាល់');
};

const getActionErrorMessage = (error) => error?.error || error?.message || '';

const isAlreadyMemberError = (message) => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('already a member') || normalized.includes('already joined') || normalized.includes('already in this team');
};

const isPendingRequestError = (message) => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('pending request') || normalized.includes('already requested') || normalized.includes('request already') || normalized.includes('already has a pending');
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
};

const PublicTeamsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const text = (en, km) => (language === 'km' ? km : en);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [requestedTeamIds, setRequestedTeamIds] = useState({});
  const [memberTeamIds, setMemberTeamIds] = useState({});
  const [requestingTeamId, setRequestingTeamId] = useState(null);
  const [deletingTeamId, setDeletingTeamId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!successMessage) return;
    showToast(successMessage, { type: 'success', duration: 3200 });
    setSuccessMessage(null);
  }, [showToast, successMessage]);

  useEffect(() => {
    if (!error) return;
    showToast(error, { type: 'error', duration: 3600 });
    setError(null);
  }, [error, showToast]);

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
        const [response, myTeamsResponse] = await Promise.all([
          teamService.getPublicTeams(),
          isAuthenticated ? teamService.getMyTeams().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
        ]);
        const teamsData = Array.isArray(response.data) ? response.data : [];
        setTeams(teamsData);
        if (isAuthenticated) {
          const myTeams = Array.isArray(myTeamsResponse.data) ? myTeamsResponse.data : [];
          setMemberTeamIds(
            myTeams.reduce((accumulator, team) => {
              if (team?.id) accumulator[team.id] = true;
              return accumulator;
            }, {})
          );
        }
      } catch (err) {
        console.error('Failed to fetch public teams:', err);
        setError(text('Failed to load teams', 'មិនអាចផ្ទុកក្រុមបានទេ'));
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [isAuthenticated]);

  const handleRequestJoin = async (teamId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/teams/${teamId}`, backgroundLocation: location } });
      return;
    }

    try {
      setRequestingTeamId(teamId);
      setError(null);
      const response = await teamService.joinTeam(teamId);
      if (response.success) {
<<<<<<< HEAD
        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  joinRequestPending: true,
                  userMembershipStatus: 'pending'
                }
              : team
          )
        );
        setSuccessMessage('Join request submitted. Waiting for captain approval.');
      }
    } catch (err) {
      if ((err?.error || '').toLowerCase().includes('already pending')) {
        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  joinRequestPending: true,
                  userMembershipStatus: 'pending'
                }
              : team
          )
        );
        setSuccessMessage('Your join request is still waiting for captain approval.');
        setError(null);
        return;
      }
      setError(err?.error || 'Failed to submit join request');
=======
        setRequestedTeamIds((current) => ({ ...current, [teamId]: true }));
        setSuccessMessage(text('Join request submitted!', 'បានផ្ញើសំណើចូលរួម!'));
      }
    } catch (err) {
      const message = getActionErrorMessage(err);
      if (isAlreadyMemberError(message)) {
        setMemberTeamIds((current) => ({ ...current, [teamId]: true }));
        setError(text('You are already a member of this team.', 'អ្នកជាសមាជិកក្រុមនេះរួចហើយ។'));
      } else if (isPendingRequestError(message)) {
        setRequestedTeamIds((current) => ({ ...current, [teamId]: true }));
        setError(text('Your request is already pending for this team.', 'សំណើរបស់អ្នកសម្រាប់ក្រុមនេះកំពុងរង់ចាំរួចហើយ។'));
      } else {
        setError(message || text('Failed to submit join request', 'មិនអាចផ្ញើសំណើចូលរួមបានទេ'));
      }
    } finally {
      setRequestingTeamId(null);
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
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
      setError(text('Please enter a message to captain before deleting.', 'សូមបញ្ចូលសារទៅកាពីតែន មុននឹងលុប។'));
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
      setSuccessMessage(text('Team deleted successfully.', 'បានលុបក្រុមដោយជោគជ័យ។'));
      closeDeleteDialog();
    } catch (err) {
      setError(err?.error || text('Failed to delete team', 'មិនអាចលុបក្រុមបានទេ'));
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
          <h1 className="text-2xl font-bold text-gray-900">{text('Teams', 'ក្រុម')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isAdmin ? text('Admin view: view and delete teams.', 'ទិដ្ឋភាពអ្នកគ្រប់គ្រង: មើល និងលុបក្រុម។') : text('Discover football teams and request to join.', 'ស្វែងរកក្រុមបាល់ទាត់ ហើយស្នើចូលរួម។')}
          </p>
        </div>
        <Badge tone="gray">{text(`${teams.length} results`, `${teams.length} លទ្ធផល`)}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => {
            const teamLogoUrl = resolveTeamLogoUrl(team.logoUrl || team.logo_url || team.logo);
            const jerseyColors = getTeamJerseyColors(team);
<<<<<<< HEAD
            const joinRequestPending = hasPendingJoinRequest(team, user?.id);
=======
            const isRequested = Boolean(requestedTeamIds[team.id]);
            const isMember = Boolean(memberTeamIds[team.id]) || team.captainId === user?.id;
            const isRequesting = requestingTeamId === team.id;
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc

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
              <div className="relative h-52">
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
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{team.description || text('No description available.', 'មិនមានការពិពណ៌នា។')}</p>
                  </div>
                  <Badge tone="gray">{text(`${team.memberCount || 0} members`, `${team.memberCount || 0} សមាជិក`)}</Badge>
                </div>
              </div>

              <div className="px-6 text-sm text-gray-600 space-y-1">
                <div>{text('Captain:', 'កាពីតែន:')} {team.captain?.firstName || team.captain?.username || text('Unknown', 'មិនស្គាល់')}</div>
                {team.homeField?.name && <div>{text('Home Field:', 'ទីលានផ្ទះ:')} {team.homeField.name}</div>}
                {team.skillLevel && (
                  <div className="flex items-center gap-2">
                    <span>{text('Skill:', 'កម្រិត:')}</span>
                    <Badge tone="green" className="capitalize">
                      {formatSkillLevel(team.skillLevel, text)}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>{text('Jersey:', 'អាវក្រុម:')}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1">
                      {jerseyColors.map((color, index) => (
                        <span key={`${color}-${index}`} className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2 p-6 pt-5">
                <Button
                  as={Link}
                  to={`/teams/${team.id}`}
                  onClick={(event) => event.stopPropagation()}
                  variant="outline"
                  className="flex-1"
                >
                  {text('View Details', 'មើលព័ត៌មានលម្អិត')}
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
                    {deletingTeamId === team.id ? text('Deleting...', 'កំពុងលុប...') : text('Delete', 'លុប')}
                  </Button>
                ) : isMember ? (
                  <Button
                    disabled
                    className="flex-1"
                  >
                    {text('Your Team', 'ក្រុមរបស់អ្នក')}
                  </Button>
                ) : isRequested ? (
                  <Button
                    disabled
                    className="flex-1 bg-amber-500 hover:bg-amber-500 text-white disabled:opacity-100"
                  >
                    {text('Requested', 'បានស្នើ')}
                  </Button>
                ) : joinRequestPending ? (
                  <Button
                    disabled
                    className="flex-1 bg-amber-100 text-amber-800 hover:bg-amber-100"
                  >
                    Request Pending
                  </Button>
                ) : canRequestJoin(team) ? (
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRequestJoin(team.id);
                    }}
                    disabled={isRequesting}
                    className="flex-1"
                  >
                    {isRequesting ? text('Sending...', 'កំពុងផ្ញើ...') : text('Request Join', 'ស្នើចូលរួម')}
                  </Button>
                ) : (
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate('/login', { state: { from: `/teams/${team.id}`, backgroundLocation: location } });
                    }}
                    className="flex-1"
                  >
                    {text('Login to Join', 'ចូលគណនីដើម្បីចូលរួម')}
                  </Button>
                )}
              </div>
            </div>
          )})
        ) : (
          <div className="col-span-full">
            <EmptyState icon={UsersIcon} title={text('No teams found', 'មិនមានក្រុម')} description={text('Check back later, or register as a captain to create a team.', 'សូមពិនិត្យម្តងទៀតពេលក្រោយ ឬចុះឈ្មោះជាកាពីតែនដើម្បីបង្កើតក្រុម។')} />
          </div>
        )}
      </div>

      {deleteDialogOpen && teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{text('Delete Team', 'លុបក្រុម')}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {text('Send a message to captain before deleting', 'ផ្ញើសារទៅកាពីតែន មុននឹងលុប')} <span className="font-semibold">{teamToDelete.name}</span>.
              </p>
            </div>
            <div className="px-5 py-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">{text('Message to captain', 'សារទៅកាពីតែន')}</label>
              <textarea
                value={deleteMessage}
                onChange={(e) => setDeleteMessage(e.target.value)}
                rows={4}
                placeholder={text('Explain why this team is being deleted...', 'ពន្យល់មូលហេតុដែលក្រុមនេះត្រូវបានលុប...')}
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
                {text('Cancel', 'បោះបង់')}
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={deletingTeamId === teamToDelete.id}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingTeamId === teamToDelete.id ? text('Deleting...', 'កំពុងលុប...') : text('Send & Delete', 'ផ្ញើ និងលុប')}
              </button>
            </div>
          </div>
        </div>
      )}
      <ImagePreviewModal
        open={Boolean(previewImage)}
        imageUrl={previewImage?.url}
        title={previewImage?.title || text('Team image', 'រូបភាពក្រុម')}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default PublicTeamsPage;
