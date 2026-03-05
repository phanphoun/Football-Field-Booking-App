import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ratingService from '../services/ratingService';
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from '../components/ui';
import { StarIcon, TrophyIcon } from '@heroicons/react/24/outline';

const MatchHistoryPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeRateBookingId, setActiveRateBookingId] = useState(null);
  const [formData, setFormData] = useState({ rating: '5', sportsmanshipScore: '', review: '' });

  const loadHistory = async () => {
    const res = await ratingService.getMatchHistoryForRating();
    setMatches(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadHistory();
      } catch (err) {
        setError(err?.error || 'Failed to load match history');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openRateForm = (bookingId) => {
    setActiveRateBookingId(bookingId);
    setFormData({ rating: '5', sportsmanshipScore: '', review: '' });
  };

  const closeRateForm = () => {
    setActiveRateBookingId(null);
    setFormData({ rating: '5', sportsmanshipScore: '', review: '' });
  };

  const handleSubmitRating = async (bookingId) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      await ratingService.rateOpponent({
        bookingId,
        rating: Number(formData.rating),
        sportsmanshipScore: formData.sportsmanshipScore ? Number(formData.sportsmanshipScore) : null,
        review: formData.review
      });

      setSuccessMessage('Opponent rating submitted successfully.');
      closeRateForm();
      await loadHistory();
    } catch (err) {
      setError(err?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (user?.role !== 'captain' && user?.role !== 'admin') {
    return (
      <div className="p-6">
        <EmptyState icon={TrophyIcon} title="Access restricted" description="Only captains can rate opponents." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Match History</h1>
        <p className="mt-1 text-sm text-gray-600">Completed matches and opponent feedback.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">{successMessage}</div>
      )}

      <Card>
        <CardBody className="p-0">
          {matches.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {matches.map((match) => (
                <div key={match.bookingId} className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {match.team?.name || 'Team'} vs {match.opponentTeam?.name || 'Opponent'}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {match.result
                          ? `${match.result.homeScore} - ${match.result.awayScore}`
                          : 'Result unavailable'}{' '}
                        | {new Date(match.matchDate).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="blue">Completed</Badge>
                      {match.canRate ? (
                        <Button size="sm" onClick={() => openRateForm(match.bookingId)}>
                          Rate Opponent
                        </Button>
                      ) : match.rating ? (
                        <Badge tone="green">Rated ({match.rating.value}/5)</Badge>
                      ) : (
                        <Badge tone="gray">No action</Badge>
                      )}
                    </div>
                  </div>

                  {activeRateBookingId === match.bookingId && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">Star Rating (1-5)</label>
                          <select
                            value={formData.rating}
                            onChange={(e) => setFormData((prev) => ({ ...prev, rating: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={String(n)}>
                                {n} Star{n > 1 ? 's' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">Sportsmanship (optional)</label>
                          <select
                            value={formData.sportsmanshipScore}
                            onChange={(e) => setFormData((prev) => ({ ...prev, sportsmanshipScore: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          >
                            <option value="">Not set</option>
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={String(n)}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-medium text-gray-700">Comment (optional)</label>
                        <textarea
                          rows={3}
                          value={formData.review}
                          onChange={(e) => setFormData((prev) => ({ ...prev, review: e.target.value }))}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          placeholder="Very fair and friendly team."
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" disabled={submitting} onClick={() => handleSubmitRating(match.bookingId)}>
                          <StarIcon className="h-4 w-4" />
                          Submit Rating
                        </Button>
                        <Button size="sm" variant="outline" disabled={submitting} onClick={closeRateForm}>
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={TrophyIcon}
                title="No completed matches"
                description="Completed matches will appear here and can be rated by captains."
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default MatchHistoryPage;
