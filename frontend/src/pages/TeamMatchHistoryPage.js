import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline';
import teamService from '../services/teamService';
import { Badge, Card, CardBody, EmptyState, Spinner } from '../components/ui';

const TeamMatchHistoryPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({ teamName: '', stats: { total: 0, wins: 0, losses: 0, draws: 0 }, matches: [] });

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

    loadHistory();
  }, [id]);

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
                history.matches.map((match) => (
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
                  </div>
                ))
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
