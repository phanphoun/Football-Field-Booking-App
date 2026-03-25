import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import teamService from '../services/teamService';
import { UsersIcon, MapPinIcon, TrophyIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { ImagePreviewModal, useToast } from '../components/ui';
import { getTeamJerseyColors } from '../utils/teamColors';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const resolveTeamLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
  const normalizedLogoPath = rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
  return `${API_ORIGIN}${normalizedLogoPath}`;
};

const getActionErrorMessage = (error) => error?.error || error?.message || '';

const isAlreadyMemberError = (message) => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('already a member') || normalized.includes('already joined') || normalized.includes('already in this team');
};

const isPendingRequestError = (message) => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('pending request') || normalized.includes('already requested') || normalized.includes('request already') || normalized.includes('already has a pending');
};

const PublicTeamDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const text = useCallback((en, km) => (language === 'km' ? km : en), [language]);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [history, setHistory] = useState({ stats: { total: 0, wins: 0, losses: 0, draws: 0 }, matches: [] });
  const [historyAvailable, setHistoryAvailable] = useState(true);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [joinRequested, setJoinRequested] = useState(false);
  const [isCurrentMember, setIsCurrentMember] = useState(false);
  const [requestingJoin, setRequestingJoin] = useState(false);

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
    if (!isAuthenticated) return;

    let active = true;

    const loadMembership = async () => {
      try {
        const response = await teamService.getMyTeams();
        if (!active) return;
        const myTeams = Array.isArray(response.data) ? response.data : [];
        setIsCurrentMember(myTeams.some((teamItem) => Number(teamItem?.id) === Number(id)));
      } catch {
        if (active) {
          setIsCurrentMember(false);
        }
      }
    };

    loadMembership();

    return () => {
      active = false;
    };
  }, [id, isAuthenticated]);

  const canRequestJoin = () => {
    if (!isAuthenticated) return false;
    if (!user) return false;
    if (!['player', 'captain', 'admin'].includes(user?.role || '')) return false;
    // Prevent captains from joining their own teams
    if (team?.captainId === user?.id) return false;
    return true;
  };

  useEffect(() => {
    const fetchTeamAndHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const [teamResponse, historyResponse] = await Promise.all([
          teamService.getPublicTeamById(id),
          teamService.getPublicTeamMatchHistory(id, { limit: 5 }).catch(() => null)
        ]);

        setTeam(teamResponse.data || null);

        const historyData = historyResponse?.data;
        if (historyData && (Array.isArray(historyData.matches) || historyData.stats)) {
          setHistory({
            stats: historyData.stats || { total: 0, wins: 0, losses: 0, draws: 0 },
            matches: Array.isArray(historyData.matches) ? historyData.matches : []
          });
          setHistoryAvailable(true);
        } else {
          setHistoryAvailable(false);
        }
      } catch (err) {
        console.error('Failed to fetch team:', err);
        setError(text('Failed to load team', 'មិនអាចផ្ទុកក្រុមបានទេ'));
      } finally {
        setLoading(false);
      }
    };

    fetchTeamAndHistory();
  }, [id, text]);

  const handleRequestJoin = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/teams/${id}`, backgroundLocation: location } });
      return;
    }

    try {
      setRequestingJoin(true);
      setError(null);
      setSuccessMessage(null);
      const response = await teamService.joinTeam(id);
      if (response.success) {
        setJoinRequested(true);
        setSuccessMessage(text('Join request submitted!', 'បានផ្ញើសំណើចូលក្រុម!'));
      }
    } catch (err) {
      const message = getActionErrorMessage(err);
      if (isAlreadyMemberError(message)) {
        setIsCurrentMember(true);
        setError(text('You are already a member of this team.', 'អ្នកជាសមាជិកក្រុមនេះរួចហើយ។'));
      } else if (isPendingRequestError(message)) {
        setJoinRequested(true);
        setError(text('Your request is already pending for this team.', 'សំណើរបស់អ្នកសម្រាប់ក្រុមនេះកំពុងរង់ចាំរួចហើយ។'));
      } else {
        setError(message || text('Failed to submit join request', 'មិនអាចផ្ញើសំណើចូលក្រុមបានទេ'));
      }
    } finally {
      setRequestingJoin(false);
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
        <h1 className="text-xl font-semibold text-gray-900">{text('Team not found', 'រកមិនឃើញក្រុម')}</h1>
        <Link to="/teams" className="mt-4 inline-block text-green-700 hover:text-green-800">
          {text('Back to Teams', 'ត្រឡប់ទៅក្រុម')}
        </Link>
      </div>
    );
  }

  const teamLogoUrl = resolveTeamLogoUrl(team.logoUrl || team.logo_url || team.logo);
  const jerseyColors = getTeamJerseyColors(team);
  const recentMatches = Array.isArray(history.matches) ? history.matches.slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="h-52 bg-gray-100 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <UsersIcon className="h-16 w-16 text-gray-300" />
          </div>
          {teamLogoUrl && (
            <img
              src={teamLogoUrl}
              alt={`${team.name} logo`}
              className="relative z-10 h-full w-full cursor-zoom-in object-cover"
              onClick={() => setImagePreviewOpen(true)}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
        <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {text('Captain:', 'កាពីតែន:')} {team.captain?.firstName || team.captain?.username || text('Unknown', 'មិនស្គាល់')}
            </p>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <UsersIcon className="h-5 w-5 mr-1 text-gray-400" />
            {text(`${team.memberCount || 0} members`, `${team.memberCount || 0} សមាជិក`)}
          </div>
        </div>

        {team.description && <p className="mt-4 text-gray-700">{team.description}</p>}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          {team.homeField && (
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">{text('Home Field', 'ទីលានម្ចាស់ផ្ទះ')}</div>
                <div>{team.homeField.name}</div>
                <div className="text-xs text-gray-500">
                  {team.homeField.address}, {team.homeField.city}
                </div>
              </div>
            </div>
          )}

          {team.skillLevel && (
            <div>
              <div className="font-medium text-gray-900">{text('Skill Level', 'កម្រិតជំនាញ')}</div>
              <div className="capitalize">{team.skillLevel}</div>
            </div>
          )}

          <div>
            <div className="font-medium text-gray-900">{text('Jersey Colors', 'ពណ៌អាវក្រុម')}</div>
            <div className="mt-1 inline-flex items-center gap-1.5">
              {jerseyColors.map((color, index) => (
                <span key={`${color}-${index}`} className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium text-gray-900">{text('Team Created', 'ថ្ងៃបង្កើតក្រុម')}</div>
            <div>{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : text('Not available', 'មិនមាន')}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-gray-500">{text('Matches', 'ការប្រកួត')}</div>
            <div className="text-lg font-semibold text-gray-900">{history.stats?.total || 0}</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-xs text-emerald-700">{text('Wins', 'ឈ្នះ')}</div>
            <div className="text-lg font-semibold text-emerald-800">{history.stats?.wins || 0}</div>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <div className="text-xs text-rose-700">{text('Losses', 'ចាញ់')}</div>
            <div className="text-lg font-semibold text-rose-800">{history.stats?.losses || 0}</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="text-xs text-amber-700">{text('Draws', 'ស្មើ')}</div>
            <div className="text-lg font-semibold text-amber-800">{history.stats?.draws || 0}</div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
              <TrophyIcon className="h-4 w-4 text-gray-500" />
              {text('Recent Match History', 'ប្រវត្តិការប្រកួតថ្មីៗ')}
            </h2>
            <span className="text-xs text-gray-500">{text('Last 5 matches', '៥ ប្រកួតចុងក្រោយ')}</span>
          </div>

          <div className="p-4">
            {!historyAvailable ? (
              <p className="text-sm text-gray-500">{text('Match history is not available for this team yet.', 'មិនទាន់មានប្រវត្តិការប្រកួតសម្រាប់ក្រុមនេះនៅឡើយទេ។')}</p>
            ) : recentMatches.length === 0 ? (
              <p className="text-sm text-gray-500">{text('No completed matches recorded yet.', 'មិនទាន់មានការប្រកួតដែលបានបញ្ចប់នៅឡើយទេ។')}</p>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match, idx) => (
                  <div key={match.id || `${match.opponentTeamName || 'opponent'}-${idx}`} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{match.opponentTeamName || text('Opponent', 'គូប្រកួត')}</div>
                      <div className="text-xs text-gray-500 inline-flex items-center gap-1 mt-1">
                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                        {match.dateTime ? new Date(match.dateTime).toLocaleDateString() : text('Date unavailable', 'មិនមានកាលបរិច្ឆេទ')}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-800">{match.result || match.score || '-'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/teams"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {text('Back to Teams', 'ត្រឡប់ទៅក្រុម')}
          </Link>

          {isCurrentMember || team?.captainId === user?.id ? (
            <button
              disabled
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-500 bg-gray-300"
            >
              {text('Your Team', 'ក្រុមរបស់អ្នក')}
            </button>
          ) : joinRequested ? (
            <button
              disabled
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-amber-500"
            >
              {text('Requested', 'បានស្នើ')}
            </button>
          ) : canRequestJoin() ? (
            <button
              onClick={handleRequestJoin}
              disabled={requestingJoin}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
            >
              {requestingJoin ? text('Sending...', 'កំពុងផ្ញើ...') : text('Request to Join', 'ស្នើចូលក្រុម')}
            </button>
          ) : (
            <button
              onClick={() => navigate('/login', { state: { from: `/teams/${id}`, backgroundLocation: location } })}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              {text('Login to Request', 'ចូលគណនីដើម្បីស្នើ')}
            </button>
          )}
        </div>
        </div>
      </div>
      <ImagePreviewModal
        open={imagePreviewOpen}
        imageUrl={teamLogoUrl}
        title={`${team.name} image`}
        onClose={() => setImagePreviewOpen(false)}
      />
    </div>
  );
};

export default PublicTeamDetailsPage;
