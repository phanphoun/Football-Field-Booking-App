import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import teamService from '../services/teamService';

const TeamsPage = () => {
  const { isCaptain, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await teamService.getMyTeams();
        setTeams(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setError(err?.error || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleCreateTeam = () => {
    navigate('/app/teams/create');
  };

  const handleViewTeam = (teamId) => {
    navigate(`/app/teams/${teamId}`);
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
      professional: 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>
          <p className="mt-1 text-sm text-gray-600">
            View your active teams and manage membership requests if you are a captain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/teams')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Browse Teams
          </button>
          {(isCaptain() || isAdmin()) && (
            <button
              onClick={handleCreateTeam}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Team
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => (
            <div key={team.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(team.skillLevel)}`}>
                      {team.skillLevel}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    Captain: {team.captain?.firstName || team.captain?.username || 'Unknown'}
                  </div>
                  {team.homeField && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {team.homeField.name}
                    </div>
                  )}
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewTeam(team.id)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Browse teams to request to join, or create your own team if you are a captain.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => navigate('/teams')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Browse Teams
              </button>
              {(isCaptain() || isAdmin()) && (
                <button
                  onClick={handleCreateTeam}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Team
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
