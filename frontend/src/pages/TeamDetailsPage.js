import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import teamService from '../services/teamService';
import MemberDetailsModal from '../components/ui/MemberDetailsModal';
import { UsersIcon, MapPinIcon, ShieldCheckIcon, CheckIcon, XMarkIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { ImagePreviewModal, useToast } from '../components/ui';
import { getTeamJerseyColors } from '../utils/teamColors';

const MAX_TEAM_LOGO_SIZE_MB = 5;
const MAX_TEAM_LOGO_SIZE_BYTES = MAX_TEAM_LOGO_SIZE_MB * 1024 * 1024;
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const resolveTeamLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (/^https?:\/\//i.test(rawLogo) || /^data:image\//i.test(rawLogo)) return rawLogo;
  const normalized = String(rawLogo).startsWith('/') ? rawLogo : `/${rawLogo}`;
  return `${API_ORIGIN}${normalized}`;
};

const TeamMatchLogo = ({ teamName, logoUrl }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!logoUrl && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
      {showImage ? (
        <img
          src={logoUrl}
          alt={`${teamName} logo`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400">
          <PhotoIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

const formatCaptainName = (captain) => {
  if (!captain) return 'Unknown captain';
  const fullName = `${captain.firstName || ''} ${captain.lastName || ''}`.trim();
  return fullName || captain.username || 'Unknown captain';
};

const MatchDetailsModal = ({
  match,
  teamName,
  teamCaptainName,
  opponentCaptainName,
  teamLogoUrl,
  opponentLogoUrl,
  fieldLabel,
  matchDate,
  matchSummary,
  onOpenCaptain,
  onOpenOpponentCaptain,
  onClose
}) => {
  if (!match) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:max-h-[calc(100vh-3rem)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-details-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-200">
              Match Details
            </span>
            <h3 id="match-details-title" className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {teamName} vs {match?.opponentTeamName || 'Opponent'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{matchSummary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close match details"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TeamMatchLogo teamName={teamName} logoUrl={teamLogoUrl} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Team</p>
                    <p className="truncate text-base font-semibold text-slate-900">{teamName}</p>
                    <button
                      type="button"
                      onClick={() => onOpenCaptain?.()}
                      className="mt-1 truncate text-left text-xs text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                    >
                      Captain: {teamCaptainName}
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Score</div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-900">{match?.finalScore || 'Pending'}</div>
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                  <div className="min-w-0 text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Opponent</p>
                    <p className="truncate text-base font-semibold text-slate-900">{match?.opponentTeamName || 'Opponent'}</p>
                    <button
                      type="button"
                      onClick={() => onOpenOpponentCaptain?.()}
                      className="mt-1 truncate text-right text-xs text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                    >
                      Captain: {opponentCaptainName}
                    </button>
                  </div>
                  <TeamMatchLogo teamName={match?.opponentTeamName || 'Opponent'} logoUrl={opponentLogoUrl} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{matchDate}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Result</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{match?.result || 'Pending'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Field</p>
              <div className="mt-2 text-sm font-semibold text-slate-800">
                {match?.fieldId ? (
                  <Link
                    to={`/fields/${match.fieldId}`}
                    onClick={(event) => event.stopPropagation()}
                    className="text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                  >
                    {fieldLabel}
                  </Link>
                ) : (
                  fieldLabel
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</p>
              <p className="mt-2 text-sm text-slate-700">{matchSummary}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Booking ID</p>
              <p className="mt-2 text-sm text-slate-700">{match?.bookingId || 'Not linked'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Match ID</p>
              <p className="mt-2 text-sm text-slate-700">{match?.id || 'Not available'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamDetailsPage = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { version } = useRealtime();
  const navigate = useNavigate();
  const location = useLocation();
const basePath = location.pathname.startsWith('/owner') ? '/owner' : '/app';
const { showToast } = useToast();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [logoCandidateIndex, setLogoCandidateIndex] = useState(0);
  const [pendingLogoPreview, setPendingLogoPreview] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [history, setHistory] = useState({ stats: { total: 0, wins: 0, losses: 0, draws: 0 }, matches: [] });
  const [activeTab, setActiveTab] = useState('overview');

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
        setPageError(null);
        const [teamResponse, historyResponse] = await Promise.all([
          teamService.getTeamById(id),
          teamService.getTeamMatchHistory(id, { limit: 5 }).catch(() => null)
        ]);

        const teamData = teamResponse.data || null;
        if (!teamData) {
          setTeam(null);
        } else {
          setTeam((prev) => ({
            ...teamData,
            logoUrl: teamData.logoUrl || teamData.logo_url || teamData.logo || prev?.logoUrl || prev?.logo_url || prev?.logo || null
          }));
        }

        const historyData = historyResponse?.data;
        if (historyData && (Array.isArray(historyData.matches) || historyData.stats)) {
          setHistory({
            stats: historyData.stats || { total: 0, wins: 0, losses: 0, draws: 0 },
            matches: Array.isArray(historyData.matches) ? historyData.matches : []
          });
        } else {
          setHistory({ stats: { total: 0, wins: 0, losses: 0, draws: 0 }, matches: [] });
        }
      } catch (err) {
        console.error('Failed to fetch team:', err);
        setPageError('Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id, refreshTeam, version]);

  useEffect(() => {
    if (!location.state?.successMessage && !location.state?.errorMessage) {
      return;
    }

    if (location.state.successMessage) {
      showToast(location.state.successMessage, { type: 'success', duration: 3200 });
    }
    if (location.state.errorMessage) {
      showToast(location.state.errorMessage, { type: 'error', duration: 3600 });
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate, showToast]);

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      setPageError(null);
      const response = await teamService.joinTeam(id);
      if (response.success) {
        showToast('Join request submitted!', { type: 'success', duration: 3200 });
        await refreshTeam();
      }
    } catch (err) {
      showToast(err?.error || 'Failed to submit join request', { type: 'error', duration: 3600 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setActionLoading(true);
      setPageError(null);
      const response = await teamService.leaveTeam(id);
      if (response.success) {
        showToast(response.message || 'Leave request sent to captain for approval.', { type: 'success', duration: 3200 });
        await refreshTeam();
      }
    } catch (err) {
      showToast(err?.error || 'Failed to submit leave request', { type: 'error', duration: 3600 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      const response = await teamService.acceptInvite(id);
      if (response.success) {
        showToast('You have joined the team', { type: 'success', duration: 3200 });
        await refreshTeam();
      }
    } catch (err) {
      showToast(err?.error || 'Failed to accept invitation', { type: 'error', duration: 3600 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setActionLoading(true);
      const response = await teamService.declineInvite(id);
      if (response.success) {
        showToast('Invitation declined', { type: 'success', duration: 3200 });
        await refreshTeam();
      }
    } catch (err) {
      showToast(err?.error || 'Failed to decline invitation', { type: 'error', duration: 3600 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_TEAM_LOGO_SIZE_BYTES) {
      showToast(`Logo file size must be less than ${MAX_TEAM_LOGO_SIZE_MB}MB`, { type: 'error', duration: 3600 });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', { type: 'error', duration: 3600 });
      return;
    }

    try {
      setActionLoading(true);
      setPageError(null);

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
        showToast('Team logo updated successfully!', { type: 'success', duration: 3200 });
        await refreshTeam();
      }
    } catch (err) {
      showToast(err?.error || 'Failed to upload logo', { type: 'error', duration: 3600 });
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
        <Link to={`${basePath}/teams`} className="mt-4 inline-block text-green-700 hover:text-green-800">
          Back to Teams
        </Link>
      </div>
    );
  }

  const activeMembers = Array.isArray(team.teamMembers)
    ? team.teamMembers.filter((m) => m.status === 'active' && m.isActive !== false)
    : [];
  const isAdminUser = isAdmin();
  const openMemberDetails = (member) => setSelectedMember(member);
  const closeMemberDetails = () => setSelectedMember(null);
  const teamRecordCards = [
    {
      label: 'MP',
      value: history.stats?.total || 0,
      className: 'border-blue-100/80 bg-gradient-to-br from-white/90 via-blue-50/55 to-blue-100/60 shadow-blue-100/40 backdrop-blur-sm',
      labelClassName: 'text-blue-600',
      valueClassName: 'text-blue-950'
    },
    {
      label: 'W',
      value: history.stats?.wins || 0,
      className: 'border-emerald-100/80 bg-gradient-to-br from-white/90 via-emerald-50/55 to-emerald-100/60 shadow-emerald-100/40 backdrop-blur-sm',
      labelClassName: 'text-emerald-600',
      valueClassName: 'text-emerald-950'
    },
    {
      label: 'D',
      value: history.stats?.draws || 0,
      className: 'border-amber-100/80 bg-gradient-to-br from-white/90 via-amber-50/55 to-amber-100/60 shadow-amber-100/40 backdrop-blur-sm',
      labelClassName: 'text-amber-600',
      valueClassName: 'text-amber-950'
    },
    {
      label: 'L',
      value: history.stats?.losses || 0,
      className: 'border-rose-100/80 bg-gradient-to-br from-white/90 via-rose-50/55 to-rose-100/60 shadow-rose-100/40 backdrop-blur-sm',
      labelClassName: 'text-rose-600',
      valueClassName: 'text-red-950'
    }
  ];
  const recentMatches = Array.isArray(history.matches) ? history.matches.slice(0, 5) : [];
  const captainName = team.captain?.firstName || team.captain?.username || 'Unknown';
  const createdDate = team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'Unknown';
  const teamJerseyColors = getTeamJerseyColors(team);
const teamOverviewDetails = [
    { label: 'Created', value: createdDate },
    { label: 'Max Players', value: team.maxPlayers || 0 },
    { label: 'Team Status', value: team.status ? team.status.charAt(0).toUpperCase() + team.status.slice(1) : 'Active' },
    {
      label: 'Jersey',
      value: teamJerseyColors.length > 0 ? `${teamJerseyColors.length} color${teamJerseyColors.length === 1 ? '' : 's'}` : 'Not set',
      renderValue:
        teamJerseyColors.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {teamJerseyColors.map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-6 w-6 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        ) : null
    }
  ];

  const formatMatchDate = (match) => {
    const dateValue = match?.dateTime || match?.matchDate || match?.date;
    return dateValue ? new Date(dateValue).toLocaleDateString() : 'Date unavailable';
  };

  const formatMatchResult = (match) => {
    if (match?.result) {
      return match.result;
    }

    const ourScore = match?.teamScore ?? match?.homeScore ?? match?.scoreFor;
    const opponentScore = match?.opponentScore ?? match?.awayScore ?? match?.scoreAgainst;

    if (ourScore !== undefined && opponentScore !== undefined) {
      return `${ourScore} - ${opponentScore}`;
    }

    if (match?.score) {
      return match.score;
    }

    return 'Pending';
  };

  const formatMatchSummary = (match) => {
    if (match?.competitionName) {
      return match.competitionName;
    }

    if (match?.venueName) {
      return match.venueName;
    }

    if (match?.status) {
      return match.status;
    }

    return 'Team match';
  };

  const formatMatchFieldName = (match) => {
    return match?.fieldName || 'Field unavailable';
  };

  const getMatchTeamLogoUrl = (match) => {
    return resolveTeamLogoUrl(match?.teamLogoUrl || team?.logoUrl || team?.logo_url || team?.logo);
  };

  const getMatchOpponentLogoUrl = (match) => {
    return resolveTeamLogoUrl(match?.opponentTeamLogoUrl);
  };

  const currentTeamCaptainName = formatCaptainName(team?.captain);

  const openCaptainDetails = (captain) => {
    if (!captain) return;
    setSelectedMember({
      ...captain,
      role: captain.role || 'captain',
      status: captain.status || 'active'
    });
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

  return (
    <div className="space-y-6">
      {selectedMember && <MemberDetailsModal member={selectedMember} onClose={closeMemberDetails} />}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          teamName={selectedMatch?.teamName || team?.name || 'This Team'}
          teamCaptainName={currentTeamCaptainName || selectedMatch?.teamCaptainName || 'Unknown captain'}
          opponentCaptainName={selectedMatch?.opponentCaptainName || 'Unknown captain'}
          teamLogoUrl={getMatchTeamLogoUrl(selectedMatch)}
          opponentLogoUrl={getMatchOpponentLogoUrl(selectedMatch)}
          fieldLabel={formatMatchFieldName(selectedMatch)}
          matchDate={formatMatchDate(selectedMatch)}
          matchSummary={formatMatchSummary(selectedMatch)}
          onOpenCaptain={() => openCaptainDetails(selectedMatch?.teamCaptain || team?.captain)}
          onOpenOpponentCaptain={() => openCaptainDetails(selectedMatch?.opponentCaptain)}
          onClose={() => setSelectedMatch(null)}
        />
      )}
      {pageError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {pageError}
        </div>
      )}

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
          <div className="group rounded-[28px] bg-transparent px-2 pt-0 pb-2 transition duration-200 hover:-translate-y-1">
            <div className="text-sm font-semibold text-slate-500">Team Identity</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Team Logo</h2>

            <div className="relative mx-auto mt-4 flex h-[220px] w-[220px] items-center justify-center overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),rgba(240,249,255,0.9)_55%,rgba(236,253,245,0.92))] shadow-inner transition duration-200 group-hover:scale-[1.02]">
              {teamLogoUrl ? (
                <img
                  src={teamLogoUrl}
                  alt={`${team.name} logo`}
                  className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
                  onError={() => {
                    setLogoCandidateIndex((prev) => prev + 1);
                  }}
                />
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-200 group-hover:scale-105 group-hover:ring-emerald-200">
                    <PhotoIcon className="h-9 w-9 text-slate-400 transition duration-200 group-hover:text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No logo</p>
                </div>
              )}

              {isCaptainOfTeam && (
                <button
                  type="button"
                  onClick={() => document.getElementById('logo-upload').click()}
                  disabled={actionLoading}
                  className="absolute bottom-3 right-3 inline-flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-lg shadow-emerald-200 transition duration-200 hover:scale-110 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-200 disabled:opacity-50"
                >
                  <ArrowUpTrayIcon className="h-6 w-6" />
                </button>
              )}
            </div>

            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>

          <div className="space-y-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Team Name</div>
                <h1 className="mt-1 break-words text-4xl font-black tracking-tight text-slate-950">{team.name || 'Unnamed team'}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Jersey Colors</div>
                  <div className="inline-flex items-center gap-2">
                    {teamJerseyColors.length > 0 ? (
                      teamJerseyColors.map((color, index) => (
                        <span
                          key={`${color}-${index}`}
                          className="h-4 w-4 rounded-full border border-white shadow-sm ring-1 ring-slate-200 transition duration-200 hover:scale-125 hover:ring-slate-300"
                          style={{ backgroundColor: color }}
                        />
                      ))
                    ) : (
                      <span className="text-sm font-medium text-slate-500">No colors selected</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[376px]">
                {teamRecordCards.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-[24px] border px-4 py-3 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${item.className}`}
                  >
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${item.labelClassName}`}>{item.label}</div>
                    <div className={`mt-2 text-[1.75rem] font-bold leading-none ${item.valueClassName}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-white/70 bg-white/85 px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Captain</div>
                <div className="mt-2 text-base font-semibold text-slate-800">{captainName}</div>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Active Members</div>
                <div className="mt-2 text-base font-semibold text-slate-800">{activeMembers.length}/{team.maxPlayers || 0}</div>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-100 hover:shadow-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Skill Level</div>
                <div className="mt-2 text-base font-semibold text-slate-800">
                  {team.skillLevel ? team.skillLevel.charAt(0).toUpperCase() + team.skillLevel.slice(1) : 'Not set'}
                </div>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-100 hover:shadow-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Home Field</div>
                <div className="mt-2 text-base font-semibold text-slate-800">{team.homeField?.name || 'No home field'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="border-b border-gray-200">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
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
              onClick={() => setActiveTab('members')}
              className={`border-b-2 px-1 py-3 text-base font-semibold transition ${
                activeTab === 'members'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Members
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
              <div>
                <h2 className="text-lg font-semibold text-gray-900">About This Team</h2>
                <p className="mt-1 text-sm text-gray-500">Extra details and description that support the identity card above.</p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {teamOverviewDetails.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
                    {item.renderValue ? item.renderValue : <p className="mt-2 text-sm font-semibold text-gray-800">{item.value}</p>}
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Recent History</h3>
                    <p className="mt-1 text-sm text-gray-500">Latest results, opponents, and match dates for this team.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {recentMatches.length} shown
                  </span>
                </div>

                <div className="mt-5">
                  {recentMatches.length > 0 ? (
                    <div className="space-y-3">
                      {recentMatches.map((match, index) => (
                        <div
                          key={match.id || `${match.opponentTeamName || 'opponent'}-${index}`}
                          className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3"
                          onClick={() => setSelectedMatch(match)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedMatch(match);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <TeamMatchLogo
                                    teamName={match?.teamName || team.name || 'This Team'}
                                    logoUrl={getMatchTeamLogoUrl(match)}
                                  />
                                  <span className="truncate text-sm font-bold text-gray-900 sm:text-base">
                                    {match?.teamName || team.name || 'This Team'}
                                  </span>
                                </div>
                                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 sm:text-sm">vs</span>
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <TeamMatchLogo
                                    teamName={match?.opponentTeamName || 'Opponent'}
                                    logoUrl={getMatchOpponentLogoUrl(match)}
                                  />
                                  <span className="truncate text-sm font-bold text-gray-900 sm:text-base">
                                    {match.opponentTeamName || 'Opponent'}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-0.5 text-xs text-gray-500">{formatMatchSummary(match)}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                                <div>
                                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date</div>
                                  <div className="mt-1 font-medium text-gray-700">{formatMatchDate(match)}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Field</div>
                                  <div className="mt-1">
                                    {match?.fieldId ? (
                                      <Link
                                        to={`/fields/${match.fieldId}`}
                                        onClick={(event) => event.stopPropagation()}
                                        className="font-medium text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                                      >
                                        {formatMatchFieldName(match)}
                                      </Link>
                                    ) : (
                                      <span className="font-medium text-gray-700">{formatMatchFieldName(match)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-stretch">
                              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Score</div>
                                <div className="mt-1.5 text-xl font-bold text-slate-900">
                                  {match.finalScore || formatMatchResult(match)}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Result</div>
                                <div className="mt-1.5 text-sm font-semibold text-slate-900">
                                  {match.result || formatMatchResult(match)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      No match history recorded for this team yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-base font-semibold text-gray-900">Team Notes</h3>
                <p className="mt-1 text-sm text-gray-500">Supporting details that are not already shown in the top summary card.</p>
                <div className="mt-5 space-y-4 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <UsersIcon className="h-5 w-5 text-gray-400" />
                    <span>Squad capacity: {team.maxPlayers || 0} players</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                    <span>Team status: {team.status ? team.status.charAt(0).toUpperCase() + team.status.slice(1) : 'Active'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <span>Created on {createdDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      {teamJerseyColors.map((color, index) => (
                        <span key={`${color}-${index}`} className="h-5 w-5 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
                      ))}
                    </span>
                    <span>{teamJerseyColors.length} jersey color{teamJerseyColors.length === 1 ? '' : 's'} selected</span>
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
                    The top summary card now holds the main identity details, and this section keeps only the extra context.
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
        ) : (
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
        )}
      </div>
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
