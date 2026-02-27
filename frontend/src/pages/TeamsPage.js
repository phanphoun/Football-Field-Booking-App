import React from 'react';
import { UsersIcon, TrophyIcon as AwardIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';

const TeamsPage = () => {
  const teams = [
    {
      id: 1,
      name: 'Green Field FC',
      captain: 'John Doe',
      members: 12,
      maxPlayers: 15,
      skillLevel: 'intermediate',
      preferredTime: 'evening',
      homeField: 'Green Field FC Stadium',
      wins: 8,
      losses: 3,
      draws: 2
    },
    {
      id: 2,
      name: 'Thunder Strikers',
      captain: 'Jane Smith',
      members: 10,
      maxPlayers: 11,
      skillLevel: 'advanced',
      preferredTime: 'morning',
      homeField: 'Arena Sports Complex',
      wins: 12,
      losses: 2,
      draws: 1
    },
    {
      id: 3,
      name: 'City Warriors',
      captain: 'Mike Johnson',
      members: 8,
      maxPlayers: 10,
      skillLevel: 'beginner',
      preferredTime: 'flexible',
      homeField: 'City Stadium',
      wins: 4,
      losses: 6,
      draws: 3
    }
  ];

  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
      professional: 'bg-purple-100 text-purple-800'
    };
    return colors[level] || colors.beginner;
  };

  const getPreferredTimeColor = (time) => {
    const colors = {
      morning: 'bg-blue-100 text-blue-800',
      afternoon: 'bg-orange-100 text-orange-800',
      evening: 'bg-indigo-100 text-indigo-800',
      flexible: 'bg-gray-100 text-gray-800'
    };
    return colors[time] || colors.flexible;
  };

  const getWinRate = (wins, losses, draws) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-600">
            Join or create football teams and manage your squad
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Team
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Teams</label>
            <input
              type="text"
              placeholder="Search by name or captain..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
              <option value="">Any Time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">Captain: {team.captain}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Members</span>
                  <span className="text-sm font-medium">{team.members}/{team.maxPlayers}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Skill Level</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(team.skillLevel)}`}>
                    {team.skillLevel.charAt(0).toUpperCase() + team.skillLevel.slice(1)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Preferred Time</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPreferredTimeColor(team.preferredTime)}`}>
                    {team.preferredTime.charAt(0).toUpperCase() + team.preferredTime.slice(1)}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {team.homeField}
                </div>
              </div>

              {/* Match Statistics */}
              <div className="border-t pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Match Record</span>
                  <span className="text-sm text-gray-600">
                    {getWinRate(team.wins, team.losses, team.draws)}% win rate
                  </span>
                </div>
                <div className="flex space-x-4 text-sm">
                  <span className="text-green-600 font-medium">{team.wins}W</span>
                  <span className="text-gray-600">{team.draws}D</span>
                  <span className="text-red-600">{team.losses}L</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                  Join Team
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          Load More Teams
        </button>
      </div>
    </div>
  );
};

export default TeamsPage;
