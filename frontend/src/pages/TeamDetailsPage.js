import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';
import MemberDetailsModal from '../components/ui/MemberDetailsModal';
import { UsersIcon, MapPinIcon, ShieldCheckIcon, CheckIcon, XMarkIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
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
        setError(null);
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
        setError('Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id, refreshTeam]);

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

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

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
      label: 'P',
      value: history.stats?.total || 0,
      className: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/80 shadow-blue-100/60',
      labelClassName: 'text-blue-700',
      valueClassName: 'text-blue-950'
    },
    {
      label: 'W',
      value: history.stats?.wins || 0,
      className: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/80 shadow-emerald-100/60',
      labelClassName: 'text-emerald-700',
      valueClassName: 'text-emerald-950'
    },
    {
      label: 'D',
      value: history.stats?.draws || 0,
      className: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100/80 shadow-amber-100/60',
      labelClassName: 'text-amber-700',
      valueClassName: 'text-amber-950'
    },
    {
      label: 'L',
      value: history.stats?.losses || 0,
      className: 'border-rose-100 bg-gradient-to-br from-rose-50 via-white to-rose-100/80 shadow-rose-100/60',
      labelClassName: 'text-red-700',
      valueClassName: 'text-red-950'
    }
  ];
  const recentMatches = Array.isArray(history.matches) ? history.matches.slice(0, 5) : [];
  const captainName = team.captain?.firstName || team.captain?.username || 'Unknown';
  const createdDate = team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'Unknown';
  const teamJerseyColors = getTeamJerseyColors(team);
  const teamDetails = [
    { label: 'Team Name', value: team.name || 'Unnamed team' },
    { label: 'Captain', value: captainName },
    { label: 'Active Members', value: `${activeMembers.length}/${team.maxPlayers || 0}` },
    { label: 'Skill Level', value: team.skillLevel ? team.skillLevel.charAt(0).toUpperCase() + team.skillLevel.slice(1) : 'Not set' },
    { label: 'Home Field', value: team.homeField?.name || 'No home field' },
    { label: 'Jersey Colors', value: `${teamJerseyColors.length} colors selected` },
    { label: 'Created', value: createdDate },
    { label: 'Max Players', value: team.maxPlayers || 0 },
    { label: 'Team Status', value: team.status ? team.status.charAt(0).toUpperCase() + team.status.slice(1) : 'Active' }
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">About This Team</h2>
                  <p className="mt-1 text-sm text-gray-500">Overview, record, profile details, and recent history in one place.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teamRecordCards.map((item) => (
                    <div
                      key={item.label}
                      className={`min-w-[82px] rounded-[22px] border px-4 py-3 text-center shadow-sm transition hover:-translate-y-0.5 ${item.className}`}
                    >
                      <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${item.labelClassName}`}>{item.label}</div>
                      <div className={`mt-2 text-[1.75rem] font-bold leading-none ${item.valueClassName}`}>{item.value}</div>
                    </div>
                  ))}
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
                          className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              vs {match.opponentTeamName || 'Opponent'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">{formatMatchSummary(match)}</div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date</div>
                              <div className="mt-1 text-sm font-medium text-gray-700">{formatMatchDate(match)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Result</div>
                              <div className="mt-1 text-sm font-semibold text-gray-900">{formatMatchResult(match)}</div>
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
