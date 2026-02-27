import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  TrophyIcon as AwardIcon,
  StarIcon as SparklesIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user, isAdmin, isFieldOwner, isCaptain } = useAuth();

  const stats = [
    { name: 'Total Fields', value: '12', icon: BuildingOfficeIcon, color: 'bg-blue-500' },
    { name: 'Active Teams', value: '8', icon: UsersIcon, color: 'bg-green-500' },
    { name: 'This Month Bookings', value: '24', icon: CalendarIcon, color: 'bg-yellow-500' },
    { name: 'Revenue', value: '$1,240', icon: CurrencyDollarIcon, color: 'bg-purple-500' },
  ];

  const recentActivity = [
    { id: 1, action: 'New booking created', field: 'Green Field FC', time: '2 hours ago', type: 'booking' },
    { id: 2, action: 'Team joined', team: 'Thunder Strikers', time: '4 hours ago', type: 'team' },
    { id: 3, action: 'Match completed', field: 'Arena Sports', time: '6 hours ago', type: 'match' },
    { id: 4, action: 'New field added', field: 'City Stadium', time: '1 day ago', type: 'field' },
  ];

  const upcomingMatches = [
    { id: 1, home: 'Green Field FC', away: 'Thunder Strikers', field: 'Arena Sports', date: 'Tomorrow, 6:00 PM' },
    { id: 2, home: 'City Warriors', away: 'Lightning FC', field: 'Green Field FC', date: 'Friday, 8:00 PM' },
    { id: 3, home: 'Thunder Strikers', away: 'Eagles FC', field: 'City Stadium', date: 'Saturday, 4:00 PM' },
  ];

  const getActivityColor = (type) => {
    const colors = {
      booking: 'bg-blue-100 text-blue-800',
      team: 'bg-green-100 text-green-800',
      match: 'bg-yellow-100 text-yellow-800',
      field: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.firstName}! Here's what's happening with your football booking platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 text-white ${stat.color} rounded-md p-1`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivity.length - 1 ? (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <span
                              className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.type)}`}
                            >
                              {activity.type === 'booking' && <CalendarIcon className="h-4 w-4" />}
                              {activity.type === 'team' && <UsersIcon className="h-4 w-4" />}
                              {activity.type === 'match' && <AwardIcon className="h-4 w-4" />}
                              {activity.type === 'field' && <BuildingOfficeIcon className="h-4 w-4" />}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{activity.action}</span>
                              {activity.field && <span> at {activity.field}</span>}
                            </div>
                            <p className="text-sm text-gray-500">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Matches</h3>
              <div className="space-y-4">
                {upcomingMatches.map((match) => (
                  <div key={match.id} className="border-l-4 border-green-500 pl-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {match.home} vs {match.away}
                      </p>
                      <p className="text-gray-500">{match.field}</p>
                      <p className="text-gray-500 text-xs mt-1">{match.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <CalendarIcon className="h-4 w-4 mr-2" />
                New Booking
              </button>
              {(isFieldOwner || isAdmin) && (
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                  Add Field
                </button>
              )}
              {(isCaptain || isAdmin) && (
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Create Team
                </button>
              )}
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <SparklesIcon className="h-4 w-4 mr-2" />
                View Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
