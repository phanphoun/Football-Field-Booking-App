import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline';
import teamService from '../services/teamService';
import ratingService from '../services/ratingService';
import { Badge, Card, CardBody, EmptyState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const TeamMatchHistoryPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({ teamName: '', stats: { total: 0, wins: 0, losses: 0, draws: 0 }, matches: [] });
  const [ratingMetaByBooking, setRatingMetaByBooking] = useState({});
  const [ratingForms, setRatingForms] = useState({});
  const [ratingSubmitting, setRatingSubmitting] = useState({});
  const [ratingErrors, setRatingErrors] = useState({});
  const [ratingOpenByBooking, setRatingOpenByBooking] = useState({});

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

  const resultTone = (result) => {
    if (result === 'Win') return 'green';
    if (result === 'Loss') return 'red';
    return 'yellow';
  };

  const resultClasses = (result) => {
    if (result === 'Win') return 'bg-emerald-50 border-emerald-200';
    if (result === 'Loss') return 'bg-rose-50 border-rose-200';
    return 'bg-amber-50 border-amber-200';
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
      setRatingOpenByBooking((prev) => ({ ...prev, [bookingId]: false }));
    } catch (err) {
      setRatingErrors((prev) => ({ ...prev, [bookingId]: err?.error || 'Failed to submit rating' }));
    } finally {
      setRatingSubmitting((prev) => ({ ...prev, [bookingId]: false }));
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
      <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 via-cyan-50 to-white border border-emerald-100 rounded-xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Match History</h1>
          <p className="mt-1 text-sm text-gray-700">{history.teamName || 'Team'} performance overview</p>
        </div>
        <Link
          to={`/app/teams/${id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Team
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}

      {!error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-slate-200 bg-slate-50">
              <CardBody className="p-4">
                <p className="text-xs text-slate-600">Total</p>
                <p className="text-2xl font-semibold text-slate-900">{history.stats?.total || 0}</p>
              </CardBody>
            </Card>
            <Card className="border border-emerald-200 bg-emerald-50">
              <CardBody className="p-4">
                <p className="text-xs text-emerald-700">Wins</p>
                <p className="text-2xl font-semibold text-emerald-800">{history.stats?.wins || 0}</p>
              </CardBody>
            </Card>
            <Card className="border border-rose-200 bg-rose-50">
              <CardBody className="p-4">
                <p className="text-xs text-rose-700">Losses</p>
                <p className="text-2xl font-semibold text-rose-800">{history.stats?.losses || 0}</p>
              </CardBody>
            </Card>
            <Card className="border border-amber-200 bg-amber-50">
              <CardBody className="p-4">
                <p className="text-xs text-amber-700">Draws</p>
                <p className="text-2xl font-semibold text-amber-800">{history.stats?.draws || 0}</p>
              </CardBody>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-200">
              {Array.isArray(history.matches) && history.matches.length > 0 ? (
                history.matches.map((match) => {
                  const ratingMeta = ratingMetaByBooking[match.bookingId];
                  const ratingForm = ratingForms[match.bookingId] || { rating: 5, sportsmanshipScore: 5, review: '' };
                  const canRate = Boolean(ratingMeta?.canRate);
                  const existingRating = ratingMeta?.rating || null;
                  const ratingError = ratingErrors[match.bookingId];
                  const submitting = ratingSubmitting[match.bookingId];
                  const isRatingOpen = Boolean(ratingOpenByBooking[match.bookingId]);

                  return (
                    <div key={match.id} className={`p-5 border-l-4 ${resultClasses(match.result)}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                        <p className="text-sm text-gray-600">Opponent</p>
                        <p className="text-lg font-semibold text-gray-900">{match.opponentTeamName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Final Score</p>
                        <p className="text-lg font-semibold text-gray-900">{match.finalScore}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {new Date(match.date).toLocaleString()}
                      </span>
                      {match.fieldName && <span>Field: {match.fieldName}</span>}
                      <Badge tone={resultTone(match.result)}>{match.result}</Badge>
                    </div>

                    {(canRate || existingRating) && (
                      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">Rate Opponent</p>
                          {canRate && !existingRating && (
                            <button
                              type="button"
                              onClick={() =>
                                setRatingOpenByBooking((prev) => ({
                                  ...prev,
                                  [match.bookingId]: !prev[match.bookingId]
                                }))
                              }
                              className="inline-flex items-center justify-center rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                            >
                              {isRatingOpen ? 'Close Rating' : 'Rate Opponent'}
                            </button>
                          )}
                        </div>
                        {existingRating ? (
                          <div className="mt-2 text-sm text-slate-700">
                            <p>Overall rating: {existingRating.value}/5</p>
                            {existingRating.sportsmanshipScore && (
                              <p>Sportsmanship: {existingRating.sportsmanshipScore}/5</p>
                            )}
                            {existingRating.review && (
                              <p className="mt-2 text-slate-600">"{existingRating.review}"</p>
                            )}
                          </div>
                        ) : (
                          <>
                            {isRatingOpen && (
                              <>
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <label className="text-sm text-slate-700">
                                    Reliability
                                    <select
                                      value={ratingForm.rating}
                                      onChange={(e) => handleRatingFieldChange(match.bookingId, 'rating', e.target.value)}
                                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    >
                                      {[5, 4, 3, 2, 1].map((value) => (
                                        <option key={value} value={value}>
                                          {value}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="text-sm text-slate-700">
                                    Sportsmanship
                                    <select
                                      value={ratingForm.sportsmanshipScore}
                                      onChange={(e) => handleRatingFieldChange(match.bookingId, 'sportsmanshipScore', e.target.value)}
                                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    >
                                      {[5, 4, 3, 2, 1].map((value) => (
                                        <option key={value} value={value}>
                                          {value}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                                <label className="mt-3 block text-sm text-slate-700">
                                  Feedback
                                  <textarea
                                    value={ratingForm.review}
                                    onChange={(e) => handleRatingFieldChange(match.bookingId, 'review', e.target.value)}
                                    rows={3}
                                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                  />
                                </label>
                                {ratingError && (
                                  <p className="mt-2 text-sm text-red-600">{ratingError}</p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleSubmitRating(match.bookingId)}
                                  disabled={submitting}
                                  className="mt-3 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {submitting ? 'Submitting...' : 'Submit Rating'}
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })
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
          </Card>
        </>
      )}
    </div>
  );
};

export default TeamMatchHistoryPage;
