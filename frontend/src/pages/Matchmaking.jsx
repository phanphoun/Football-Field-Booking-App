import { useState, useEffect } from 'react';
import { Users, Trophy, Clock, MapPin, Filter, Sword, XCircle } from 'lucide-react';
import { matchmakingService } from '../services/api';

const Matchmaking = ({ user }) => {
  const [availableMatches, setAvailableMatches] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skill_level: 'all',
    location: 'all',
    time_preference: 'all'
  });

  useEffect(() => {
    const fetchMatchmakingData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both available matches and user's requests
        const [matchesResponse, requestsResponse] = await Promise.all([
          matchmakingService.getAvailableMatches(filters),
          matchmakingService.getMyRequests(user.id)
        ]);
        
        setAvailableMatches(matchesResponse.data || []);
        setMyRequests(requestsResponse.data || []);
      } catch (error) {
        console.error('Error fetching matchmaking data:', error);
        setError('Failed to load matchmaking data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchMatchmakingData();
    }
  }, [user.id, filters]);

  const handleChallenge = async (matchId) => {
    try {
      await matchmakingService.createChallenge({
        match_id: matchId,
        challenger_id: user.id,
        challenger_team: user.team_name
      });
      
      // Refresh data after challenge
      const [matchesResponse, requestsResponse] = await Promise.all([
        matchmakingService.getAvailableMatches(filters),
        matchmakingService.getMyRequests(user.id)
      ]);
      
      setAvailableMatches(matchesResponse.data || []);
      setMyRequests(requestsResponse.data || []);
      
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError('Failed to create challenge. Please try again.');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await matchmakingService.cancelRequest(requestId);
      
      // Update local state
      setMyRequests(myRequests.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error canceling request:', error);
      setError('Failed to cancel request. Please try again.');
    }
  };

  const filteredMatches = availableMatches.filter(match => {
    if (filters.skill_level !== 'all' && match.skill_level !== filters.skill_level) {
      return false;
    }
    if (filters.location !== 'all' && match.location !== filters.location) {
      return false;
    }
    if (filters.time_preference !== 'all' && match.preferred_time !== filters.time_preference) {
      return false;
    }
    return true;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Matchmaking</h1>
          <p className="mt-2 text-gray-600">Find opponents and organize matches</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="text-red-500 mr-2" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="text-gray-500 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Find Your Match</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.skill_level}
                onChange={(e) => setFilters({...filters, skill_level: e.target.value})}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              >
                <option value="all">All Locations</option>
                <option value="phnom_penh">Phnom Penh</option>
                <option value="siem_reap">Siem Reap</option>
                <option value="battambang">Battambang</option>
                <option value="sihanoukville">Sihanoukville</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Preference</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.time_preference}
                onChange={(e) => setFilters({...filters, time_preference: e.target.value})}
              >
                <option value="all">Any Time</option>
                <option value="morning">Morning (6AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 6PM)</option>
                <option value="evening">Evening (6PM - 11PM)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Matches */}
          <div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Matches ({filteredMatches.length})
                </h3>
              </div>
              <div className="p-6">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Sword className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No available matches match your filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMatches.map((match) => (
                      <div key={match.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{match.team_name}</h4>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Users size={14} className="mr-1" />
                                <span>{match.players_needed || '?'} players needed</span>
                                <span className="mx-2">•</span>
                                <Trophy size={14} className="mr-1" />
                                <span className="capitalize">{match.skill_level}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleChallenge(match.id)}
                              className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
                            >
                              Challenge
                            </button>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="flex items-center mr-4">
                              <MapPin size={14} className="mr-1" />
                              <span className="capitalize">{match.location?.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              <span className="capitalize">{match.preferred_time}</span>
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

          {/* My Match Requests */}
          <div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Match Requests ({myRequests.length})</h3>
              </div>
              <div className="p-6">
                {myRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No match requests sent</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                            <Users className="text-white" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">vs {request.opponent_team}</p>
                            <div className="flex items-center text-sm text-gray-600">
                              <span>{new Date(request.request_date).toLocaleDateString()}</span>
                              <span className="mx-2">•</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  request.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                {request.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
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
    </div>
  );
};

export default Matchmaking;