import apiService from './api';

const fieldService = {
  // Get all fields
  getAllFields: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      fieldType: filters.fieldType,
      surfaceType: filters.surfaceType,
      city: filters.city,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      status: filters.status || 'available'
    };

    const response = await apiService.get('/fields', params);
    return response;
  },

  // Get field by ID
  getFieldById: async (fieldId) => {
    const response = await apiService.get(`/fields/${fieldId}`);
    return response;
  },

  // Create new field (field owner or admin only)
  createField: async (fieldData) => {
    const response = await apiService.post('/fields', fieldData);
    return response;
  },

  // Update field (owner or admin only)
  updateField: async (fieldId, fieldData) => {
    const response = await apiService.put(`/fields/${fieldId}`, fieldData);
    return response;
  },

  // Delete field (owner or admin only)
  deleteField: async (fieldId) => {
    const response = await apiService.delete(`/fields/${fieldId}`);
    return response;
  },

  // Get fields owned by current user
  getMyFields: async () => {
    const response = await apiService.get('/fields/my-fields');
    return response;
  },

  // Search fields
  searchFields: async (searchTerm, filters = {}) => {
    const params = {
      q: searchTerm,
      ...filters
    };

    const response = await apiService.get('/fields/search', params);
    return response;
  },

  // Get field availability
  getFieldAvailability: async (fieldId, date) => {
    const response = await apiService.get(`/fields/${fieldId}/availability`, { date });
    return response;
  },

  // Upload field images
  uploadFieldImages: async (fieldId, imageFiles) => {
    const formData = new FormData();
    
    imageFiles.forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });

    const response = await apiService.upload(`/fields/${fieldId}/images`, formData);
    return response;
  },

  // Delete field image
  deleteFieldImage: async (fieldId, imageId) => {
    const response = await apiService.delete(`/fields/${fieldId}/images/${imageId}`);
    return response;
  },

  // Get field ratings
  getFieldRatings: async (fieldId) => {
    const response = await apiService.get(`/fields/${fieldId}/ratings`);
    return response;
  },

  // Rate a field
  rateField: async (fieldId, ratingData) => {
    const response = await apiService.post(`/fields/${fieldId}/rate`, ratingData);
    return response;
  },

  // Get field statistics (for owners)
  getFieldStats: async (fieldId) => {
    const response = await apiService.get(`/fields/${fieldId}/stats`);
    return response;
  },

  // Helper method to format field data for API
  formatFieldData: (rawData) => {
    return {
      name: rawData.name,
      description: rawData.description,
      address: rawData.address,
      city: rawData.city,
      province: rawData.province,
      latitude: parseFloat(rawData.latitude) || null,
      longitude: parseFloat(rawData.longitude) || null,
      pricePerHour: parseFloat(rawData.pricePerHour),
      operatingHours: rawData.operatingHours,
      fieldType: rawData.fieldType,
      surfaceType: rawData.surfaceType,
      capacity: parseInt(rawData.capacity),
      amenities: rawData.amenities,
      images: rawData.images || []
    };
  },

  // Helper method to validate field data
  validateFieldData: (fieldData) => {
    const errors = [];

    if (!fieldData.name || fieldData.name.trim().length < 3) {
      errors.push('Field name must be at least 3 characters long');
    }

    if (!fieldData.address || fieldData.address.trim().length < 5) {
      errors.push('Address must be at least 5 characters long');
    }

    if (!fieldData.city || fieldData.city.trim().length < 2) {
      errors.push('City must be at least 2 characters long');
    }

    if (!fieldData.pricePerHour || fieldData.pricePerHour <= 0) {
      errors.push('Price per hour must be greater than 0');
    }

    if (!fieldData.fieldType) {
      errors.push('Field type is required');
    }

    if (!fieldData.surfaceType) {
      errors.push('Surface type is required');
    }

    if (!fieldData.capacity || fieldData.capacity < 1) {
      errors.push('Capacity must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default fieldService;
