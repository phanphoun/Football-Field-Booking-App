import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Filter, Star, DollarSign, Clock, Calendar } from 'lucide-react';
import { fieldsService } from '../services/api';

const Fields = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  const cities = ['all', 'Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville'];
  const fieldTypes = ['all', '5v5', '7v7', '11v11'];
  const priceRanges = ['all', '0-25', '25-50', '50-100', '100+'];

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const params = {
          search: searchTerm,
          city: selectedCity !== 'all' ? selectedCity : undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
          price_range: selectedPrice !== 'all' ? selectedPrice : undefined
        };
        
        const response = await fieldsService.getAll(params);
        setFields(response.data || []);
      } catch (error) {
        console.error('Error fetching fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [searchTerm, selectedCity, selectedType, selectedPrice]);

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        field.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || field.city === selectedCity;
    const matchesType = selectedType === 'all' || field.type === selectedType;
    const matchesPrice = selectedPrice === 'all' || (() => {
      const price = field.price_per_hour || 0;
      switch (selectedPrice) {
        case '0-25': return price >= 0 && price <= 25;
        case '25-50': return price > 25 && price <= 50;
        case '50-100': return price > 50 && price <= 100;
        case '100+': return price > 100;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesCity && matchesType && matchesPrice;
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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Football Field
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Book the best fields across Cambodia for your next match
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="input-group">
                <Search className="input-icon" size={18} />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Search by field name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select
                  className="input"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  {cities.map(city => (
                    <option key={city} value={city}>
                      {city === 'all' ? 'All Cities' : city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
                <select
                  className="input"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {fieldTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  className="input"
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                >
                  {priceRanges.map(range => (
                    <option key={range} value={range}>
                      {range === 'all' ? 'All Prices' : `$${range.split('-')[0]}-${range.split('-')[1]}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <p className="text-gray-600">
          {filteredFields.length} field{filteredFields.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Fields Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredFields.map((field) => (
            <div key={field.id} className="card hover:shadow-lg transition-shadow duration-300">
              <div className="h-48 bg-gray-200 rounded-t-lg mb-4 relative overflow-hidden">
                <img
                  src={field.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzIyYzU1ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Gb290YmFsbCBGaWVsZDwvdGV4dD48L3N2Zz4='}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    field.status === 'available' ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'
                  }`}>
                    {field.status || 'Available'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <MapPin size={16} className="text-gray-400 mr-2" />
                  <span className="text-gray-600">{field.location}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{field.name}</h3>
                <div className="flex items-center mb-4">
                  <Star size={16} className="text-yellow-400 mr-1" />
                  <span className="text-gray-600">{field.average_rating || 4.5}</span>
                  <span className="text-gray-400 ml-2">({field.total_reviews || 100} reviews)</span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <div className="flex items-center mb-2">
                    <DollarSign size={14} className="mr-1" />
                    <span className="font-semibold">${field.price_per_hour || 50}</span>
                    <span className="text-gray-600">/hour</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <Clock size={14} className="mr-1" />
                    <span>Open: {field.opening_time || '6:00 AM'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>Type: {field.type || 'Standard'}</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-3 mt-4">
                  <Link
                    to={`/fields/${field.id}`}
                    className="btn btn-primary btn-sm rounded-lg px-4 py-2 w-full justify-center hover:scale-105 transition-transform"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => {
                      // Handle booking
                    }}
                    className="btn btn-success btn-sm rounded-lg px-4 py-2 w-full justify-center hover:scale-105 transition-transform font-semibold"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No Results */}
      {filteredFields.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <MapPin className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No fields found</h3>
            <p className="text-gray-600 mb-8">
              Try adjusting your search or filters to find more fields
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('all');
                setSelectedType('all');
                setSelectedPrice('all');
              }}
              className="btn btn-primary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fields;
