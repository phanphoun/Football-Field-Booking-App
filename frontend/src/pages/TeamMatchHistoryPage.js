import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  FlagIcon,
  TrophyIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import teamService from '../services/teamService';
import ratingService from '../services/ratingService';
import { EmptyState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const TeamMatchHistoryPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/owner') ? '/owner' : '/app';
  const { user } = useAuth();
  const isCaptainOrAdmin = user?.role === 'captain' || user?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({ teamName: '', stats: { total: 0, wins: 0, losses: 0, draws: 0 }, matches: [] });
  const [ratingMetaByBooking, setRatingMetaByBooking] = useState({});
  const [ratingForms, setRatingForms] = useState({});
  const [ratingSubmitting, setRatingSubmitting] = useState({});
  const [ratingErrors, setRatingErrors] = useState({});
  const [activeRatingBookingId, setActiveRatingBookingId] = useState(null);
  const [activeRatingMode, setActiveRatingMode] = useState('rate');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterKey, setFilterKey] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamService.getTeamMatchHistory(id);
        setHistory(response.data || { teamName: '', stats: { total: 0, wins: 0, losses: 0, draws: 0 }, matches: [] });
      } catch (err) {
        setError(err?.error || 'Failed to load match history');
      } finally {
        setLoading(false);
      }
    };

    const loadRatings = async () => {
      if (!user) return;
      if (user.role !== 'captain' && user.role !== 'admin') return;
      try {
        const response = await ratingService.getMatchHistoryForRating();
        const rows = Array.isArray(response?.data) ? response.data : [];
        const filtered = rows.filter((row) => String(row.team?.id) === String(id));
        const map = {};
        filtered.forEach((row) => {
          map[row.bookingId] = row;
        });
        setRatingMetaByBooking(map);
      } catch (err) {
        // Keep match history visible even if rating data fails
      }
    };

    loadHistory();
    loadRatings();
  }, [id, user]);

  const resultClasses = (result) => {
    if (result === 'Win') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (result === 'Loss') return 'bg-rose-50 border-rose-200 text-rose-700';
    return 'bg-amber-50 border-amber-200 text-amber-700';
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'TT';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const getResultLabel = (match) => {
    const score = match.finalScore || '0 - 0';
    const suffix = match.result === 'Win' ? 'W' : match.result === 'Loss' ? 'L' : 'D';
    return `${score} (${suffix})`;
  };

  const handleRatingFieldChange = (bookingId, field, value) => {
    setRatingForms((prev) => ({
      ...prev,
      [bookingId]: {
        rating: prev[bookingId]?.rating ?? 5,
        sportsmanshipScore: prev[bookingId]?.sportsmanshipScore ?? 5,
        review: prev[bookingId]?.review ?? '',
        [field]: value
      }
    }));
  };

  const renderStars = (value, onSelect, labelId, readOnly = false) => {
    return (
      <div className="flex items-center gap-1" role="radiogroup" aria-labelledby={labelId}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= Number(value);
          return (
            <button
              key={star}
              type="button"
              onClick={() => onSelect?.(star)}
              role="radio"
              className={`flex h-8 w-8 items-center justify-center transition ${
                active ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
              }`}
              aria-checked={active}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              disabled={readOnly}
            >
              <StarIcon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    );
  };

  const handleSubmitRating = async (bookingId) => {
    const form = ratingForms[bookingId] || { rating: 5, sportsmanshipScore: 5, review: '' };
    try {
      setRatingSubmitting((prev) => ({ ...prev, [bookingId]: true }));
      setRatingErrors((prev) => ({ ...prev, [bookingId]: null }));

      const payload = {
        bookingId,
        rating: Number(form.rating),
        sportsmanshipScore: Number(form.sportsmanshipScore),
        review: form.review?.trim() || null
      };
      const response = await ratingService.createOpponentRating(payload);

      setRatingMetaByBooking((prev) => ({
        ...prev,
        [bookingId]: {
          ...(prev[bookingId] || {}),
          canRate: false,
          rating: {
            id: response?.data?.id || null,
            value: payload.rating,
            sportsmanshipScore: payload.sportsmanshipScore,
            review: payload.review,
            createdAt: new Date().toISOString()
          }
        }
      }));
      setActiveRatingBookingId(null);
    } catch (err) {
      setRatingErrors((prev) => ({ ...prev, [bookingId]: err?.error || 'Failed to submit rating' }));
    } finally {
      setRatingSubmitting((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const matches = Array.isArray(history.matches) ? history.matches : [];
  const activeMatch = matches.find((match) => match.bookingId === activeRatingBookingId);
  const currentYear = new Date().getFullYear();

  const filteredMatches = useMemo(() => {
    const now = new Date();
    if (filterKey === 'all') return matches;
    if (filterKey === 'current') {
      return matches.filter((match) => new Date(match.date).getFullYear() === currentYear);
    }
    if (filterKey === 'past') {
      return matches.filter((match) => new Date(match.date).getFullYear() === currentYear - 1);
    }
    if (filterKey === 'last30') {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      return matches.filter((match) => new Date(match.date) >= cutoff);
    }
    if (filterKey === 'custom') {
      if (!customStart || !customEnd) return matches;
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return matches.filter((match) => {
        const date = new Date(match.date);
        return date >= start && date <= end;
      });
    }
    return matches;
  }, [matches, filterKey, customStart, customEnd, currentYear]);

  const filterLabel = (() => {
    if (filterKey === 'current') return `Current Season (${currentYear})`;
    if (filterKey === 'past') return `Past Season (${currentYear - 1})`;
    if (filterKey === 'last30') return 'Past 30 Days';
    if (filterKey === 'custom' && customStart && customEnd) return 'Custom Date Range';
    return 'All Seasons';
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#0b8a4a] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Match History</h1>
              <p className="mt-2 text-emerald-100">Football performance</p>
            </div>
            <Link
              to={`${basePath}/teams/${id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Team
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {!error && (
          <>
            <div className="grid gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-4">
              {(() => {
                const total = filteredMatches.length || 0;
                const wins = filteredMatches.filter((match) => match.result === 'Win').length;
                const losses = filteredMatches.filter((match) => match.result === 'Loss').length;
                const draws = filteredMatches.filter((match) => match.result === 'Draw').length;

                const cards = [
                  {
                    label: 'Total Matches',
                    value: total,
                    accent: 'text-slate-900',
                    icon: CalendarIcon,
                    iconBg: 'bg-blue-100 text-blue-600'
                  },
                  {
                    label: 'Wins',
                    value: wins,
                    accent: 'text-emerald-600',
                    icon: TrophyIcon,
                    iconBg: 'bg-emerald-100 text-emerald-600'
                  },
                  {
                    label: 'Losses',
                    value: losses,
                    accent: 'text-rose-600',
                    icon: FlagIcon,
                    iconBg: 'bg-rose-100 text-rose-600'
                  },
                  {
                    label: 'Draws',
                    value: draws,
                    accent: 'text-amber-600',
                    icon: UserGroupIcon,
                    iconBg: 'bg-amber-100 text-amber-600'
                  }
                ];

                return cards.map((card) => (
                  <div key={card.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg}`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{card.label}</p>
                      <p className={`mt-1 text-2xl font-bold ${card.accent}`}>{card.value}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Recent Matches</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {history.teamName || 'Team'} match results and ratings
                  </p>
                </div>
                <div className="relative flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter by:</span>
                  <button
                    type="button"
                    onClick={() => setFilterOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:border-emerald-400"
                  >
                    {filterLabel}
                    <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                  </button>

                  {filterOpen && (
                    <div className="absolute right-0 top-12 z-20 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Filter By Timeframe
                      </p>
                      {[
                        { key: 'all', label: 'All Seasons' },
                        { key: 'current', label: `Current Season (${currentYear})` },
                        { key: 'past', label: `Past Season (${currentYear - 1})` },
                        { key: 'last30', label: 'Past 30 Days' }
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            setFilterKey(option.key);
                            setFilterOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                            filterKey === option.key ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {option.label}
                          {filterKey === option.key && <span className="text-emerald-600">✓</span>}
                        </button>
                      ))}

                      <div className="mt-2 border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() => setFilterKey('custom')}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                            filterKey === 'custom' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Custom Date Range
                          {filterKey === 'custom' && <span className="text-emerald-600">✓</span>}
                        </button>
                        {filterKey === 'custom' && (
                          <div className="mt-2 space-y-2 px-3 pb-2">
                            <input
                              type="date"
                              value={customStart}
                              onChange={(e) => setCustomStart(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            />
                            <input
                              type="date"
                              value={customEnd}
                              onChange={(e) => setCustomEnd(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setFilterOpen(false)}
                              className="w-full rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white"
                            >
                              Apply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            {filteredMatches.length > 0 ? (
              <>
                <div className="hidden w-full md:block">
                  <div className="grid grid-cols-[160px_1.2fr_1fr_160px_160px] gap-4 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <div>Date</div>
                    <div>Opponent</div>
                    <div>Result / Score</div>
                    <div>Status</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredMatches.map((match) => {
                      const ratingMeta = ratingMetaByBooking[match.bookingId];
                      const existingRating = ratingMeta?.rating || null;
                      const canRate = Boolean(ratingMeta?.canRate ?? (isCaptainOrAdmin && !existingRating));
                      const buttonLabel = existingRating ? 'View Rating' : canRate ? 'Rate Opponent' : 'View Rating';
                      const buttonTone = existingRating ? 'border-slate-200 text-slate-600' : 'border-emerald-200 text-emerald-700';
                      const initials = getInitials(match.opponentTeamName);
                      const statusLabel = match.status || 'Completed';

                      return (
                        <div key={match.id} className="grid grid-cols-[160px_1.2fr_1fr_160px_160px] gap-4 px-6 py-4 text-sm">
                          <div className="text-slate-600">{formatDate(match.date)}</div>
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                              {initials}
                            </span>
                            <div className="font-semibold text-slate-900">{match.opponentTeamName}</div>
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${resultClasses(
                                match.result
                              )}`}
                            >
                              {getResultLabel(match)}
                            </span>
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (!existingRating && !canRate) return;
                                setActiveRatingBookingId(match.bookingId);
                                setActiveRatingMode(existingRating ? 'view' : 'rate');
                              }}
                              className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm hover:border-slate-300 ${buttonTone}`}
                              disabled={!existingRating && !canRate}
                            >
                              {buttonLabel}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {filteredMatches.map((match) => {
                    const ratingMeta = ratingMetaByBooking[match.bookingId];
                    const existingRating = ratingMeta?.rating || null;
                    const canRate = Boolean(ratingMeta?.canRate ?? (isCaptainOrAdmin && !existingRating));
                    const buttonLabel = existingRating ? 'View Rating' : canRate ? 'Rate Opponent' : 'View Rating';
                    const buttonTone = existingRating ? 'border-slate-200 text-slate-600' : 'border-emerald-200 text-emerald-700';
                    const initials = getInitials(match.opponentTeamName);
                    const statusLabel = match.status || 'Completed';

                    return (
                      <div key={match.id} className="space-y-3 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-900">{formatDate(match.date)}</div>
                          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                            {initials}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{match.opponentTeamName}</div>
                            <span
                              className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${resultClasses(
                                match.result
                              )}`}
                            >
                              {getResultLabel(match)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!existingRating && !canRate) return;
                            setActiveRatingBookingId(match.bookingId);
                            setActiveRatingMode(existingRating ? 'view' : 'rate');
                          }}
                          className={`inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm hover:border-slate-300 ${buttonTone}`}
                          disabled={!existingRating && !canRate}
                        >
                          {buttonLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={CalendarIcon}
                  title="No completed matches yet"
                  description="Match history will appear after completed matches are recorded."
                />
              </div>
            )}
            </div>
          </>
        )}
      </div>

      {activeMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {activeRatingMode === 'view' ? 'Opponent Rating' : 'Rate Opponent'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">Match Date: {formatDate(activeMatch.date)}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRatingBookingId(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-600">
                    {getInitials(activeMatch.opponentTeamName)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{activeMatch.opponentTeamName}</p>
                    <p className="text-xs text-slate-500">Final Score</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${resultClasses(
                    activeMatch.result
                  )}`}
                >
                  {getResultLabel(activeMatch)}
                </span>
              </div>

              {(() => {
                const ratingMeta = ratingMetaByBooking[activeMatch.bookingId];
                const existingRating = ratingMeta?.rating || null;
                const canRate = Boolean(ratingMeta?.canRate ?? (isCaptainOrAdmin && !existingRating));
                const ratingForm = ratingForms[activeMatch.bookingId] || { rating: 5, sportsmanshipScore: 5, review: '' };
                const ratingError = ratingErrors[activeMatch.bookingId];
                const submitting = ratingSubmitting[activeMatch.bookingId];

                if (activeRatingMode === 'view' && existingRating) {
                  return (
                    <div className="mt-5 space-y-4">
                      <div>
                        <p id={`view-rating-${activeMatch.bookingId}`} className="text-sm font-medium text-slate-700">
                          Reliability
                        </p>
                        <div className="mt-2">
                          {renderStars(existingRating.value, null, `view-rating-${activeMatch.bookingId}`, true)}
                        </div>
                      </div>
                      <div>
                        <p id={`view-sports-${activeMatch.bookingId}`} className="text-sm font-medium text-slate-700">
                          Sportsmanship
                        </p>
                        <div className="mt-2">
                          {renderStars(existingRating.sportsmanshipScore || 0, null, `view-sports-${activeMatch.bookingId}`, true)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Feedback / Comments</p>
                        <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {existingRating.review || 'No written feedback.'}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (!canRate) {
                  return (
                    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Ratings are only available to captains and admins.
                    </div>
                  );
                }

                return (
                  <div className="mt-5 space-y-4">
                    <div>
                      <p id={`rating-${activeMatch.bookingId}`} className="text-sm font-medium text-slate-700">
                        Reliability
                      </p>
                      <div className="mt-2">
                        {renderStars(
                          ratingForm.rating,
                          (value) => handleRatingFieldChange(activeMatch.bookingId, 'rating', value),
                          `rating-${activeMatch.bookingId}`
                        )}
                      </div>
                    </div>
                    <div>
                      <p id={`sports-${activeMatch.bookingId}`} className="text-sm font-medium text-slate-700">
                        Sportsmanship
                      </p>
                      <div className="mt-2">
                        {renderStars(
                          ratingForm.sportsmanshipScore,
                          (value) => handleRatingFieldChange(activeMatch.bookingId, 'sportsmanshipScore', value),
                          `sports-${activeMatch.bookingId}`
                        )}
                      </div>
                    </div>
                    <label className="block text-sm text-slate-700">
                      Feedback / Comments
                      <textarea
                        value={ratingForm.review}
                        onChange={(e) => handleRatingFieldChange(activeMatch.bookingId, 'review', e.target.value)}
                        rows={4}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Describe your experience with the team..."
                      />
                    </label>
                    {ratingError && <p className="text-sm text-red-600">{ratingError}</p>}
                    {submitting && <p className="text-xs text-slate-500">Submitting rating...</p>}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setActiveRatingBookingId(null)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              {activeRatingMode === 'rate' && (
                <button
                  type="button"
                  onClick={() => handleSubmitRating(activeMatch.bookingId)}
                  disabled={ratingSubmitting[activeMatch.bookingId]}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {ratingSubmitting[activeMatch.bookingId] ? 'Submitting...' : 'Submit Rating'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMatchHistoryPage;
