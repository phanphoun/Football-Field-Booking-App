import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingOfficeIcon, MapPinIcon, CurrencyDollarIcon, StarIcon as SparklesIcon } from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from '../components/ui';

const FieldsPage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldTypeFilter, setFieldTypeFilter] = useState('');
  const [surfaceTypeFilter, setSurfaceTypeFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        const response = await fieldService.getAllFields();
        // Ensure we always set an array, even if response.data is not an array
        const fieldsData = Array.isArray(response.data) ? response.data : [];
        setFields(fieldsData);
        setFilteredFields(fieldsData);
      } catch (err) {
        console.error('Failed to fetch fields:', err);
        setError('Failed to load fields');
        
        // Fallback to mock data if API fails
        const mockFields = [
          {
            id: 1,
            name: 'Downtown Arena',
            address: '123 Main St, Phnom Penh',
            city: 'Phnom Penh',
            province: 'Phnom Penh',
            pricePerHour: 50.00,
            rating: null,
            totalRatings: 0,
            fieldType: '11v11',
            surfaceType: 'artificial_turf',
            images: ['https://example.com/field1.jpg'],
            status: 'available'
          }
        ];
        setFields(mockFields);
        setFilteredFields(mockFields);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  useEffect(() => {
    const filtered = fields.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        field.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !fieldTypeFilter || field.fieldType === fieldTypeFilter;
      const matchesSurface = !surfaceTypeFilter || field.surfaceType === surfaceTypeFilter;
      const matchesPrice = !maxPriceFilter || field.pricePerHour <= parseFloat(maxPriceFilter);
      
      return matchesSearch && matchesType && matchesSurface && matchesPrice;
    });

    setFilteredFields(filtered);
  }, [fields, searchTerm, fieldTypeFilter, surfaceTypeFilter, maxPriceFilter]);

  const handleBookField = (fieldId) => {
    navigate(`/app/bookings/new?fieldId=${fieldId}`);
  };

  const handleViewDetails = (fieldId) => {
    navigate(`/fields/${fieldId}`);
  };

  const getRatingDisplay = (rating, totalRatings) => {
    if (!rating || totalRatings === 0) return 'No rating';
    return `${rating.toFixed(1)} (${totalRatings} reviews)`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fields</h1>
          <p className="mt-1 text-sm text-gray-600">Browse and book football fields in your area.</p>
        </div>
        <Badge tone="gray">{filteredFields.length} results</Badge>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardBody className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
            <select
              value={fieldTypeFilter}
              onChange={(e) => setFieldTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Types</option>
              <option value="5v5">5v5</option>
              <option value="7v7">7v7</option>
              <option value="11v11">11v11</option>
              <option value="futsal">Futsal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Surface Type</label>
            <select
              value={surfaceTypeFilter}
              onChange={(e) => setSurfaceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Surfaces</option>
              <option value="natural_grass">Natural Grass</option>
              <option value="artificial_turf">Artificial Turf</option>
              <option value="concrete">Concrete</option>
              <option value="indoor">Indoor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Price/Hour</label>
            <input
              type="number"
              placeholder="50"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setFieldTypeFilter('');
              setSurfaceTypeFilter('');
              setMaxPriceFilter('');
            }}
          >
            Clear filters
          </Button>
        </div>
        </CardBody>
      </Card>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFields.length > 0 ? (
          filteredFields.map((field) => (
            <div key={field.id} className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img
                  src={field.images?.[0] || 'https://via.placeholder.com/400x200'}
                  alt={field.name}
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{field.name}</h3>
                  <div className="flex items-center">
                    <SparklesIcon className="h-4 w-4 text-yellow-400" />
                    <span className="ml-1 text-sm text-gray-600">
                      {getRatingDisplay(field.rating, field.totalRatings)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {field.address}, {field.city}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    {field.fieldType} • {String(field.surfaceType || '').replace('_', ' ')}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    ${field.pricePerHour}/hour
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBookField(field.id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => handleViewDetails(field.id)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={BuildingOfficeIcon}
              title="No fields found"
              description="Try adjusting your search or filters."
              actionLabel="Clear filters"
              onAction={() => {
                setSearchTerm('');
                setFieldTypeFilter('');
                setSurfaceTypeFilter('');
                setMaxPriceFilter('');
              }}
            />
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredFields.length > 0 && filteredFields.length < fields.length && (
        <div className="mt-8 text-center">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Load More Fields
          </button>
        </div>
      )}
    </div>
  );
};

export default FieldsPage;
