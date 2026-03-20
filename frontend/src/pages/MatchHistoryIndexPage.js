import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import teamService from '../services/teamService';
import { Card, CardBody, EmptyState, Spinner } from '../components/ui';

const MatchHistoryIndexPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamService.getCaptainedTeams();
        const list = Array.isArray(response?.data) ? response.data : [];
        setTeams(list);
        if (list.length === 1 && list[0]?.id) {
          navigate(`/app/teams/${list[0].id}/matches`, { replace: true });
        }
      } catch (err) {
        setError(err?.error || 'Failed to load match history');
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Match History</h1>
        <p className="mt-1 text-sm text-gray-600">Choose a team to view completed matches and ratings.</p>
      </div>

      {teams.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id} className="border border-slate-200">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Team</p>
                  <p className="text-lg font-semibold text-slate-900">{team.name}</p>
                </div>
                <Link
                  to={`/app/teams/${team.id}/matches`}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  View Matches
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No teams found"
          description="Create a team first to view match history."
        />
      )}
    </div>
  );
};

export default MatchHistoryIndexPage;
