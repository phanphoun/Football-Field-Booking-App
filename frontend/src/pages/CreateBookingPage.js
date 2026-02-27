import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarIcon, ClockIcon, BuildingOfficeIcon, UsersIcon, CurrencyDollarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';
import bookingService from '../services/bookingService';

const CreateBookingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFieldId = searchParams.get('fieldId');
  
  const [fields, setFields] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fieldId: preselectedFieldId || '',
    teamId: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fieldsResponse, teamsResponse] = await Promise.all([
          fieldService.getAllFields(),
          teamService.getAllTeams()
        ]);
        
        // Ensure we always set arrays, even if response.data is not an array
        const fieldsData = Array.isArray(fieldsResponse.data) ? fieldsResponse.data : [];
        const teamsData = Array.isArray(teamsResponse.data) ? teamsResponse.data : [];
        
        setFields(fieldsData);
        setTeams(teamsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load fields or teams');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate end time (2 hours after start time)
    if (name === 'startTime' && value) {
      const startTime = new Date(value);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      setFormData(prev => ({
        ...prev,
        endTime: endTime.toISOString().slice(0, 16)
      }));
    }
  };

  const calculatePrice = () => {
    const field = Array.isArray(fields) ? fields.find(f => f.id === parseInt(formData.fieldId)) : null;
    if (!field || !formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const duration = (end - start) / (1000 * 60 * 60); // hours
    
    return duration * parseFloat(field.pricePerHour);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const bookingData = {
        fieldId: parseInt(formData.fieldId),
        teamId: parseInt(formData.teamId),
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes
      };

      const response = await bookingService.createBooking(bookingData);
      
      if (response.success) {
        navigate('/bookings', { 
          state: { successMessage: 'Booking created successfully!' }
        });
      } else {
        setError(response.error || 'Failed to create booking');
      }
    } catch (err) {
      setError(err.error || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedField = Array.isArray(fields) ? fields.find(f => f.id === parseInt(formData.fieldId)) : null;
  const selectedTeam = Array.isArray(teams) ? teams.find(t => t.id === parseInt(formData.teamId)) : null;
  const totalPrice = calculatePrice();

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
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Bookings
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Booking</h1>
        <p className="mt-1 text-sm text-gray-600">
          Book a football field for your team
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Field Selection */}
              <div>
                <label htmlFor="fieldId" className="block text-sm font-medium text-gray-700">
                  Select Field *
                </label>
                <select
                  id="fieldId"
                  name="fieldId"
                  value={formData.fieldId}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Choose a field...</option>
                  {Array.isArray(fields) ? fields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name} - ${field.pricePerHour}/hour
                    </option>
                  )) : null}
                </select>
              </div>

              {/* Team Selection */}
              <div>
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
                  Select Team *
                </label>
                <select
                  id="teamId"
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Choose a team...</option>
                  {Array.isArray(teams) ? teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  )) : null}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    min={formData.startTime || new Date().toISOString().slice(0, 16)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special requirements or notes..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
            
            {selectedField && (
              <div className="space-y-4">
                <div className="flex items-start">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Field</h4>
                    <p className="text-sm text-gray-600">{selectedField.name}</p>
                    <p className="text-xs text-gray-500">{selectedField.address}</p>
                  </div>
                </div>

                {selectedTeam && (
                  <div className="flex items-start">
                    <UsersIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Team</h4>
                      <p className="text-sm text-gray-600">{selectedTeam.name}</p>
                    </div>
                  </div>
                )}

                {formData.startTime && (
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Date & Time</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(formData.startTime).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(formData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {formData.endTime ? new Date(formData.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                )}

                {totalPrice > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="text-sm font-medium text-gray-900">Total Price</h4>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ${selectedField.pricePerHour}/hour × {((new Date(formData.endTime) - new Date(formData.startTime)) / (1000 * 60 * 60)).toFixed(1)} hours
                    </p>
                  </div>
                )}
              </div>
            )}

            {!selectedField && (
              <div className="text-center py-8">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Select a field to see booking details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingPage;
