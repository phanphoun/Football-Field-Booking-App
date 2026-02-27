import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, TrophyIcon as AwardIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import teamService from '../services/teamService';

const TeamsPage = () => {
  const { user, isCaptain, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await teamService.getAllTeams();
        // Ensure we always set an array, even if response.data is not an array
        const teamsData = Array.isArray(response.data) ? response.data : [];
        setTeams(teamsData);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setError('Failed to load teams');
        
        // Fallback to mock data if API fails
        const mockTeams = [
          {
            id: 1,
            name: 'Test Team',
            captain_id: 1,
            captain: {
              username: 'admin',
              firstName: 'Admin',
              lastName: 'User'
            },
            home_field_id: 1,
            homeField: {
              name: 'Downtown Arena',
              address: '123 Main St'
            },
            skillLevel: 'intermediate',
            preferredTime: 'evening',
            description: 'A test team for demonstration',
            maxPlayers: 15,
            TeamMembers: [
              {
                id: 1,
                userId: 1,
                role: 'captain',
                status: 'active',
                User: {
                  username: 'admin',
                  firstName: 'Admin',
                  lastName: 'User'
                }
              }
            ],
            createdAt: new Date().toISOString()
          }
        ];
        setTeams(mockTeams);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleCreateTeam = () => {
    navigate('/teams/create');
  };

  const handleJoinTeam = async (teamId) => {
    try {
      await teamService.joinTeam(teamId);
      // Refresh teams list
      const response = await teamService.getAllTeams();
      const teamsData = Array.isArray(response.data) ? response.data : [];
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to join team:', err);
      setError('Failed to join team');
    }
  };

  const handleViewTeam = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getPreferredTimeColor = (time) => {
    const colors = {
      morning: 'bg-blue-100 text-blue-800',
      evening: 'bg-purple-100 text-purple-800',
      flexible: 'bg-green-100 text-green-800'
    };
    return colors[time] || 'bg-gray-100 text-gray-800';
  };

  const calculateWinRate = (wins, losses, draws) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  const getMemberCount = (team) => {
    return team.TeamMembers?.filter(member => member.status === 'active').length || 0;
  };

  const isUserInTeam = (team) => {
    return team.TeamMembers?.some(member => 
      member.userId === user?.id && member.status === 'active'
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-600">
            Discover and join football teams in your area
          </p>
        </div>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPreferredTimeColor(team.preferredTime)}`}>
                      {team.preferredTime}
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
                  <div className="flex items-center text-sm text-gray-600">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    {getMemberCount(team)}/{team.maxPlayers} members
                  </div>
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Match Statistics (mock data for now) */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <AwardIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="font-medium text-gray-900">Win Rate</span>
                    </div>
                    <span className="text-green-600 font-medium">
                      {calculateWinRate(team.wins || 0, team.losses || 0, team.draws || 0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{team.wins || 0}W</span>
                    <span>{team.draws || 0}D</span>
                    <span>{team.losses || 0}L</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewTeam(team.id)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  {!isUserInTeam(team) && user && (
                    <button
                      onClick={() => handleJoinTeam(team.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Join Team
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new team or check back later.
            </p>
            {(isCaptain() || isAdmin()) && (
              <div className="mt-6">
                <button
                  onClick={handleCreateTeam}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Team
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
