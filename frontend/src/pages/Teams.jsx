import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Star, MapPin, Shield } from 'lucide-react';
import { teamsService } from '../services/api';

const Teams = ({ user }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await teamsService.getAll();
        setTeams(response.data || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="mt-2 text-gray-600">Discover and join football teams</p>
        </div>

        <div className="mb-8">
          {user?.role === 'team_captain' && (
            <Link to="/teams/new" className="btn btn-primary">
              <Plus size={16} className="mr-2" />
              Create New Team
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teams.map((team) => (
            <div key={team.id} className="card hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <Shield className="text-primary-600" size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Users size={14} className="mr-1" />
                      <span>{team.members_count} players</span>
                      <Star className="ml-2 text-yellow-400" size={14} />
                      <span className="ml-1">{team.average_rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <div className="flex items-center mb-2">
                    <MapPin size={14} className="mr-1" />
                    <span>Based in {team.city || 'Phnom Penh'}</span>
                  </div>
                  <p>Captain: {team.captain_name}</p>
                  <p>Created: {new Date(team.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-between items-center">
                  <Link
                    to={`/teams/${team.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    View Team
                  </Link>
                  {user?.role !== 'team_captain' && (
                    <button
                      onClick={() => {
                        // Handle join team
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Join Team
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;
