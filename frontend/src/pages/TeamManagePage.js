import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  UserPlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRealtime } from '../context/RealtimeContext';
import teamService from '../services/teamService';
import userService from '../services/userService';
import MemberDetailsModal from '../components/ui/MemberDetailsModal';
import { ImagePreviewModal, useDialog, useToast } from '../components/ui';
import { DEFAULT_JERSEY_COLOR, getTeamJerseyColors, normalizeHexColor, normalizeJerseyColors } from '../utils/teamColors';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';
const JERSEY_COLOR_PRESETS = [
  '#FFFFFF',
  '#111827',
  '#DC2626',
  '#2563EB',
  '#16A34A',
  '#F59E0B',
  '#7C3AED',
  '#EC4899',
  '#0EA5E9',
  '#6B7280'
];

const TeamManagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { language } = useLanguage();
  const text = useCallback((en, km) => (language === 'km' ? km : en), [language]);
  const { showToast } = useToast();
  const { version } = useRealtime();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [searchingPlayers, setSearchingPlayers] = useState(false);
  const [jerseyColorsDraft, setJerseyColorsDraft] = useState([DEFAULT_JERSEY_COLOR]);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const { confirm } = useDialog();

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

  useEffect(() => {
    if (!inviteSuccess) return;
    showToast(inviteSuccess, { type: 'success', duration: 3200 });
    setInviteSuccess(null);
  }, [inviteSuccess, showToast]);

  useEffect(() => {
    if (!inviteError) return;
    showToast(inviteError, { type: 'error', duration: 3600 });
    setInviteError(null);
  }, [inviteError, showToast]);

  const isCaptainOfTeam = useMemo(() => {
    if (!team || !user) return false;
    return team.captainId === user.id;
  }, [team, user]);

  const refresh = useCallback(async () => {
    const [teamRes, membersRes, requestsRes] = await Promise.all([
      teamService.getTeamById(id),
      teamService.getTeamMembers(id),
      teamService.getJoinRequests(id)
    ]);

    setTeam(teamRes.data || null);
    setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        setError(err?.error || text('Failed to load team management data', 'មិនអាចផ្ទុកទិន្នន័យគ្រប់គ្រងក្រុមបានទេ'));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, refresh, text, version]);

  useEffect(() => {
    setJerseyColorsDraft(getTeamJerseyColors(team));
  }, [team]);

  useEffect(() => {
    setActiveColorIndex((prev) => {
      if (jerseyColorsDraft.length === 0) return 0;
      return Math.min(prev, jerseyColorsDraft.length - 1);
    });
  }, [jerseyColorsDraft]);

  useEffect(() => {
    const term = inviteEmail.trim();
    if (!term || term.length < 2) {
      setSuggestions([]);
      setSearchingPlayers(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setSearchingPlayers(true);
        const res = await userService.searchUsers(term, { role: 'player', teamId: id });
        if (!cancelled) {
          setSuggestions(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSearchingPlayers(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [inviteEmail, id]);

  const handleInviteChange = (value) => {
    setInviteEmail(value);
    setSelectedInvite(null);
    setInviteError(null);
    setInviteSuccess(null);
  };

  const chooseSuggestion = (candidate) => {
    setInviteEmail(candidate.email || '');
    setSelectedInvite(candidate);
    setSuggestions([]);
  };

  const handleUpdateRequest = async (requestUserId, nextStatus) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      await teamService.updateMember(id, requestUserId, { status: nextStatus });
      setSuccessMessage(nextStatus === 'active' ? text('Request approved.', 'បានអនុម័តសំណើ។') : text('Request denied.', 'បានបដិសេធសំណើ។'));
      await refresh();
    } catch (err) {
      setError(err?.error || text('Failed to update request', 'មិនអាចធ្វើបច្ចុប្បន្នភាពសំណើបានទេ'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (member) => {
    const memberName = `${member.user?.firstName || member.user?.username || 'This member'} ${member.user?.lastName || ''}`.trim();
    const confirmed = await confirm(`Are you sure you want to remove ${memberName} from this team?`, {
      title: text('Remove Member', 'ដកសមាជិកចេញ'),
      confirmText: text('Remove', 'ដកចេញ'),
      cancelText: text('Cancel', 'បោះបង់'),
      badgeLabel: text('Team Member', 'សមាជិកក្រុម'),
      variant: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      await teamService.removeMember(id, member.userId);
      setSuccessMessage(text(`${memberName} was removed from the team.`, `បានដក ${memberName} ចេញពីក្រុម។`));
      if (selectedMember?.userId === member.userId) {
        setSelectedMember(null);
      }
      await refresh();
    } catch (err) {
      setError(err?.error || text('Failed to remove member', 'មិនអាចដកសមាជិកចេញបានទេ'));
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

  // Note: modal rendered via selectedMember state below

  if (!team) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900">{text('Team not found', 'រកមិនឃើញក្រុម')}</h1>
        <Link to="/app/teams" className="mt-4 inline-block text-green-700 hover:text-green-800">
          {text('Back to Teams', 'ត្រឡប់ទៅក្រុម')}
        </Link>
      </div>
    );
  }

  if (!isCaptainOfTeam && !isAdmin()) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-lg font-semibold text-gray-900">{text('Access Denied', 'មិនអនុញ្ញាតឱ្យចូលប្រើ')}</h1>
        <p className="mt-2 text-sm text-gray-600">{text('Only the captain (or admin) can manage this team.', 'មានតែកាពីតែន (ឬអ្នកគ្រប់គ្រង) ប៉ុណ្ណោះដែលអាចគ្រប់គ្រងក្រុមនេះបាន។')}</p>
      </div>
    );
  }

  const activeMembers = Array.isArray(members)
    ? members.filter((m) => m.status === 'active' && m.isActive !== false)
    : [];
  const pendingCount = Array.isArray(requests) ? requests.length : 0;

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
  
  const handleInvite = async () => {
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setInviteError(text('Player email is required', 'ត្រូវការអ៊ីមែលអ្នកលេង'));
      return;
    }
    try {
      setActionLoading(true);
      setInviteError(null);
      setInviteSuccess(null);
      const data = {
        email: selectedInvite?.email ? selectedInvite.email.toLowerCase() : normalizedEmail
      };
      const response = await teamService.inviteMember(id, data);
      if (response.success) {
        setInviteSuccess(text('Invitation sent', 'បានផ្ញើការអញ្ជើញ'));
        setInviteEmail('');
        setSelectedInvite(null);
        setSuggestions([]);
        await refresh();
      }
    } catch (err) {
      setInviteError(err?.error || text('Failed to send invitation', 'មិនអាចផ្ញើការអញ្ជើញបានទេ'));
    } finally {
      setActionLoading(false);
    }
  };

  const openMemberDetails = (member) => {
    setSelectedMember(member);
  };

  const closeMemberDetails = () => setSelectedMember(null);

  const setJerseyColorAt = (index, value) => {
    const normalized = normalizeHexColor(value) || DEFAULT_JERSEY_COLOR;
    setJerseyColorsDraft((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [DEFAULT_JERSEY_COLOR];
      next[index] = normalized;
      return normalizeJerseyColors(next);
    });
  };

  const addJerseyColor = () => {
    setJerseyColorsDraft((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [DEFAULT_JERSEY_COLOR];
      if (current.length >= 5) return current;
      const normalizedCurrent = current.map((color) => normalizeHexColor(color) || DEFAULT_JERSEY_COLOR);
      const nextColor =
        JERSEY_COLOR_PRESETS.find((preset) => !normalizedCurrent.includes(preset)) || DEFAULT_JERSEY_COLOR;
      const next = [...current, nextColor];
      setActiveColorIndex(next.length - 1);
      return next;
    });
  };

  const removeJerseyColor = (index) => {
    setJerseyColorsDraft((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [DEFAULT_JERSEY_COLOR];
      if (current.length <= 1) return current;
      current.splice(index, 1);
      return normalizeJerseyColors(current);
    });
  };

  const applyPresetColor = (presetColor) => {
    setJerseyColorAt(activeColorIndex, presetColor);
  };

  const handleSaveShirtColor = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      const normalizedColors = normalizeJerseyColors(jerseyColorsDraft);
      const response = await teamService.updateTeam(id, { jerseyColors: normalizedColors });
      if (response.success) {
        setSuccessMessage(text('Team jersey colors updated successfully.', 'បានធ្វើបច្ចុប្បន្នភាពពណ៌អាវក្រុមដោយជោគជ័យ។'));
        setTeam((prev) =>
          prev
            ? { ...prev, jerseyColors: normalizedColors, shirtColor: normalizedColors[0] || DEFAULT_JERSEY_COLOR }
            : prev
        );
      }
    } catch (err) {
      setError(err?.error || text('Failed to update team jersey colors', 'មិនអាចធ្វើបច្ចុប្បន្នភាពពណ៌អាវក្រុមបានទេ'));
    } finally {
      setActionLoading(false);
    }
  };

  const currentJerseyColors = getTeamJerseyColors(team);
  const hasColorChanges =
    JSON.stringify(normalizeJerseyColors(jerseyColorsDraft)) !== JSON.stringify(normalizeJerseyColors(currentJerseyColors));

  const handleDeleteTeam = async () => {
    const confirmed = await confirm(`Are you sure you want to delete ${team.name}? This action cannot be undone and all team data will be permanently deleted.`, {
      title: text('Delete Team', 'លុបក្រុម'),
      confirmText: text('Delete Team', 'លុបក្រុម'),
      cancelText: text('Cancel', 'បោះបង់'),
      badgeLabel: text('Danger Zone', 'តំបន់គ្រោះថ្នាក់'),
      variant: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await teamService.deleteTeam(id);
      setSuccessMessage(text('Team deleted successfully', 'បានលុបក្រុមដោយជោគជ័យ'));
      setTimeout(() => {
        navigate('/app/teams');
      }, 1000);
    } catch (err) {
      setError(err?.error || text('Failed to delete team', 'មិនអាចលុបក្រុមបានទេ'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {selectedMember && (
        <MemberDetailsModal member={selectedMember} onClose={closeMemberDetails} />
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{text('Team Management', 'ការគ្រប់គ្រងក្រុម')}</h1>
            <p className="mt-1 text-sm text-gray-600">{team.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                <UsersIcon className="h-3.5 w-3.5" />
                {text(`${activeMembers.length} Active`, `${activeMembers.length} សកម្ម`)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                {text(`${pendingCount} Pending`, `${pendingCount} កំពុងរង់ចាំ`)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/app/teams/${team.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {text('Back', 'ត្រឡប់')}
            </Link>
            {isCaptainOfTeam && (
              <button
                onClick={handleDeleteTeam}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                {text('Delete Team', 'លុបក្រុម')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-cyan-50/30 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{text('Team Jersey Colors', 'ពណ៌អាវក្រុម')}</h2>
            <p className="mt-1 text-sm text-slate-600">{text('Set one or more colors to avoid kit clashes before a match.', 'កំណត់ពណ៌មួយ ឬច្រើន ដើម្បីជៀសវាងពណ៌អាវដូចគ្នាមុនការប្រកួត។')}</p>
            <p className="mt-1 text-xs text-slate-500">{text('Up to 5 colors. First color is treated as primary.', 'អាចមានរហូតដល់ ៥ ពណ៌។ ពណ៌ទីមួយត្រូវបានចាត់ទុកជាពណ៌ចម្បង។')}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
            {currentJerseyColors.map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-4 w-4 rounded-full shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)]"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="ml-1 text-xs font-medium text-slate-500">{currentJerseyColors.length}</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {jerseyColorsDraft.map((color, index) => (
            <div
              key={`${color}-${index}`}
              className={`group flex flex-wrap items-center gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-all hover:border-emerald-200 hover:shadow ${
                activeColorIndex === index ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200'
              }`}
              onClick={() => setActiveColorIndex(index)}
            >
              <div className="inline-flex items-center gap-2">
                 <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">#{index + 1}</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setJerseyColorAt(index, e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 transition-transform group-hover:scale-[1.02]"
                  aria-label={`Pick team jersey color ${index + 1}`}
                />
              </div>
              <span className="inline-flex min-w-[108px] justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 uppercase">
                {color}
              </span>
              <button
                type="button"
                onClick={() => removeJerseyColor(index)}
                disabled={jerseyColorsDraft.length <= 1}
                className="inline-flex items-center rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                 {text('Remove', 'ដកចេញ')}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {text(`Quick Picks for Color #${activeColorIndex + 1}`, `ជម្រើសរហ័សសម្រាប់ពណ៌ #${activeColorIndex + 1}`)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {JERSEY_COLOR_PRESETS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => applyPresetColor(presetColor)}
                className={`h-7 w-7 rounded-full shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] transition-transform hover:scale-110 ${
                  normalizeHexColor(jerseyColorsDraft[activeColorIndex]) === presetColor ? 'ring-2 ring-emerald-400' : ''
                }`}
                style={{ backgroundColor: presetColor }}
                aria-label={`Choose preset color ${presetColor}`}
                title={presetColor}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addJerseyColor}
            disabled={jerseyColorsDraft.length >= 5}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {text('Add Color', 'បន្ថែមពណ៌')}
          </button>
          <button
            type="button"
            onClick={handleSaveShirtColor}
            disabled={actionLoading || !hasColorChanges}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading ? text('Saving...', 'កំពុងរក្សាទុក...') : text('Save Colors', 'រក្សាទុកពណ៌')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* invite form column */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{text('Invite Player', 'អញ្ជើញអ្នកលេង')}</h2>
              <p className="text-xs text-gray-500 mt-1">{text('Only existing player accounts can be invited.', 'អាចអញ្ជើញបានតែគណនីអ្នកលេងដែលមានស្រាប់ប៉ុណ្ណោះ។')}</p>
            </div>
            <UserPlusIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inviteEmail}
                  onChange={(e) => handleInviteChange(e.target.value)}
                  placeholder={text('Type player name, username, or email', 'វាយឈ្មោះអ្នកលេង ឈ្មោះគណនី ឬអ៊ីមែល')}
                  className="w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                {searchingPlayers && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md px-3 py-2 text-xs text-gray-500">
                    {text('Searching players...', 'កំពុងស្វែងរកអ្នកលេង...')}
                  </div>
                )}
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md max-h-44 overflow-auto">
                    {suggestions.map((u) => (
                      <li
                        key={u.id}
                        onClick={() => chooseSuggestion(u)}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <img
                          src={resolveUserAvatarUrl(u)}
                          alt={`${u.firstName || u.username || 'Player'} avatar`}
                          className="h-10 w-10 rounded-full border border-gray-200 bg-gray-100 object-cover"
                          onError={(e) => {
                            const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                            if (e.currentTarget.src !== fallbackUrl) {
                              e.currentTarget.src = fallbackUrl;
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{u.firstName || u.username} {u.lastName || ''}</div>
                          <div className="truncate text-xs text-gray-500">{u.username} {u.email ? `- ${u.email}` : ''}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={handleInvite}
                disabled={actionLoading || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50"
              >
                <UserPlusIcon className="h-4 w-4" />
                {actionLoading ? text('Sending...', 'កំពុងផ្ញើ...') : text('Invite', 'អញ្ជើញ')}
              </button>
            </div>
            {selectedInvite && (
              <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <img
                  src={resolveUserAvatarUrl(selectedInvite)}
                  alt={`${selectedInvite.firstName || selectedInvite.username || 'Player'} avatar`}
                  className="h-9 w-9 rounded-full border border-gray-200 bg-gray-100 object-cover"
                  onError={(e) => {
                    const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
                <div className="min-w-0">
                  <div className="truncate">
                    {text('Selected:', 'បានជ្រើសរើស:')} <span className="font-medium">{selectedInvite.firstName || selectedInvite.username}</span>
                  </div>
                  <div className="truncate">{selectedInvite.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">{text('Pending Requests', 'សំណើកំពុងរង់ចាំ')}</h2>
            <span className="text-xs text-gray-500">{text(`${pendingCount} requests`, `${pendingCount} សំណើ`)}</span>
          </div>
          <div className="p-6">
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.userId} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{req.user?.firstName || req.user?.username || 'User'} {req.user?.lastName || ''}</div>
                      <div className="text-xs text-gray-500">@{req.user?.username || 'unknown'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateRequest(req.userId, 'active')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                         {text('Approve', 'អនុម័ត')}
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateRequest(req.userId, 'inactive')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-3.5 w-3.5" />
                         {text('Deny', 'បដិសេធ')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-sm text-gray-500 text-center py-6">{text('No pending requests.', 'មិនមានសំណើកំពុងរង់ចាំទេ។')}</div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
             <h2 className="text-sm font-semibold text-gray-900">{text('Active Members', 'សមាជិកសកម្ម')}</h2>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <UserGroupIcon className="h-4 w-4" />
               {text(`${activeMembers.length} members`, `${activeMembers.length} សមាជិក`)}
            </span>
          </div>
          <div className="p-6">
            {activeMembers.length > 0 ? (
              <div className="space-y-3">
                {activeMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                    onClick={() => openMemberDetails(m)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openMemberDetails(m);
                      }
                    }}
                    tabIndex={0}
                  >
                    <div className="text-sm text-gray-900 flex items-center gap-3">
                      <img
                        src={resolveUserAvatarUrl(m.user)}
                        alt={`${m.user?.firstName || m.user?.username || 'User'} avatar`}
                        className="h-9 w-9 cursor-zoom-in rounded-full border border-gray-200 bg-gray-100 object-cover"
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
                      <button onClick={() => openMemberDetails(m)} className="text-left" type="button">
                        <div className="font-medium">{m.user?.firstName || m.user?.username || 'User'}</div>
                        <div className="text-xs text-gray-500">{m.user?.username}</div>
                      </button>
                      <span className="ml-2 text-xs text-gray-500 capitalize">({m.role})</span>
                    </div>
                    {isCaptainOfTeam && m.userId !== team.captainId && (
                      <button
                        disabled={actionLoading}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveMember(m);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-50"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                         {text('Remove', 'ដកចេញ')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-sm text-gray-500 text-center py-6">{text('No active members.', 'មិនមានសមាជិកសកម្មទេ។')}</div>
            )}
          </div>
        </div>
      </div>
      <ImagePreviewModal
        open={Boolean(previewImage)}
        imageUrl={previewImage?.url}
        title={previewImage?.title || text('Member photo', 'រូបថតសមាជិក')}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default TeamManagePage;
