import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Users, Calendar, Trophy, Star, ArrowRight } from 'lucide-react';
import { fieldsService } from '../services/api';

const Home = () => {
  const [featuredFields, setFeaturedFields] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch featured fields
        const fieldsResponse = await fieldsService.getAll({ featured: true, limit: 6 });
        setFeaturedFields(fieldsResponse.data || []);

        // Mock stats for now
        setStats({
          totalFields: 150,
          activeUsers: 2500,
          weeklyMatches: 85,
          totalTeams: 120
        });
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Book Football Fields Across Cambodia
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Connect with players, organize matches, and enjoy the beautiful game
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/fields"
                className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg font-semibold rounded-lg px-8 py-3"
              >
                Browse Fields
              </Link>
              <Link
                to="/register"
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg font-semibold rounded-lg px-8 py-3"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Join Cambodia's Growing Football Community
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connect with thousands of players and book the best fields in your area
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">{stats.totalFields}</div>
              <div className="text-gray-600">Football Fields</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">{stats.activeUsers}</div>
              <div className="text-gray-600">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">{stats.weeklyMatches}</div>
              <div className="text-gray-600">Weekly Matches</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">{stats.totalTeams}</div>
              <div className="text-gray-600">Teams</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Fields */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Football Fields
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Discover the best football fields across Cambodia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredFields.map((field) => (
              <div key={field.id} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 bg-gray-200 rounded-t-lg mb-4 overflow-hidden">
                  <img
                    src={field.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzIyYzU1ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Gb290YmFsbCBGaWVsZDwvdGV4dD48L3N2Zz4='}
                    alt={field.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-2">
                    <MapPin size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-600">{field.location}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{field.name}</h3>
                  <div className="flex items-center mb-4">
                    <Star size={16} className="text-yellow-400 mr-1" />
                    <span className="text-gray-600">{field.rating || 4.5}</span>
                    <span className="text-gray-400 ml-2">({field.reviews || 100} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">${field.pricePerHour || 50}</span>
                      <span className="text-gray-600">/hour</span>
                    </div>
                    <Link
                      to={`/fields/${field.id}`}
                      className="flex items-center text-primary-600 hover:text-primary-700 font-medium bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors"
                    >
                      View Details
                      <ArrowRight size={16} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/fields"
              className="btn btn-primary btn-lg inline-flex items-center rounded-lg px-8 py-3"
            >
              View All Fields
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Play?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of players and book your first match today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg font-semibold rounded-lg px-8 py-3"
            >
              Sign Up Now
            </Link>
            <Link
              to="/fields"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg font-semibold rounded-lg px-8 py-3"
            >
              Browse Fields
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
