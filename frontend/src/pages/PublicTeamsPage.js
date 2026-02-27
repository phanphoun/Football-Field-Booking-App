import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Badge, Button, EmptyState, Spinner } from '../components/ui';

const PublicTeamsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const canRequestJoin =
    isAuthenticated && ['player', 'captain', 'admin'].includes(user?.role || '');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamService.getPublicTeams();
        const teamsData = Array.isArray(response.data) ? response.data : [];
        setTeams(teamsData);
      } catch (err) {
        console.error('Failed to fetch public teams:', err);
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleRequestJoin = async (teamId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/teams/${teamId}` } });
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      const response = await teamService.joinTeam(teamId);
      if (response.success) {
        setSuccessMessage('Join request submitted!');
      }
    } catch (err) {
      setError(err?.error || 'Failed to submit join request');
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
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-600">Discover football teams and request to join.</p>
        </div>
        <Badge tone="gray">{teams.length} results</Badge>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => (
            <div key={team.id} className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{team.description}</p>
                </div>
                <Badge tone="gray">{team.memberCount || 0} members</Badge>
              </div>

              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <div>Captain: {team.captain?.firstName || team.captain?.username || 'Unknown'}</div>
                {team.homeField?.name && <div>Home Field: {team.homeField.name}</div>}
                {team.skillLevel && (
                  <div className="flex items-center gap-2">
                    <span>Skill:</span>
                    <Badge tone="green" className="capitalize">
                      {team.skillLevel}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  as={Link}
                  to={`/teams/${team.id}`}
                  variant="outline"
                  className="flex-1"
                >
                  View Details
                </Button>

                {canRequestJoin ? (
                  <Button
                    onClick={() => handleRequestJoin(team.id)}
                    className="flex-1"
                  >
                    Request Join
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/login', { state: { from: `/teams/${team.id}` } })}
                    className="flex-1"
                  >
                    Login to Join
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState icon={UsersIcon} title="No teams found" description="Check back later, or register as a captain to create a team." />
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicTeamsPage;
