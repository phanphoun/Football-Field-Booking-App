import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, DollarSign, Users, TrendingUp, MapPin, Settings, BarChart3, Eye, Edit, Trash2 } from 'lucide-react';
import { fieldsService, bookingsService } from '../services/api';

const FieldOwnerDashboard = ({ user }) => {
  const [stats, setStats] = useState({});
  const [myFields, setMyFields] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFieldOwnerData = async () => {
      try {
        // Fetch field owner stats
        setStats({
          totalFields: 5,
          totalBookings: 48,
          monthlyRevenue: 2400,
          averageRating: 4.6,
          occupancyRate: 78
        });

        // Fetch user's fields
        const fieldsResponse = await fieldsService.getAll({ owner_id: user.id });
        setMyFields(fieldsResponse.data || []);

        // Fetch recent bookings for user's fields
        const bookingsResponse = await bookingsService.getAll({ field_owner: user.id, limit: 10 });
        setRecentBookings(bookingsResponse.data || []);
      } catch (error) {
        console.error('Error fetching field owner data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFieldOwnerData();
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
            Field Owner Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your fields and track your booking performance
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full">
                <MapPin className="text-primary-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalFields || 0}</p>
                <p className="text-gray-600">Total Fields</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-full">
                <Calendar className="text-success-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings || 0}</p>
                <p className="text-gray-600">Total Bookings</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-full">
                <DollarSign className="text-warning-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue || 0}</p>
                <p className="text-gray-600">Monthly Revenue</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-info-100 rounded-full">
                <TrendingUp className="text-info-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.occupancyRate || 0}%</p>
                <p className="text-gray-600">Occupancy Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Fields */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">My Fields</h3>
                <Link
                  to="/fields/new"
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Add Field
                </Link>
              </div>
              <div className="p-6">
                {myFields.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">No fields added yet</p>
                    <Link
                      to="/fields/new"
                      className="btn btn-primary mt-4"
                    >
                      Add Your First Field
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myFields.map((field) => (
                      <div key={field.id} className="card hover:shadow-md transition-shadow">
                        <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-t-lg mb-4">
                          <img
                            src={field.image || 'https://via.placeholder.com/300x169/22c55e/ffffff?text=Field'}
                            alt={field.name}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{field.name}</h4>
                            <div className="flex space-x-2">
                              <Link
                                to={`/fields/${field.id}/edit`}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <Edit size={16} />
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this field?')) {
                                    // Handle delete
                                  }
                                }}
                                className="text-danger-600 hover:text-danger-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-1" />
                              {field.location}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-lg font-bold text-primary-600">${field.price_per_hour}</span>
                              <span className="text-gray-600">/hour</span>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                field.status === 'active' ? 'bg-success-100 text-success-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {field.status}
                              </span>
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

          {/* Quick Actions */}
          <div>
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-4">
                <Link
                  to="/bookings"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Calendar className="text-primary-600 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Manage Bookings</p>
                      <p className="text-sm text-gray-600">View and manage all bookings</p>
                    </div>
                  </div>
                  <Eye className="text-gray-400" size={20} />
                </Link>

                <Link
                  to="/analytics"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <BarChart3 className="text-primary-600 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">View Analytics</p>
                      <p className="text-sm text-gray-600">Revenue and occupancy insights</p>
                    </div>
                  </div>
                  <TrendingUp className="text-gray-400" size={20} />
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Settings className="text-primary-600 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Field Settings</p>
                      <p className="text-sm text-gray-600">Configure field options</p>
                    </div>
                  </div>
                  <Settings className="text-gray-400" size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="mt-8">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <Link to="/bookings" className="text-primary-600 hover:text-primary-700 text-sm">
                View All
              </Link>
            </div>
            <div className="p-6">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No recent bookings</p>
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
                            {booking.user_name} • {new Date(booking.date).toLocaleDateString()}
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
      </div>
    </div>
  );
};

export default FieldOwnerDashboard;
