import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Calendar, Plus, Settings, Star, TrendingUp, Shield, Target, Edit, MessageSquare } from 'lucide-react';
import { teamsService, bookingsService } from '../services/api';

const CaptainDashboard = ({ user }) => {
  const [stats, setStats] = useState({});
  const [myTeams, setMyTeams] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaptainData = async () => {
      try {
        // Fetch captain stats
        setStats({
          teamsManaged: 2,
          totalPlayers: 18,
          upcomingMatches: 3,
          winRate: 72,
          teamRating: 4.5
        });

        // Fetch user's teams where they are captain
        const teamsResponse = await teamsService.getMyTeams(user.id);
        const captainTeams = teamsResponse.data?.filter(team => team.captain_id === user.id) || [];
        setMyTeams(captainTeams);

        // Fetch upcoming matches
        setUpcomingMatches([
          {
            id: 1,
            opponent: 'Thunder FC',
            date: '2026-02-25',
            time: '18:00',
            field: 'Olympic Stadium',
            status: 'upcoming'
          },
          {
            id: 2,
            opponent: 'Eagles FC',
            date: '2026-02-28',
            time: '16:00',
            field: 'Riverside Arena',
            status: 'upcoming'
          }
        ]);

        // Fetch team join requests
        setTeamRequests([
          {
            id: 1,
            playerName: 'John Doe',
            playerRating: 4.2,
            requestDate: '2026-02-20',
            status: 'pending'
          },
          {
            id: 2,
            playerName: 'Jane Smith',
            playerRating: 3.8,
            requestDate: '2026-02-19',
            status: 'pending'
          }
        ]);
      } catch (error) {
        console.error('Error fetching captain data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCaptainData();
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Team Captain Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your teams and lead them to victory
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full">
                <Shield className="text-primary-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.teamsManaged || 0}</p>
                <p className="text-gray-600">Teams Managed</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-full">
                <Users className="text-success-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalPlayers || 0}</p>
                <p className="text-gray-600">Total Players</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-full">
                <Calendar className="text-warning-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingMatches || 0}</p>
                <p className="text-gray-600">Upcoming Matches</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-info-100 rounded-full">
                <TrendingUp className="text-info-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.winRate || 0}%</p>
                <p className="text-gray-600">Win Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Teams */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Teams</h3>
                <Link
                  to="/teams/new"
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Create Team
                </Link>
              </div>
              <div className="p-6">
                {myTeams.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No teams created yet</p>
                    <Link
                      to="/teams/new"
                      className="btn btn-primary mt-4"
                    >
                      Create Your First Team
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTeams.map((team) => (
                      <div key={team.id} className="card hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{team.name}</h4>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Users size={14} className="mr-1" />
                                <span>{team.members_count} players</span>
                                <Star className="ml-2 text-yellow-400" size={14} />
                                <span className="ml-1">{team.average_rating}</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                to={`/teams/${team.id}/edit`}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <Edit size={16} />
                              </Link>
                              <Link
                                to={`/teams/${team.id}`}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <Target size={16} />
                              </Link>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              Created: {new Date(team.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  // Handle team settings
                                }}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <Settings size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Requests */}
          <div>
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Join Requests</h3>
                <span className="bg-warning-100 text-warning-800 px-2 py-1 text-xs font-semibold rounded-full">
                  {teamRequests.length} Pending
                </span>
              </div>
              <div className="p-6">
                {teamRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                            <Users className="text-white" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.playerName}</p>
                            <div className="flex items-center text-sm text-gray-600">
                              <Star className="text-yellow-400 mr-1" size={14} />
                              <span>{request.playerRating}</span>
                              <span className="ml-2">• Requested {new Date(request.requestDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              // Accept request
                            }}
                            className="btn btn-success btn-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              // Reject request
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="mt-8">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Matches</h3>
              <Link to="/matches" className="text-primary-600 hover:text-primary-700 text-sm">
                View All
              </Link>
            </div>
            <div className="p-6">
              {upcomingMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No upcoming matches</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium text-gray-900">vs {match.opponent}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(match.date).toLocaleDateString()} • {match.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          match.status === 'upcoming' ? 'bg-warning-100 text-warning-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainDashboard;
