import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
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
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the optimized single call to get all dashboard data
        const response = await dashboardService.getAllDashboardData();

        if (response.success) {
          setStats(response.data.stats || []);
          setRecentActivity(response.data.recentActivity || []);
          setUpcomingMatches(response.data.upcomingMatches || []);
        } else {
          throw new Error(response.error || 'Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        
        // Fallback to mock data if API fails
        setStats([
          { name: 'Total Fields', value: '1', icon: BuildingOfficeIcon, color: 'bg-blue-500' },
          { name: 'Active Teams', value: '2', icon: UsersIcon, color: 'bg-green-500' },
          { name: 'This Month Bookings', value: '2', icon: CalendarIcon, color: 'bg-yellow-500' },
          { name: 'Revenue', value: '$100', icon: CurrencyDollarIcon, color: 'bg-purple-500' },
        ]);
        setRecentActivity([
          { id: 1, action: 'New booking created', field: 'Downtown Arena', time: '2 hours ago', type: 'booking' },
          { id: 2, action: 'Team created', team: 'Test Team', time: '4 hours ago', type: 'team' },
        ]);
        setUpcomingMatches([
          { id: 1, home: 'Test Team', away: 'Opponent Team', field: 'Downtown Arena', date: 'Tomorrow, 6:00 PM' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityColor = (type) => {
    const colors = {
      booking: 'bg-blue-100 text-blue-800',
      team: 'bg-green-100 text-green-800',
      match: 'bg-yellow-100 text-yellow-800',
      field: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.firstName || user?.username}! Here's what's happening with your football booking platform.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 text-white ${stat.color}`} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="divide-y divide-gray-200">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 p-1 rounded-full ${getActivityColor(activity.type)}`}>
                          <SparklesIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-500">
                            {activity.field || activity.team} • {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Matches</h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="divide-y divide-gray-200">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div key={match.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {match.team?.name || 'Team'} vs {match.opponentTeam?.name || 'Opponent'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {match.field?.name || 'Field'} • {new Date(match.startTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <AwardIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No upcoming matches
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
