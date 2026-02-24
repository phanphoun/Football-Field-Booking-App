import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Calendar, DollarSign, Users, Clock, ChevronLeft } from 'lucide-react';
import { fieldsService, bookingsService } from '../services/api';

const FieldDetails = () => {
  const { id } = useParams();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    const fetchFieldDetails = async () => {
      try {
        const response = await fieldsService.getById(id);
        setField(response.data);
      } catch (error) {
        console.error('Error fetching field details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFieldDetails();
  }, [id]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    try {
      await bookingsService.create({
        field_id: id,
        date: selectedDate,
        time: selectedTime
      });
      alert('Booking request sent successfully!');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Field not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/fields"
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            <ChevronLeft size={20} className="mr-2" />
            Back to Fields
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Field Image */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={field.image || 'https://via.placeholder.com/640x360/22c55e/ffffff?text=Football+Field'}
                  alt={field.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Field Information */}
          <div>
            <div className="card p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{field.name}</h1>
              
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  <span>{field.location}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Star size={16} className="text-yellow-400 mr-1" />
                  <span className="mr-2">{field.average_rating || 4.5}</span>
                  <span className="text-gray-400">({field.total_reviews || 100} reviews)</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <DollarSign size={16} className="mr-1" />
                  <span className="font-semibold">${field.price_per_hour || 50}</span>
                  <span className="text-gray-600">/hour</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users size={16} className="mr-1" />
                  <span>Type: {field.type || 'Standard'}</span>
                  <span className="ml-2">• Max {field.max_players || 22} players</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock size={16} className="mr-1" />
                  <span>Open: {field.opening_time || '6:00 AM'}</span>
                  <span className="ml-2">• Close: {field.closing_time || '10:00 PM'}</span>
                </div>
              </div>

              {/* Booking Form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Book This Field</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Select Date</label>
                    <input
                      type="date"
                      className="input"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="form-label">Select Time</label>
                    <select
                      className="input"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    >
                      <option value="">Select a time</option>
                      <option value="06:00">6:00 AM</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="20:00">8:00 PM</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  className="btn btn-primary btn-lg w-full"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDetails;
