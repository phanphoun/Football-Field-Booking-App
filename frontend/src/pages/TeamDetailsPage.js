import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';
import ratingService from '../services/ratingService';
import MemberDetailsModal from '../components/ui/MemberDetailsModal';
import {
  UsersIcon,
  MapPinIcon,
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  TrophyIcon,
  FlagIcon,
  HandThumbUpIcon,
  UserGroupIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { ImagePreviewModal } from '../components/ui';
import { getTeamJerseyColors } from '../utils/teamColors';

const MAX_TEAM_LOGO_SIZE_MB = 5;
const MAX_TEAM_LOGO_SIZE_BYTES = MAX_TEAM_LOGO_SIZE_MB * 1024 * 1024;
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const TeamDetailsPage = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = location.pathname.startsWith('/owner') ? '/owner' : '/app';

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [logoCandidateIndex, setLogoCandidateIndex] = useState(0);
  const [pendingLogoPreview, setPendingLogoPreview] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [matchHistory, setMatchHistory] = useState({ stats: { total: 0, wins: 0, losses: 0, draws: 0 }, matches: [] });
  const [matchHistoryLoading, setMatchHistoryLoading] = useState(false);
  const [matchHistoryError, setMatchHistoryError] = useState(null);
  const [ratingModalMatch, setRatingModalMatch] = useState(null);
  const [viewRatingMatch, setViewRatingMatch] = useState(null);
  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    review: '',
    categories: {
      skillLevel: 0,
      sportsmanship: 0,
      punctuality: 0,
      teamOrganization: 0
    }
  });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingValidationVisible, setRatingValidationVisible] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('all');
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : searchParams.get('tab') === 'members' ? 'members' : 'overview';
  const isAdminUser = isAdmin();

  const isCaptainOfTeam = useMemo(() => {
    if (!team || !user) return false;
    return team.captainId === user.id;
  }, [team, user]);

  const setTab = useCallback(
    (tab) => {
      const next = new URLSearchParams(searchParams);
      if (tab === 'overview') {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const membership = useMemo(() => {
    if (!team || !user) return null;
    const members = Array.isArray(team.teamMembers) ? team.teamMembers : [];
    return members.find((m) => m.userId === user.id) || null;
  }, [team, user]);

  const isInvited = useMemo(() => {
    return membership && membership.status === 'pending' && membership.isActive === false;
  }, [membership]);

  const rawTeamLogo = useMemo(() => {
    const rawLogo = team?.logoUrl || team?.logo_url || team?.logo;
    if (!rawLogo) return null;
    if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
    return rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
  }, [team]);

  const logoCandidates = useMemo(() => {
    if (!rawTeamLogo) return [];
    if (/^https?:\/\//i.test(rawTeamLogo)) return [rawTeamLogo];

    const localHostApiOrigin = 'http://localhost:5000';
    const loopbackApiOrigin = 'http://127.0.0.1:5000';
    const browserApiOrigin =
      typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':5000') : API_ORIGIN;

    return Array.from(
      new Set([
        `${API_ORIGIN}${rawTeamLogo}`,
        `${browserApiOrigin}${rawTeamLogo}`,
        `${localHostApiOrigin}${rawTeamLogo}`,
        `${loopbackApiOrigin}${rawTeamLogo}`
      ])
    );
  }, [rawTeamLogo]);

  const teamLogoUrl = pendingLogoPreview || logoCandidates[logoCandidateIndex] || null;

  useEffect(() => {
    return () => {
      if (pendingLogoPreview) {
        URL.revokeObjectURL(pendingLogoPreview);
      }
    };
  }, [pendingLogoPreview]);

  useEffect(() => {
    setLogoCandidateIndex(0);
  }, [rawTeamLogo]);

  const refreshTeam = useCallback(async () => {
    const response = await teamService.getTeamById(id);
    const teamData = response.data || null;
    if (!teamData) {
      setTeam(null);
      return;
    }

    setTeam((prev) => ({
      ...teamData,
      // Preserve known logo when API payload does not include it consistently.
      logoUrl: teamData.logoUrl || teamData.logo_url || teamData.logo || prev?.logoUrl || prev?.logo_url || prev?.logo || null
    }));
  }, [id]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        const teamResponse = await teamService.getTeamById(id);

        const teamData = teamResponse.data || null;
        if (!teamData) {
          setTeam(null);
        } else {
          setTeam((prev) => ({
            ...teamData,
            logoUrl: teamData.logoUrl || teamData.logo_url || teamData.logo || prev?.logoUrl || prev?.logo_url || prev?.logo || null
          }));
        }
      } catch (err) {
        console.error('Failed to fetch team:', err);
        setError(err?.error || 'Failed to load team details');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id]);

  useEffect(() => {
    if (!location.state?.successMessage && !location.state?.errorMessage) {
      return;
    }

    if (location.state.successMessage) {
      setSuccessMessage(location.state.successMessage);
    }
    if (location.state.errorMessage) {
      setError(location.state.errorMessage);
    }

    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!team || activeTab !== 'history') return;

    let cancelled = false;

    const fetchMatchHistory = async () => {
      try {
        setMatchHistoryLoading(true);
        setMatchHistoryError(null);

        const historyResponse = await teamService.getTeamMatchHistory(id, { limit: 50, status: 'completed' });

        if (cancelled) return;

        const historyData = historyResponse?.data || {};
        setMatchHistory({
          stats: historyData?.stats || { total: 0, wins: 0, losses: 0, draws: 0 },
          matches: Array.isArray(historyData?.matches) ? historyData.matches : []
        });
      } catch (err) {
        if (!cancelled) {
          setMatchHistoryError(err?.error || 'Failed to load match history');
        }
      } finally {
        if (!cancelled) {
          setMatchHistoryLoading(false);
        }
      }
    };

    fetchMatchHistory();

    return () => {
      cancelled = true;
    };
  }, [activeTab, id, team]);

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
        setSuccessMessage(response.message || 'Leave request sent to captain for approval.');
        await refreshTeam();
      }
    } catch (err) {
      setError(err?.error || 'Failed to submit leave request');
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

    // Validate file size
    if (file.size > MAX_TEAM_LOGO_SIZE_BYTES) {
      setError(`Logo file size must be less than ${MAX_TEAM_LOGO_SIZE_MB}MB`);
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

      if (pendingLogoPreview) {
        URL.revokeObjectURL(pendingLogoPreview);
      }
      setPendingLogoPreview(URL.createObjectURL(file));
      
      const formData = new FormData();
      formData.append('logo', file);

      const response = await teamService.uploadTeamLogo(id, formData);
      if (response.success) {
        const uploadedLogoUrl = response.data?.logoUrl || response.data?.logo_url || response.data?.logo || null;
        if (uploadedLogoUrl) {
          setTeam((prev) => (prev ? { ...prev, logoUrl: uploadedLogoUrl } : prev));
        }
        setPendingLogoPreview(null);
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

  const activeMembers = Array.isArray(team?.teamMembers)
    ? team.teamMembers.filter((m) => m.status === 'active' && m.isActive !== false)
    : [];
  const openMemberDetails = (member) => setSelectedMember(member);
  const closeMemberDetails = () => setSelectedMember(null);
  const captainName = team?.captain?.firstName || team?.captain?.username || 'Unknown';
  const createdDate = team?.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'Unknown';
  const teamJerseyColors = getTeamJerseyColors(team);
  const teamDetails = [
    { label: 'Team Name', value: team?.name || 'Unnamed team' },
    { label: 'Captain', value: captainName },
    { label: 'Active Members', value: `${activeMembers.length}/${team?.maxPlayers || 0}` },
    { label: 'Skill Level', value: team?.skillLevel ? team.skillLevel.charAt(0).toUpperCase() + team.skillLevel.slice(1) : 'Not set' },
    { label: 'Home Field', value: team?.homeField?.name || 'No home field' },
    { label: 'Jersey Colors', value: `${teamJerseyColors.length} colors selected` },
    { label: 'Created', value: createdDate },
    { label: 'Max Players', value: team?.maxPlayers || 0 },
    { label: 'Team Status', value: team?.status ? team.status.charAt(0).toUpperCase() + team.status.slice(1) : 'Active' }
  ];

  const formatMatchDate = (match) => {
    const dateValue = match?.dateTime || match?.matchDate || match?.date;
    return dateValue ? new Date(dateValue).toLocaleDateString() : 'Date unavailable';
  };

  const resolveUserAvatarUrl = (memberUser) => {
    const rawAvatar = memberUser?.avatarUrl || memberUser?.avatar_url || null;
    const normalizedPath = rawAvatar
      ? rawAvatar.startsWith('/')
        ? rawAvatar
        : `/${rawAvatar}`
      : DEFAULT_PROFILE_PATH;

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    return `${API_ORIGIN}${normalizedPath}`;
  };

  const resolveTeamLogoUrl = (rawLogo) => {
    if (!rawLogo) return null;
    if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
    const normalizedPath = rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
    return `${API_ORIGIN}${normalizedPath}`;
  };

  const availableSeasons = useMemo(() => {
    const years = Array.from(
      new Set(
        (Array.isArray(matchHistory.matches) ? matchHistory.matches : [])
          .map((match) => {
            const date = match?.date ? new Date(match.date) : null;
            return Number.isNaN(date?.getTime?.()) ? null : String(date.getFullYear());
          })
          .filter(Boolean)
      )
    ).sort((a, b) => Number(b) - Number(a));

    return ['all', ...years];
  }, [matchHistory.matches]);

  const filteredMatches = useMemo(() => {
    const rows = Array.isArray(matchHistory.matches) ? matchHistory.matches : [];
    if (selectedSeason === 'all') {
      return rows;
    }

    return rows.filter((match) => {
      const date = match?.date ? new Date(match.date) : null;
      if (!date || Number.isNaN(date.getTime())) return false;
      return String(date.getFullYear()) === selectedSeason;
    });
  }, [matchHistory.matches, selectedSeason]);

  const filteredStats = useMemo(() => {
    return filteredMatches.reduce(
      (acc, match) => {
        acc.total += 1;
        if (match.result === 'Win') acc.wins += 1;
        else if (match.result === 'Loss') acc.losses += 1;
        else acc.draws += 1;
        return acc;
      },
      { total: 0, wins: 0, losses: 0, draws: 0 }
    );
  }, [filteredMatches]);

  const historyStatCards = [
    {
      key: 'total',
      label: 'Total Matches',
      value: filteredStats.total,
      icon: CalendarDaysIcon,
      iconClassName: 'bg-indigo-100 text-indigo-600',
      valueClassName: 'text-slate-900'
    },
    {
      key: 'wins',
      label: 'Wins',
      value: filteredStats.wins,
      icon: TrophyIcon,
      iconClassName: 'bg-emerald-100 text-emerald-600',
      valueClassName: 'text-emerald-600'
    },
    {
      key: 'losses',
      label: 'Losses',
      value: filteredStats.losses,
      icon: FlagIcon,
      iconClassName: 'bg-rose-100 text-rose-500',
      valueClassName: 'text-rose-500'
    },
    {
      key: 'draws',
      label: 'Draws',
      value: filteredStats.draws,
      icon: UsersIcon,
      iconClassName: 'bg-amber-100 text-amber-500',
      valueClassName: 'text-amber-700'
    }
  ];

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
        <Link to={`${basePath}/teams`} className="mt-4 inline-block text-green-700 hover:text-green-800">
          Back to Teams
        </Link>
      </div>
    );
  }

  const getResultPillClasses = (result) => {
    if (result === 'Win') return 'bg-emerald-100 text-emerald-700';
    if (result === 'Loss') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };

  const openRatingModal = (match) => {
    setRatingModalMatch(match);
    setRatingForm({
      rating: 0,
      review: '',
      categories: {
        skillLevel: 0,
        sportsmanship: 0,
        punctuality: 0,
        teamOrganization: 0
      }
    });
    setRatingValidationVisible(false);
    setError(null);
    setSuccessMessage(null);
  };

  const closeRatingModal = (force = false) => {
    if (ratingSubmitting && !force) return;
    setRatingModalMatch(null);
    setRatingForm({
      rating: 0,
      review: '',
      categories: {
        skillLevel: 0,
        sportsmanship: 0,
        punctuality: 0,
        teamOrganization: 0
      }
    });
    setRatingValidationVisible(false);
  };

  const handleSubmitRating = async () => {
    if (!ratingModalMatch?.bookingId) return;
    const categoryValues = Object.values(ratingForm.categories || {});
    if (!ratingForm.rating || categoryValues.some((value) => !value)) {
      setRatingValidationVisible(true);
      return;
    }

    try {
      setRatingSubmitting(true);
      setRatingValidationVisible(false);
      setError(null);
      setSuccessMessage(null);

      await ratingService.createOpponentRating({
        bookingId: ratingModalMatch.bookingId,
        rating: ratingForm.rating,
        review: ratingForm.review.trim(),
        sportsmanshipScore: ratingForm.categories.sportsmanship
      });

      setSuccessMessage('Opponent rating submitted successfully.');
      closeRatingModal(true);
      setTab('history');

      const historyResponse = await teamService.getTeamMatchHistory(id, { limit: 50, status: 'completed' });

      const historyData = historyResponse?.data || {};
      setMatchHistory({
        stats: historyData?.stats || { total: 0, wins: 0, losses: 0, draws: 0 },
        matches: Array.isArray(historyData?.matches) ? historyData.matches : []
      });
    } catch (err) {
      setError(err?.error || 'Failed to submit rating');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const renderStars = (value, interactive = false, onSelect = null, options = {}) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onSelect?.(star)}
          className={interactive ? `transition hover:scale-110 ${options.buttonClassName || ''}` : `cursor-default ${options.buttonClassName || ''}`}
        >
          {star <= value ? (
            <StarSolidIcon className={`${options.iconClassName || 'h-5 w-5'} ${options.activeClassName || 'text-amber-400'}`} />
          ) : (
            <StarIcon className={`${options.iconClassName || 'h-5 w-5'} ${options.inactiveClassName || 'text-slate-300'}`} />
          )}
        </button>
      ))}
    </div>
  );

  const ratingCategories = [
    { key: 'skillLevel', label: 'Skill Level', icon: TrophyIcon },
    { key: 'sportsmanship', label: 'Sportsmanship', icon: HandThumbUpIcon },
    { key: 'punctuality', label: 'Punctuality', icon: ClockIcon },
    { key: 'teamOrganization', label: 'Team Organization', icon: UserGroupIcon }
  ];
  
  return (
    <div className="space-y-6">
      {selectedMember && <MemberDetailsModal member={selectedMember} onClose={closeMemberDetails} />}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Team Logo</h2>
            <p className="text-sm text-gray-500 mt-1">Used across team pages and member views.</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            Max {MAX_TEAM_LOGO_SIZE_MB}MB
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-center">
          <div className="mx-auto md:mx-0">
            <div className="h-40 w-40 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner flex items-center justify-center overflow-hidden">
              {teamLogoUrl ? (
                <img
                  src={teamLogoUrl}
                  alt={`${team.name} logo`}
                  className="h-full w-full object-cover"
                  onError={() => {
                    setLogoCandidateIndex((prev) => prev + 1);
                  }}
                />
              ) : (
                <div className="text-center">
                  <PhotoIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No logo</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-700">
              Use a square image for the best result. Supported formats: JPG, PNG, GIF, WEBP.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Recommended size: 512x512 px
            </p>

            {isCaptainOfTeam && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => document.getElementById('logo-upload').click()}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {actionLoading ? 'Uploading...' : 'Upload Logo'}
                </button>
                <span className="text-xs text-gray-500">Captain only</span>
              </div>
            )}

            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="border-b border-gray-200">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`border-b-2 px-1 py-3 text-base font-semibold transition ${
                activeTab === 'overview'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab('members')}
              className={`border-b-2 px-1 py-3 text-base font-semibold transition ${
                activeTab === 'members'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Members
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`border-b-2 px-1 py-3 text-base font-semibold transition ${
                activeTab === 'history'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Match History
            </button>
            {isCaptainOfTeam && (
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/teams/${id}/manage`)}
                  className="border-b-2 border-transparent px-1 py-3 text-base font-semibold text-slate-500 transition hover:text-slate-700"
                >
                  Manage Team
              </button>
            )}
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">About This Team</h2>
                  <p className="mt-1 text-sm text-gray-500">Overview and profile details in one place.</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {teamDetails.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-800">{item.value}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 md:col-span-2 xl:col-span-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700">{team.description || 'No team description yet.'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-2">
                <h3 className="text-base font-semibold text-gray-900">Quick Snapshot</h3>
                <p className="mt-1 text-sm text-gray-500">Fast facts that help explain this team at a glance.</p>
                <div className="mt-5 space-y-4 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <UsersIcon className="h-5 w-5 text-gray-400" />
                    <span>{activeMembers.length}/{team.maxPlayers || 0} active members</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                    <span>{team.skillLevel ? team.skillLevel.charAt(0).toUpperCase() + team.skillLevel.slice(1) : 'Skill level not set'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <span>{team.homeField?.name || 'No home field assigned'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      {teamJerseyColors.map((color, index) => (
                        <span key={`${color}-${index}`} className="h-5 w-5 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
                      ))}
                    </span>
                    <span>Jersey colors</span>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-600">
                    This overview combines team identity, squad size, and basic settings so any role can understand the team quickly.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-base font-semibold text-gray-900">Quick Snapshot</h3>
                <p className="mt-1 text-sm text-gray-500">Fast facts that help explain this team at a glance.</p>
                <div className="mt-5 space-y-4 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <UsersIcon className="h-5 w-5 text-gray-400" />
                    <span>{activeMembers.length}/{team.maxPlayers || 0} active members</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                    <span>{team.skillLevel ? team.skillLevel.charAt(0).toUpperCase() + team.skillLevel.slice(1) : 'Skill level not set'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <span>{team.homeField?.name || 'No home field assigned'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      {teamJerseyColors.map((color, index) => (
                        <span key={`${color}-${index}`} className="h-5 w-5 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
                      ))}
                    </span>
                    <span>Jersey colors</span>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-600">
                    This overview combines team identity, record, squad size, and recent performance so any role can understand the team quickly.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAdminUser ? (
                <div className="text-sm text-gray-700">Admin view of this team profile, members, and recent history.</div>
              ) : isCaptainOfTeam ? (
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
          </div>
        ) : activeTab === 'members' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Members</h2>
              <span className="text-xs text-gray-500">{activeMembers.length}/{team.maxPlayers} players</span>
            </div>
            <div className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
              {activeMembers.length > 0 ? (
                activeMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="cursor-pointer px-4 py-3 transition hover:bg-gray-50"
                    onClick={() => openMemberDetails(m)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openMemberDetails(m);
                      }
                    }}
                    tabIndex={0}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={resolveUserAvatarUrl(m.user)}
                          alt={`${m.user?.firstName || m.user?.username || 'User'} avatar`}
                          className="h-8 w-8 cursor-zoom-in rounded-full border border-gray-200 bg-gray-100 object-cover"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewImage({
                              url: resolveUserAvatarUrl(m.user),
                              title: `${m.user?.firstName || m.user?.username || 'User'} photo`
                            });
                          }}
                          onError={(e) => {
                            const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                            if (e.currentTarget.src !== fallbackUrl) {
                              e.currentTarget.src = fallbackUrl;
                            }
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {m.user?.firstName || m.user?.username || 'User'} {m.user?.lastName || ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            @{m.user?.username || 'member'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 capitalize">{m.role}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(m.createdAt || m.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-gray-500 text-center">No active members yet.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Match History</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review completed matches and {isCaptainOfTeam ? 'rate opponent teams after the final whistle.' : 'track team performance.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="history-season" className="text-sm text-gray-500">
                  Filter by:
                </label>
                <select
                  id="history-season"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
                >
                  {availableSeasons.map((season) => (
                    <option key={season} value={season}>
                      {season === 'all' ? 'All Seasons' : season}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {matchHistoryError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {matchHistoryError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {historyStatCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div key={card.key} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-slate-500">{card.label}</p>
                        <p className={`mt-2 text-4xl font-bold leading-none ${card.valueClassName}`}>{card.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Completed Matches</h3>
                  <p className="mt-1 text-sm text-gray-500">Only completed matches can be rated.</p>
                </div>
              </div>

              {matchHistoryLoading ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500">Loading match history...</div>
              ) : filteredMatches.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500">No completed matches found for this team yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Opponent</th>
                        <th className="px-6 py-4">Result / Score</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredMatches.map((match) => {
                        const canRate = Boolean(isCaptainOfTeam && match?.canRate);

                        return (
                          <tr key={`${match.id}-${match.bookingId || match.date}`} className="align-top">
                            <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatMatchDate(match)}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">{match.opponentTeamName}</div>
                              <div className="mt-1 text-xs text-slate-500">{match.fieldName || 'Field not recorded'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getResultPillClasses(match.result)}`}>
                                {match.finalScore} ({match.result === 'Win' ? 'W' : match.result === 'Loss' ? 'L' : 'D'})
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                                Completed
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {match?.rating ? (
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setViewRatingMatch(match)}
                                    className="inline-flex min-w-[116px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
                                  >
                                    View Rating
                                  </button>
                                </div>
                              ) : canRate ? (
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() => openRatingModal(match)}
                                    className="inline-flex min-w-[116px] items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                                  >
                                    Rate Opponent
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() => openRatingModal(match)}
                                    className="inline-flex min-w-[116px] items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                                  >
                                    Rate Opponent
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {ratingModalMatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-6">
          <div className="flex min-h-full items-start justify-center">
            <div className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                  <StarIcon className="h-6 w-6 text-violet-500" />
                  Rate Your Opponent
                </h3>
              </div>
              <button
                type="button"
                onClick={closeRatingModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-8">
              <div className="border-t border-slate-200 pt-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm">
                  {resolveTeamLogoUrl(ratingModalMatch.opponentTeamLogoUrl) ? (
                    <img
                      src={resolveTeamLogoUrl(ratingModalMatch.opponentTeamLogoUrl)}
                      alt={`${ratingModalMatch.opponentTeamName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-slate-400">
                      {String(ratingModalMatch.opponentTeamName || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h4 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{ratingModalMatch.opponentTeamName}</h4>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <span>{formatMatchDate(ratingModalMatch)}</span>
                  <span>&bull;</span>
                  <span>{ratingModalMatch.fieldName || 'Field not recorded'}</span>
                </div>
                <div className="mx-auto mt-4 inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-xl font-bold text-slate-900 shadow-sm">
                  Final Score: {ratingModalMatch.finalScore}
                </div>
              </div>

              <div>
                <label className="text-base font-semibold text-slate-900">Overall Rating</label>
                <div className="mt-4 flex justify-center">
                  {renderStars(
                    ratingForm.rating,
                    true,
                    (star) => setRatingForm((prev) => ({ ...prev, rating: star })),
                    { iconClassName: 'h-12 w-12', activeClassName: 'text-amber-400', inactiveClassName: 'text-slate-300' }
                  )}
                </div>
                <p className="mt-3 text-center text-sm text-slate-500">Click to rate</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-slate-900">Rate by Category</h4>
                {ratingCategories.map((category) => {
                  const IconComponent = category.icon;
                  const value = ratingForm.categories[category.key];
                  return (
                    <div key={category.key} className="rounded-3xl bg-slate-50 px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                          <IconComponent className="h-5 w-5 text-violet-500" />
                          <span>{category.label}</span>
                        </div>
                        <span className="text-sm text-slate-500">{value ? `${value}/5` : 'Not rated'}</span>
                      </div>
                      <div className="mt-4 flex justify-between gap-2">
                        {renderStars(
                          value,
                          true,
                          (star) =>
                            setRatingForm((prev) => ({
                              ...prev,
                              categories: {
                                ...prev.categories,
                                [category.key]: star
                              }
                            })),
                          { iconClassName: 'h-8 w-8', activeClassName: 'text-amber-400', inactiveClassName: 'text-slate-300', buttonClassName: 'flex-1 justify-center' }
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-400" />
                  Additional Feedback (Optional)
                </label>
                <textarea
                  value={ratingForm.review}
                  onChange={(e) => setRatingForm((prev) => ({ ...prev, review: e.target.value }))}
                  maxLength={500}
                  rows={5}
                  placeholder="Share your experience with this team... (e.g., great sportsmanship, very skilled players, arrived on time)"
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-green-500"
                />
                <div className="mt-2 text-right text-xs text-slate-400">{ratingForm.review.length}/500</div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeRatingModal}
                  disabled={ratingSubmitting}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={ratingSubmitting}
                  className="rounded-xl bg-[#128C4A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f7a40] disabled:opacity-50"
                >
                  {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
              {ratingValidationVisible && (
                <p className="mt-3 text-center text-sm text-rose-500">
                  Please provide an overall rating and rate all categories
                </p>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
      {viewRatingMatch?.rating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Opponent Rating</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Rating submitted for <span className="font-semibold text-slate-700">{viewRatingMatch.opponentTeamName}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewRatingMatch(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                  <span>{formatMatchDate(viewRatingMatch)}</span>
                </div>
                <div className="mt-2 font-medium text-slate-800">
                  Final score: {viewRatingMatch.finalScore} ({viewRatingMatch.result})
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Rating</label>
                <div className="mt-3">{renderStars(viewRatingMatch.rating.value)}</div>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ClockIcon className="h-4 w-4 text-slate-400" />
                  Submitted
                </label>
                <p className="mt-2 text-sm text-slate-600">
                  {viewRatingMatch.rating.createdAt ? new Date(viewRatingMatch.rating.createdAt).toLocaleString() : 'Date unavailable'}
                </p>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-400" />
                  Comment
                </label>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                  {viewRatingMatch.rating.review || 'No comment left for this match.'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewRatingMatch(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ImagePreviewModal
        open={Boolean(previewImage)}
        imageUrl={previewImage?.url}
        title={previewImage?.title || 'Member photo'}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default TeamDetailsPage;
