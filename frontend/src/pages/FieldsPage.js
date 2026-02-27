import React from 'react';
import { BuildingOfficeIcon, MapPinIcon, CurrencyDollarIcon, StarIcon as SparklesIcon } from '@heroicons/react/24/outline';

const FieldsPage = () => {
  const fields = [
    {
      id: 1,
      name: 'Green Field FC',
      address: '123 Sports Street, Phnom Penh',
      pricePerHour: 25,
      rating: 4.5,
      fieldType: '11v11',
      surfaceType: 'natural_grass',
      image: 'https://images.unsplash.com/photo-1547347328-ecbb803c9621?w=400&h=200&fit=crop'
    },
    {
      id: 2,
      name: 'Arena Sports Complex',
      address: '456 Stadium Road, Phnom Penh',
      pricePerHour: 30,
      rating: 4.8,
      fieldType: '7v7',
      surfaceType: 'artificial_turf',
      image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=200&fit=crop'
    },
    {
      id: 3,
      name: 'City Stadium',
      address: '789 Park Avenue, Phnom Penh',
      pricePerHour: 35,
      rating: 4.2,
      fieldType: '5v5',
      surfaceType: 'concrete',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Football Fields</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse and book football fields in your area
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search fields..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
              <option value="">All Types</option>
              <option value="5v5">5v5</option>
              <option value="7v7">7v7</option>
              <option value="11v11">11v11</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Surface Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
              <option value="">All Surfaces</option>
              <option value="natural_grass">Natural Grass</option>
              <option value="artificial_turf">Artificial Turf</option>
              <option value="concrete">Concrete</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Price/Hour</label>
            <input
              type="number"
              placeholder="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field) => (
          <div key={field.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gray-200">
              <img
                src={field.image}
                alt={field.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">{field.name}</h3>
                <div className="flex items-center">
                  <SparklesIcon className="h-4 w-4 text-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600">{field.rating}</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {field.address}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  {field.fieldType} • {field.surfaceType.replace('_', ' ')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  ${field.pricePerHour}/hour
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                  Book Now
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          Load More Fields
        </button>
      </div>
    </div>
  );
};

export default FieldsPage;
