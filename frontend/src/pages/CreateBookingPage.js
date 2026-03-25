import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarIcon, BuildingOfficeIcon, UsersIcon, CurrencyDollarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';
import bookingService from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getTeamJerseyColors } from '../utils/teamColors';

const CreateBookingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const canCreateBooking = ['captain', 'field_owner', 'admin'].includes(user?.role);
  const [searchParams] = useSearchParams();
  const preselectedFieldId = searchParams.get('fieldId');
  const preselectedDay = searchParams.get('day');
  const preselectedTime = searchParams.get('time');
  const preselectedDuration = searchParams.get('duration');
  const hasSlotPrefill = Boolean(preselectedDay && preselectedTime);
  const initialDurationHours = ['1', '2', '3'].includes(preselectedDuration)
    ? preselectedDuration
    : hasSlotPrefill
    ? '1'
    : '2';

  const getPrefilledStartTime = () => {
    if (!preselectedDay || !preselectedTime) {
      return '';
    }

    const start = new Date(`${preselectedDay}T${preselectedTime}:00`);
    if (Number.isNaN(start.getTime())) {
      return '';
    }

    const toLocalInputValue = (value) => {
      const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    };

    return toLocalInputValue(start);
  };
  const prefilledStartTime = getPrefilledStartTime();
  
  const [fields, setFields] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fieldId: preselectedFieldId || '',
    teamId: '',
    startTime: prefilledStartTime,
    endTime: '',
    durationHours: initialDurationHours,
    notes: ''
  });
  const getDiscountPercent = (field) => Math.min(100, Math.max(0, Number(field?.discountPercent || 0)));
  const getDiscountedPrice = (field) => {
    const basePrice = Number(field?.pricePerHour || 0);
    const discountPercent = getDiscountPercent(field);
    return Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
  };
  const hasTeams = Array.isArray(teams) && teams.length > 0;
  const toLocalInputValue = (value) => {
    const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };
  const syncEndTimeFromStartAndDuration = (startTimeValue, durationHoursValue) => {
    const startTime = new Date(startTimeValue);
    if (!startTimeValue || Number.isNaN(startTime.getTime())) return '';
    const durationHours = Number(durationHoursValue || 2);
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    return toLocalInputValue(endTime);
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      endTime: syncEndTimeFromStartAndDuration(prev.startTime, prev.durationHours)
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fieldsResponse, teamsResponse] = await Promise.all([
          fieldService.getAllFields(),
          teamService.getMyTeams()
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

    // Auto-calculate end time from selected duration.
    if (name === 'startTime' && value) {
      setFormData(prev => ({
        ...prev,
        startTime: value,
        endTime: syncEndTimeFromStartAndDuration(value, prev.durationHours)
      }));
    }

    if (name === 'durationHours') {
      setFormData(prev => ({
        ...prev,
        durationHours: value,
        endTime: syncEndTimeFromStartAndDuration(prev.startTime, value)
      }));
    }
  };

  const calculatePrice = () => {
    const field = Array.isArray(fields) ? fields.find(f => f.id === parseInt(formData.fieldId)) : null;
    if (!field || !formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const duration = (end - start) / (1000 * 60 * 60); // hours
    
    return duration * getDiscountedPrice(field);
  };

  const canBookField = (field) => String(field?.status || 'available').toLowerCase() === 'available';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setError(t('create_booking_valid_datetime', 'Please provide a valid date and time'));
        return;
      }

      const bookingData = {
        fieldId: parseInt(formData.fieldId),
        teamId: parseInt(formData.teamId),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        notes: formData.notes
      };

      const response = await bookingService.createBooking(bookingData);
      
      if (response.success) {
        navigate('/app/bookings', { 
          state: { successMessage: t('create_booking_success', 'Booking created successfully!') }
        });
      } else {
        setError(response.error || 'Failed to create booking');
      }
    } catch (err) {
      const apiErrors = err?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        setError(apiErrors.map((item) => item.message).join(', '));
      } else {
        setError(err.error || 'Failed to create booking');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedField = Array.isArray(fields) ? fields.find(f => f.id === parseInt(formData.fieldId)) : null;
  const selectedTeam = Array.isArray(teams) ? teams.find(t => t.id === parseInt(formData.teamId)) : null;
  const totalPrice = calculatePrice();
  const rawAmenities = selectedField?.amenities;
  const selectedFieldAmenities = Array.isArray(rawAmenities)
    ? rawAmenities
    : typeof rawAmenities === 'string'
    ? rawAmenities.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!canCreateBooking) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('create_booking_access_required', 'Access Required')}</h1>
        <p className="mt-3 text-sm text-gray-600">
          {t('create_booking_access_description', 'You need captain, field owner, or admin access to book fields.')}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/settings')}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            {t('action_open_settings', 'Open Settings')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/bookings')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t('action_back_to_bookings', 'Back to Bookings')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/app/bookings')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          {t('action_back_to_bookings', 'Back to Bookings')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('create_booking_title', 'Create New Booking')}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {t('create_booking_subtitle', 'Book a football field for your team')}
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
                  {t('create_booking_select_field', 'Select Field *')}
                </label>
                <select
                  id="fieldId"
                  name="fieldId"
                  value={formData.fieldId}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">{t('create_booking_choose_field', 'Choose a field...')}</option>
                  {Array.isArray(fields) ? fields.map(field => (
                    <option key={field.id} value={field.id} disabled={!canBookField(field)}>
                      {field.name} - ${getDiscountedPrice(field)}/hour{getDiscountPercent(field) > 0 ? ` (${getDiscountPercent(field)}% off)` : ''}{!canBookField(field) ? ` (${field.status})` : ''}
                    </option>
                  )) : null}
                </select>
                 <p className="mt-2 text-xs text-gray-500">{t('fields_only_available', 'Only fields with status "available" can be booked.')}</p>
              </div>

              {/* Team Selection */}
              <div>
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
                  {t('create_booking_select_team', 'Select Team *')}
                </label>
                <select
                  id="teamId"
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">{t('create_booking_choose_team', 'Choose a team...')}</option>
                  {Array.isArray(teams) ? teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  )) : null}
                </select>
                {selectedTeam && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                    <span>{t('create_booking_jersey_colors', 'Jersey Colors')}</span>
                    {getTeamJerseyColors(selectedTeam).map((color, index) => (
                      <span key={`${color}-${index}`} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                )}
                {!hasTeams && (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {t('create_booking_need_team', 'You need a team before booking.')}
                    <button
                      type="button"
                      onClick={() => navigate('/app/teams/create')}
                      className="ml-2 font-semibold underline hover:text-amber-900"
                    >
                      {t('action_create_team', 'Create Team')}
                    </button>
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    {t('create_booking_start_time', 'Start Time *')}
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
                  <label htmlFor="durationHours" className="block text-sm font-medium text-gray-700">
                    {t('create_booking_duration', 'Duration *')}
                  </label>
                  <select
                    id="durationHours"
                    name="durationHours"
                    value={formData.durationHours}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="1">{t('hour_suffix', '{{value}} hour', { value: 1 })}</option>
                    <option value="2">{t('hours_suffix', '{{value}} hours', { value: 2 })}</option>
                    <option value="3">{t('hours_suffix', '{{value}} hours', { value: 3 })}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time (Auto) *
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    readOnly
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  {t('create_booking_notes', 'Notes')} (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder={t('create_booking_notes_placeholder', 'Add any booking notes...')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
          onClick={() => navigate('/app/bookings')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {t('action_cancel', 'Cancel')}
        </button>
                <button
                  type="submit"
                  disabled={submitting || !hasTeams}
                  className="px-4 py-2 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {submitting ? t('create_booking_submitting', 'Creating Booking...') : t('create_booking_submit', 'Create Booking')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('create_booking_summary', 'Booking Summary')}</h3>
            
            {selectedField && (
              <div className="space-y-4">
                <div className="flex items-start">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                      <h4 className="text-sm font-medium text-gray-900">{t('create_booking_field', 'Field')}</h4>
                      <p className="text-sm text-gray-600">{selectedField.name}</p>
                      <p className="text-xs text-gray-500">{selectedField.address}</p>
                      <p className="mt-1 text-xs font-semibold capitalize text-gray-600">{t('field_status', 'Status')}: {selectedField.status || 'available'}</p>
                      {getDiscountPercent(selectedField) > 0 && (
                        <p className="mt-1 text-xs font-semibold text-emerald-600">{getDiscountPercent(selectedField)}% off available</p>
                      )}
                    </div>
                  </div>

                {selectedTeam && (
                  <div className="flex items-start">
                    <UsersIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{t('create_booking_team', 'Team')}</h4>
                      <p className="text-sm text-gray-600">{selectedTeam.name}</p>
                      <div className="mt-1 inline-flex items-center gap-1.5">
                        {getTeamJerseyColors(selectedTeam).map((color, index) => (
                          <span key={`${color}-${index}`} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {canCreateBooking && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-900">{t('create_booking_field_details', 'Field Details for Captain')}</h4>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>{t('create_booking_field_type', 'Field Type')}</span>
                        <span className="font-medium text-gray-800">{selectedField.fieldType || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('create_booking_surface', 'Surface')}</span>
                        <span className="font-medium text-gray-800">{selectedField.surfaceType?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('create_booking_capacity', 'Capacity')}</span>
                        <span className="font-medium text-gray-800">{selectedField.capacity || 'N/A'} {t('players_suffix', '{{count}} players', { count: '' }).trim()}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-900">{t('create_booking_amenities', 'Amenities')}</h5>
                      {selectedFieldAmenities.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedFieldAmenities.map((amenity, index) => (
                            <span
                              key={`${amenity}-${index}`}
                              className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                            >
                              {String(amenity).replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">{t('create_booking_no_amenities', 'No amenities listed for this field.')}</p>
                      )}
                    </div>
                  </div>
                )}

                {formData.startTime && (
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{t('create_booking_date_time', 'Date & Time')}</h4>
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
                        <h4 className="text-sm font-medium text-gray-900">{t('create_booking_total_price', 'Total Price')}</h4>
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
                  {t('create_booking_choose_field', 'Choose a field...')}
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