import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, MapPin, Star, Clock, TrendingUp, User, ChevronRight } from 'lucide-react';
import { bookingsService, teamsService, userService } from '../services/api';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user stats
        const statsResponse = await userService.getStats(user.id);
        setStats(statsResponse.data || {
          totalBookings: 12,
          upcomingMatches: 3,
          teamsJoined: 2,
          winRate: 75
        });

        // Fetch recent bookings
        const bookingsResponse = await bookingsService.getUserBookings(user.id);
        setRecentBookings(bookingsResponse.data?.slice(0, 5) || []);

        // Fetch user's teams
        const teamsResponse = await teamsService.getMyTeams(user.id);
        setMyTeams(teamsResponse.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
            Welcome back, {user.full_name || user.username}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your football activities
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full">
                <Calendar className="text-primary-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings || 0}</p>
                <p className="text-gray-600">Total Bookings</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-full">
                <Trophy className="text-success-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingMatches || 0}</p>
                <p className="text-gray-600">Upcoming Matches</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-full">
                <Users className="text-warning-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.teamsJoined || 0}</p>
                <p className="text-gray-600">Teams Joined</p>
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
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              </div>
              <div className="p-6">
                {recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No bookings yet</p>
                    <Link
                      to="/fields"
                      className="btn btn-primary mt-4"
                    >
                      Book Your First Field
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                          <div>
                            <p className="font-medium text-gray-900">{booking.field_name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.date).toLocaleDateString()} • {booking.time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-success-100 text-success-800' :
                            booking.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-4">
                <Link
                  to="/fields"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <MapPin className="text-primary-600 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Browse Fields</p>
                      <p className="text-sm text-gray-600">Find and book football fields</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </Link>

                <Link
                  to="/teams"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Users className="text-primary-600 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Join Teams</p>
                      <p className="text-sm text-gray-600">Connect with other players</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </Link>

                <Link
                  to="/matchmaking"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Trophy className="text-primary-600 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Find Matches</p>
                      <p className="text-sm text-gray-600">Match with other teams</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <User className="text-primary-600 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Edit Profile</p>
                      <p className="text-sm text-gray-600">Update your information</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
