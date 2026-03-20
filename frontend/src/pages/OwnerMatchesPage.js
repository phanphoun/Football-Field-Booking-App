import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CalendarIcon,
  CheckCircleIcon,
  TrophyIcon,
  BuildingOfficeIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import bookingService from '../services/bookingService';
import teamService from '../services/teamService';
import userService from '../services/userService';
import notificationService from '../services/notificationService';
import { useRealtime } from '../context/RealtimeContext';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const statusTone = (status) => {
  const tones = { confirmed: 'green', completed: 'blue' };
  return tones[status] || 'gray';
};

const resolveTeamLogoUrl = (team) => {
  const raw = team?.logoUrl || team?.logo_url || team?.logo || null;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) return raw;
  const normalized = String(raw).startsWith('/') ? raw : `/${raw}`;
  return `${API_ORIGIN}${normalized}`;
};

const TeamAvatar = ({ teamName, logoUrl }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!logoUrl && !imageFailed;
  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  return (
    <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-gray-200 bg-gray-100 overflow-hidden shadow-sm">
      {showImage ? (
        <img
          src={logoUrl}
          alt={`${teamName} logo`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-50">
          <PhotoIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      )}
    </div>
  );
};

const OwnerMatchesPage = () => {
  const { user } = useAuth();
  const { version } = useRealtime();
  const PAGE_SIZE = 10;
  const RESULT_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [resultDrafts, setResultDrafts] = useState({});
  const [teamLogosById, setTeamLogosById] = useState({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const refresh = async () => {
    const res = await bookingService.getAllBookings({ limit: 300 });
    setBookings(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        setError(err?.error || 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [version]);

  const matches = useMemo(() => {
    return bookings
      .filter((b) => ['confirmed', 'completed'].includes(b.status) && b.team?.id && b.opponentTeam?.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [bookings]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [matches.length]);

  const visibleMatches = useMemo(() => matches.slice(0, visibleCount), [matches, visibleCount]);
  const canShowMore = matches.length > visibleCount;

  useEffect(() => {
    const teamIds = Array.from(
      new Set(
        matches
          .flatMap((m) => [m.team?.id, m.opponentTeam?.id])
          .filter(Boolean)
      )
    );

    const missingIds = teamIds.filter((id) => teamLogosById[id] === undefined);
    if (missingIds.length === 0) return;

    let cancelled = false;

    const loadTeamLogos = async () => {
      const entries = await Promise.all(
        missingIds.map(async (teamId) => {
          try {
            const response = await teamService.getTeamById(teamId);
            const teamData = response?.data || null;
            return [teamId, resolveTeamLogoUrl(teamData)];
          } catch {
            return [teamId, null];
          }
        })
      );

      if (cancelled) return;

      setTeamLogosById((prev) => {
        const next = { ...prev };
        for (const [teamId, logoUrl] of entries) {
          if (next[teamId] === undefined) {
            next[teamId] = logoUrl;
          }
        }
        return next;
      });
    };

    loadTeamLogos();

    return () => {
      cancelled = true;
    };
  }, [matches, teamLogosById]);

  const getInitialDraft = (booking) => ({
    homeScore: booking?.matchResult?.homeScore ?? '',
    awayScore: booking?.matchResult?.awayScore ?? '',
    matchNotes: booking?.matchResult?.matchNotes || ''
  });

  const handleCardClick = (booking) => {
    setError(null);
    setActiveCardId((prev) => (prev === booking.id ? null : booking.id));
    setResultDrafts((prev) => ({
      ...prev,
      [booking.id]: prev[booking.id] || getInitialDraft(booking)
    }));
  };

  const updateDraft = (bookingId, key, value) => {
    setResultDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        [key]: value
      }
    }));
  };

  const isWithinEditWindow = (booking) => {
    const startMs = booking?.startTime ? new Date(booking.startTime).getTime() : null;
    if (!startMs || Number.isNaN(startMs)) return false;
    return Date.now() - startMs <= RESULT_EDIT_WINDOW_MS;
  };

  const requestAdminChange = async (booking) => {
    try {
      setSavingId(booking.id);
      setError(null);
      setSuccessMessage(null);

      const usersRes = await userService.getAllUsers();
      const allUsers = Array.isArray(usersRes?.data) ? usersRes.data : [];
      const admins = allUsers.filter((u) => u?.role === 'admin' && u?.id);

      if (admins.length === 0) {
        setError('No admin account found to receive this request.');
        return;
      }

      const homeTeamName = booking?.team?.name || 'Home Team';
      const awayTeamName = booking?.opponentTeam?.name || 'Away Team';
      const when = booking?.startTime ? new Date(booking.startTime).toLocaleString() : 'Unknown date';

      await Promise.all(
        admins.map((admin) =>
          notificationService.create({
            userId: admin.id,
            type: 'system',
            title: 'Match result change request',
            message: `Owner requested admin review to change result for ${homeTeamName} vs ${awayTeamName} (${when}).`,
            metadata: {
              event: 'match_result_change_request',
              bookingId: booking.id,
              requesterId: user?.id,
              teamA: homeTeamName,
              teamB: awayTeamName,
              startTime: booking?.startTime || null
            }
          })
        )
      );

      setSuccessMessage('Request sent to admin. They will review this match result change.');
    } catch (err) {
      setError(err?.error || 'Failed to send admin change request');
    } finally {
      setSavingId(null);
    }
  };

  const saveResult = async (booking) => {
    if (booking.status !== 'completed') {
      setError('Result can only be entered after the match is completed.');
      return;
    }
    if (!isWithinEditWindow(booking)) {
      setError('Result editing is locked after 24 hours. Please request admin to change it.');
      return;
    }

    const draft = resultDrafts[booking.id] || getInitialDraft(booking);
    const homeRaw = String(draft.homeScore ?? '').trim();
    const awayRaw = String(draft.awayScore ?? '').trim();

    if (homeRaw === '' || awayRaw === '') {
      setError('Please enter both team scores.');
      return;
    }

    const homeScore = Number(homeRaw);
    const awayScore = Number(awayRaw);
    if (!Number.isInteger(homeScore) || homeScore < 0 || !Number.isInteger(awayScore) || awayScore < 0) {
      setError('Scores must be non-negative whole numbers.');
      return;
    }

    try {
      setSavingId(booking.id);
      setError(null);
      setSuccessMessage(null);

      if (booking?.matchResult?.id) {
        await bookingService.updateMatchResult(booking.matchResult.id, {
          bookingId: booking.id,
          homeScore,
          awayScore,
          matchNotes: draft.matchNotes || null
        });
      } else {
        await bookingService.createMatchResult({
          bookingId: booking.id,
          homeScore,
          awayScore,
          matchNotes: draft.matchNotes || null
        });
      }

      await refresh();
      setActiveCardId(null);
    } catch (err) {
      setError(err?.error || 'Failed to save result');
    } finally {
      setSavingId(null);
    }
  };

  const markMatchCompleted = async (bookingId) => {
    try {
      setSavingId(bookingId);
      setError(null);
      await bookingService.completeBooking(bookingId);
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to mark match as completed');
    } finally {
      setSavingId(null);
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
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
          <p className="mt-1 text-sm text-gray-600">Confirmed team-vs-team matches. Open any card to update result.</p>
        </div>
        <Button as={Link} to="/owner/bookings" variant="outline" size="sm">
          <BuildingOfficeIcon className="h-4 w-4" />
          Booking requests
        </Button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">{successMessage}</div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}

      <Card>
        <CardHeader className="px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">Match Cards</div>
          <Badge tone="blue">{matches.length} matches</Badge>
        </CardHeader>

        <div className="border-t border-gray-200">
          {matches.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={TrophyIcon}
                title="No matches yet"
                description="Matches appear here after bookings are confirmed with both teams."
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {visibleMatches.map((m) => {
                const isOpen = activeCardId === m.id;
                const draft = resultDrafts[m.id] || getInitialDraft(m);
                const hasResult = !!m.matchResult?.id;
                const canEditWindow = isWithinEditWindow(m);
                const canInputResult = m.status === 'completed' && canEditWindow;
                const homeTeamName = m.team?.name || 'Home Team';
                const awayTeamName = m.opponentTeam?.name || 'Away Team';
                const homeTeamLogo = teamLogosById[m.team?.id] ?? resolveTeamLogoUrl(m.team);
                const awayTeamLogo = teamLogosById[m.opponentTeam?.id] ?? resolveTeamLogoUrl(m.opponentTeam);
                const isSaving = savingId === m.id;

                return (
                  <div key={m.id} className="p-4">
                    <button
                      type="button"
                      onClick={() => canInputResult && handleCardClick(m)}
                      className={`w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        canInputResult ? 'hover:border-blue-200 hover:shadow-md cursor-pointer' : 'opacity-90 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-2">
                          <Badge tone={statusTone(m.status)} className="capitalize">
                            {m.status}
                          </Badge>
                          {hasResult && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              Final
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 inline-flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {m?.startTime ? new Date(m.startTime).toLocaleString() : '-'}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
                        <div className="text-center">
                          <TeamAvatar teamName={homeTeamName} logoUrl={homeTeamLogo} />
                          <div className="text-sm sm:text-base font-semibold text-gray-900 break-words">{homeTeamName}</div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-center min-w-[90px] sm:min-w-[106px]">
                          <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">
                            {hasResult ? `${m.matchResult.homeScore} : ${m.matchResult.awayScore}` : '- : -'}
                          </div>
                        </div>
                        <div className="text-center">
                          <TeamAvatar teamName={awayTeamName} logoUrl={awayTeamLogo} />
                          <div className="text-sm sm:text-base font-semibold text-gray-900 break-words">{awayTeamName}</div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500 truncate">{m.field?.name || 'Field'}</div>
                      {!canInputResult && (
                        <div className="mt-2 text-xs text-amber-700">
                          {m.status !== 'completed'
                            ? 'Input is locked until this match is marked completed.'
                            : 'Result editing is locked after 24 hours.'}
                        </div>
                      )}
                    </button>

                    {m.status === 'confirmed' && (
                      <div className="mt-3 flex items-center justify-end">
                        <Button size="sm" disabled={isSaving} onClick={() => markMatchCompleted(m.id)}>
                          <CheckCircleIcon className="h-4 w-4" />
                          Confirm Match Completed
                        </Button>
                      </div>
                    )}
                    {m.status === 'completed' && !canEditWindow && (
                      <div className="mt-3 flex items-center justify-end">
                        <Button size="sm" variant="outline" disabled={isSaving} onClick={() => requestAdminChange(m)}>
                          Request Admin Change
                        </Button>
                      </div>
                    )}

                    {isOpen && (
                      <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 space-y-3">
                        <div className="text-xs font-semibold text-blue-900">Result Form</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700">{homeTeamName} score</label>
                            <input
                              type="number"
                              min="0"
                              value={draft.homeScore}
                              onChange={(e) => updateDraft(m.id, 'homeScore', e.target.value)}
                              className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">{awayTeamName} score</label>
                            <input
                              type="number"
                              min="0"
                              value={draft.awayScore}
                              onChange={(e) => updateDraft(m.id, 'awayScore', e.target.value)}
                              className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Match notes (optional)</label>
                          <textarea
                            rows={2}
                            value={draft.matchNotes}
                            onChange={(e) => updateDraft(m.id, 'matchNotes', e.target.value)}
                            className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" disabled={isSaving} onClick={() => saveResult(m)}>
                            {isSaving ? 'Saving...' : hasResult ? 'Update Result' : 'Save Result'}
                          </Button>
                          <Button size="sm" variant="outline" disabled={isSaving} onClick={() => setActiveCardId(null)}>
                            Cancel
                          </Button>
                          {m.status === 'confirmed' && (
                            <span className="text-xs text-gray-600 inline-flex items-center gap-1">
                              <CheckCircleIcon className="h-4 w-4" />
                              Mark booking as completed first.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {matches.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              Showing {Math.min(visibleCount, matches.length)} of {matches.length} matches
            </div>
            {canShowMore && (
              <Button variant="outline" size="sm" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
                Show more
              </Button>
            )}
          </div>
        )}

        <CardBody className="px-6 py-4 text-xs text-gray-500">
          Click any match card to open the result form.
        </CardBody>
      </Card>
    </div>
  );
};

export default OwnerMatchesPage;
