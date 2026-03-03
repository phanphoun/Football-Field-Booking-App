import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../services/teamService';
import { UsersIcon, MapPinIcon } from '@heroicons/react/24/outline';

const PublicTeamDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const canRequestJoin =
    isAuthenticated && ['player', 'captain', 'admin'].includes(user?.role || '');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamService.getPublicTeamById(id);
        setTeam(response.data || null);
      } catch (err) {
        console.error('Failed to fetch team:', err);
        setError('Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id]);

  const handleRequestJoin = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/teams/${id}` } });
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      const response = await teamService.joinTeam(id);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900">Team not found</h1>
        <Link to="/teams" className="mt-4 inline-block text-green-700 hover:text-green-800">
          Back to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Captain: {team.captain?.firstName || team.captain?.username || 'Unknown'}
            </p>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <UsersIcon className="h-5 w-5 mr-1 text-gray-400" />
            {team.memberCount || 0} members
          </div>
        </div>

        {team.description && <p className="mt-4 text-gray-700">{team.description}</p>}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          {team.homeField && (
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Home Field</div>
                <div>{team.homeField.name}</div>
                <div className="text-xs text-gray-500">
                  {team.homeField.address}, {team.homeField.city}
                </div>
              </div>
            </div>
          )}

          {team.skillLevel && (
            <div>
              <div className="font-medium text-gray-900">Skill Level</div>
              <div className="capitalize">{team.skillLevel}</div>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/teams"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back to Teams
          </Link>

          {canRequestJoin ? (
            <button
              onClick={handleRequestJoin}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Request to Join
            </button>
          ) : (
            <button
              onClick={() => navigate('/login', { state: { from: `/teams/${id}` } })}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Login to Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicTeamDetailsPage;

