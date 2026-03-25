import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/outline';
import ratingService from '../services/ratingService';
import { useAuth } from '../context/AuthContext';
import { Badge, Card, CardBody, EmptyState, Spinner } from '../components/ui';

const formatMatchDate = (value) => {
  if (!value) return 'Date unavailable';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';

  return parsed.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getScoreLabel = (match) => {
  if (!match?.result) return 'Score not recorded';
  const { homeScore, awayScore } = match.result;
  if (homeScore === null || awayScore === null || homeScore === undefined || awayScore === undefined) {
    return 'Score not recorded';
  }
  return `${homeScore} - ${awayScore}`;
};

const MatchHistoryIndexPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canViewMatchHistory = useMemo(() => ['captain', 'admin'].includes(user?.role || ''), [user?.role]);

  const loadMatches = useCallback(async () => {
    if (!canViewMatchHistory) {
      setMatches([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ratingService.getMatchHistoryForRating();
      setMatches(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load match history:', err);
      setError(err?.error || 'Failed to load match history');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [canViewMatchHistory]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!canViewMatchHistory) {
    return (
      <EmptyState
        icon={TrophyIcon}
        title="Match history is for captains"
        description="This page shows completed matches that can still be rated by a team captain or reviewed by an admin."
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Match History</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review completed matches and see whether an opponent rating has already been submitted.
          </p>
        </div>
        <Badge tone="gray">{matches.length} matches</Badge>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-200">
          {matches.length > 0 ? (
            matches.map((match) => (
              <CardBody key={`${match.bookingId}-${match.team?.id || 'team'}`} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {match.team?.name || 'Your Team'} vs {match.opponentTeam?.name || 'Opponent'}
                      </h2>
                      <Badge tone={match.rating ? 'green' : match.canRate ? 'blue' : 'gray'}>
                        {match.rating ? 'Rated' : match.canRate ? 'Ready to rate' : 'View only'}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        <span>{formatMatchDate(match.matchDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrophyIcon className="h-4 w-4" />
                        <span>{getScoreLabel(match)}</span>
                      </div>
                    </div>

                    {match.rating ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        <div className="flex items-center gap-2 font-medium">
                          <StarIcon className="h-4 w-4" />
                          <span>{match.rating.value}/5 opponent rating submitted</span>
                        </div>
                        <p className="mt-1 text-emerald-800">
                          {match.rating.review?.trim() || 'No written review was added for this match.'}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        {match.canRate
                          ? 'This match is ready for rating. Open your team details page to submit an opponent review.'
                          : 'This match does not currently require any action from you.'}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {match.team?.id && (
                      <Link
                        to={`/app/teams/${match.team.id}`}
                        className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        View team
                      </Link>
                    )}
                  </div>
                </div>
              </CardBody>
            ))
          ) : (
            <div className="p-6">
              <EmptyState
                icon={TrophyIcon}
                title="No completed matches yet"
                description="Once your team finishes matches with an opponent, they will appear here for quick rating follow-up."
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MatchHistoryIndexPage;
