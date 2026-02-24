import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Star, Calendar, Shield, User, Plus } from 'lucide-react';
import { teamsService } from '../services/api';

const TeamDetails = ({ user }) => {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const response = await teamsService.getById(id);
        setTeam(response.data);
      } catch (error) {
        console.error('Error fetching team details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Team not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/teams"
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            Back to Teams
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Info */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <Shield className="text-primary-600" size={40} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <Users size={16} className="mr-1" />
                    <span>{team.members_count} players</span>
                    <Star className="ml-2 text-yellow-400" size={14} />
                    <span className="ml-1">{team.average_rating}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <User size={16} className="mr-2" />
                  <span>Captain: {team.captain_name}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  <span>Created: {new Date(team.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span>Based in: {team.city || 'Phnom Penh'}</span>
                </div>
                <p className="text-gray-600">{team.description || 'No description available'}</p>
              </div>

              {/* Players List */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Players</h3>
                <div className="space-y-3">
                  {team.players?.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                          <User className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{player.name}</p>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">Position: {player.position}</span>
                            <span className="mr-2">Rating: {player.rating}</span>
                            <span>Joined: {new Date(player.joined_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <button className="text-gray-600 hover:text-gray-800">
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Actions</h3>
              <div className="space-y-4">
                {user?.id === team.captain_id ? (
                  <div className="space-y-3">
                    <button className="btn btn-secondary w-full">
                      Edit Team Details
                    </button>
                    <button className="btn btn-secondary w-full">
                      Manage Players
                    </button>
                    <button className="btn btn-secondary w-full">
                      Schedule Match
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Plus className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">Join this team to participate</p>
                    <button className="btn btn-primary">
                      Request to Join Team
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetails;
