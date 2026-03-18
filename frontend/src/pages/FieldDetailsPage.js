import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import FieldLocationMap from '../components/maps/FieldLocationMap';
import fieldService from '../services/fieldService';
import bookingService from '../services/bookingService';
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from '../components/ui';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_FIELD_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="100%25" height="100%25" fill="%23e5e7eb"/></svg>';
const SLOT_HOURS = Array.from({ length: 16 }, (_, index) => index + 6);

const isPlaceholderImage = (rawImage) => String(rawImage || '').toLowerCase().includes('no field image');

const formatDayInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatHourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`;

const formatSlotRange = (hour) => {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  const end = new Date();
  end.setHours(hour + 1, 0, 0, 0);
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

<<<<<<< HEAD
=======
const getDiscountPercent = (field) => Math.min(100, Math.max(0, Number(field?.discountPercent || 0)));
const getDiscountedPrice = (field) => {
  const basePrice = Number(field?.pricePerHour || 0);
  const discountPercent = getDiscountPercent(field);
  return Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
};
const isBookableField = (field) => String(field?.status || 'available').toLowerCase() === 'available';
const getStatusTone = (status) => {
  const normalizedStatus = String(status || 'available').toLowerCase();
  if (normalizedStatus === 'available') return 'green';
  if (normalizedStatus === 'booked') return 'red';
  if (normalizedStatus === 'maintenance') return 'yellow';
  return 'gray';
};

>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
const FieldDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canCreateBooking = ['captain', 'field_owner'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [scheduleDay, setScheduleDay] = useState(() => formatDayInput(new Date()));
  const [slotBookings, setSlotBookings] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
<<<<<<< HEAD
=======
  const discountPercent = getDiscountPercent(field);
  const discountedPrice = getDiscountedPrice(field);
  const canBookThisField = isBookableField(field);
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0

  useEffect(() => {
    const fetchField = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fieldService.getFieldById(id);
        setField(response.data || null);
      } catch (err) {
        console.error('Failed to fetch field:', err);
        setError('Failed to load field');
      } finally {
        setLoading(false);
      }
    };

    fetchField();
  }, [id]);

  useEffect(() => {
    const fetchFieldSchedule = async () => {
      if (!field?.id || !scheduleDay) return;

      try {
        setSlotsLoading(true);
        const response = await bookingService.getPublicSchedule(scheduleDay, 24);
        const bookings = Array.isArray(response?.data?.bookings) ? response.data.bookings : [];
        setSlotBookings(bookings.filter((booking) => Number(booking.fieldId) === Number(field.id)));
      } catch (err) {
        console.error('Failed to fetch field schedule:', err);
        setSlotBookings([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchFieldSchedule();
  }, [field?.id, scheduleDay]);

  const handleBook = () => {
    if (field?.status && field.status !== 'available') {
      setError(field.closureMessage || `This field is currently ${field.status}.`);
      return;
    }

    const bookingPath = `/app/bookings/new?fieldId=${id}`;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: bookingPath, backgroundLocation: location } });
      return;
    }

    if (!canCreateBooking) {
      navigate('/app/settings', { state: { focusRoleRequest: 'captain' } });
      return;
    }

    navigate(bookingPath);
  };

  const handleSlotBook = (hour) => {
<<<<<<< HEAD
=======
    if (field?.status && field.status !== 'available') {
      setError(field.closureMessage || `This field is currently ${field.status}.`);
      return;
    }

>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
    if (!canCreateBooking) {
      handleBook();
      return;
    }

    navigate(`/app/bookings/new?fieldId=${id}&day=${scheduleDay}&time=${String(hour).padStart(2, '0')}:00&duration=1`);
  };

  const resolveFieldImageUrl = (rawImage) => {
    if (!rawImage || isPlaceholderImage(rawImage)) return DEFAULT_FIELD_IMAGE;
    if (/^https?:\/\//i.test(rawImage) || /^data:image\//i.test(rawImage)) return rawImage;
    if (String(rawImage).startsWith('/uploads/')) return `${API_ORIGIN}${rawImage}`;
    return rawImage;
  };

  const normalizeImages = (imagesValue) => {
    if (Array.isArray(imagesValue)) return imagesValue.filter((image) => !isPlaceholderImage(image));
    if (typeof imagesValue === 'string') {
      try {
        const parsed = JSON.parse(imagesValue);
        return Array.isArray(parsed) ? parsed.filter((image) => !isPlaceholderImage(image)) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const slotItems = useMemo(() => {
<<<<<<< HEAD
=======
    const isFieldClosed = field?.status && field.status !== 'available';

    if (isFieldClosed) {
      return SLOT_HOURS.map((hour) => ({
        key: `${scheduleDay}-${hour}`,
        hour,
        state: 'closed',
        booking: null
      }));
    }

>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
    return SLOT_HOURS.map((hour) => {
      const booking = slotBookings.find((item) => {
        const start = new Date(item.startTime);
        const end = new Date(item.endTime);
        return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start.getHours() <= hour && end.getHours() > hour;
      });

      if (!booking) {
        return {
          key: `${scheduleDay}-${hour}`,
          hour,
          state: 'available',
          booking: null
        };
      }

      return {
        key: `${scheduleDay}-${hour}`,
        hour,
        state: booking.status === 'pending' ? 'pending' : 'booked',
        booking
      };
    });
<<<<<<< HEAD
  }, [scheduleDay, slotBookings]);

  const fieldRating = Number(field?.rating || 0);
  const totalRatings = Number(field?.totalRatings || 0);
=======
  }, [scheduleDay, slotBookings, field?.status]);

  const isFieldClosed = field?.status && field.status !== 'available';
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'live-booking', label: 'Live Booking' },
    { key: 'comment-rate', label: 'Comment & Rate' }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!field) {
    return (
      <EmptyState
        icon={BuildingOfficeIcon}
        title="Field not found"
        description="The field may have been removed or the link is incorrect."
        actionLabel="Back to Fields"
        onAction={() => (window.location.href = '/fields')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <Card className="overflow-hidden">
        <div className="h-64 overflow-hidden bg-gray-200">
          <img
            src={resolveFieldImageUrl(normalizeImages(field.images)[0])}
            alt={field.name}
            className="h-full w-full object-cover"
            onError={(event) => {
              if (event.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                event.currentTarget.src = DEFAULT_FIELD_IMAGE;
              }
            }}
          />
        </div>

        <CardBody className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPinIcon className="mr-2 h-4 w-4 text-gray-400" />
                  {field.address}, {field.city}, {field.province}
                </div>
                <div className="flex items-center">
                  <BuildingOfficeIcon className="mr-2 h-4 w-4 text-gray-400" />
                  {field.fieldType} | {String(field.surfaceType || '').replace('_', ' ')}
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="mr-2 h-4 w-4 text-gray-400" />
<<<<<<< HEAD
                  ${field.pricePerHour}/hour
=======
                  {discountPercent > 0 ? (
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-600">${discountedPrice}/hour</span>
                      <span className="text-gray-400 line-through">${field.pricePerHour}/hour</span>
                    </span>
                  ) : (
                    `$${field.pricePerHour}/hour`
                  )}
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isAdmin && (
                <Button onClick={handleBook} disabled={isFieldClosed}>
                  {isFieldClosed
                    ? 'Field Closed'
                    : isAuthenticated && !canCreateBooking
                    ? 'Request Booking Access'
                    : 'Book Now'}
                </Button>
              )}
              <Button as={Link} to="/fields" variant="outline">
                Back
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {field.status && (
              <Badge tone={field.status === 'available' ? 'green' : field.status === 'maintenance' ? 'yellow' : 'gray'} className="capitalize">
                {field.status}
              </Badge>
            )}
            {field.capacity && <Badge tone="gray">{field.capacity} capacity</Badge>}
            {discountPercent > 0 && <Badge tone="green">{discountPercent}% off</Badge>}
          </div>

          {isFieldClosed && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="font-semibold">Field is currently closed.</div>
              <div className="mt-1">{field.closureMessage || 'Bookings are temporarily unavailable for this field.'}</div>
            </div>
          )}

          {field.description && <p className="mt-6 text-gray-700">{field.description}</p>}

          <div className="mt-8 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 pt-5">
              <div className="flex flex-wrap gap-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`border-b-2 pb-4 text-sm font-semibold transition ${
                      activeTab === tab.key
                        ? 'border-slate-900 text-slate-950'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                    <h2 className="text-xl font-semibold text-slate-950">About This Field</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {field.description || 'This field is ready for bookings, team play, and regular matches.'}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Field Name</div>
                      <div className="mt-2 text-base font-semibold text-slate-950">{field.name || 'Not specified'}</div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Field Type</div>
                      <div className="mt-2 text-base font-semibold capitalize text-slate-950">{field.fieldType || 'Not specified'}</div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Surface Type</div>
                      <div className="mt-2 text-base font-semibold capitalize text-slate-950">
                        {String(field.surfaceType || 'Not specified').replace(/_/g, ' ')}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Price Per Hour</div>
<<<<<<< HEAD
                      <div className="mt-2 text-base font-semibold text-slate-950">${field.pricePerHour || 0}/hour</div>
=======
                      {discountPercent > 0 ? (
                        <div className="mt-2 space-y-1">
                          <div className="text-base font-semibold text-emerald-600">${discountedPrice}/hour</div>
                          <div className="text-sm text-slate-400 line-through">${field.pricePerHour || 0}/hour</div>
                        </div>
                      ) : (
                        <div className="mt-2 text-base font-semibold text-slate-950">${field.pricePerHour || 0}/hour</div>
                      )}
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Discount</div>
                      <div className="mt-2 text-base font-semibold text-slate-950">{discountPercent}%</div>
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Capacity</div>
                      <div className="mt-2 text-base font-semibold text-slate-950">{field.capacity || 'Not specified'} players</div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</div>
                      <div className="mt-2">
<<<<<<< HEAD
                        <Badge tone={field.status === 'available' ? 'green' : 'gray'} className="capitalize">
=======
                        <Badge tone={getStatusTone(field.status)} className="capitalize">
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
                          {field.status || 'unknown'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Full Address</h3>
                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-700">
                      <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {[field.address, field.city, field.province, field.country].filter(Boolean).join(', ') || 'Address not specified'}
                      </span>
                    </div>
                    {(field.latitude || field.longitude) && (
                      <div className="mt-3 text-xs text-slate-500">
                        Coordinates: {field.latitude || '-'}, {field.longitude || '-'}
                      </div>
                    )}
                  </div>

                  {Number.isFinite(Number(field.latitude)) && Number.isFinite(Number(field.longitude)) && (
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Location Map</h2>
                      <div className="mt-3">
                        <FieldLocationMap latitude={field.latitude} longitude={field.longitude} />
                      </div>
                    </div>
                  )}

                  {Array.isArray(field.amenities) && field.amenities.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Amenities</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {field.amenities.map((amenity) => (
                          <Badge key={amenity} tone="gray">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'live-booking' && (
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Live Booking Schedule</h2>
                      <p className="mt-1 text-sm text-gray-600">Visual schedule for this field only. See who is playing when.</p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Select Day</span>
                      <div className="relative">
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          value={scheduleDay}
                          min={formatDayInput(new Date())}
                          onChange={(event) => setScheduleDay(event.target.value)}
                          className="rounded-xl border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
                    {slotsLoading ? (
                      <div className="flex h-24 items-center justify-center">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : (
                      <div>
                        <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Field schedule</div>
                              <div className="mt-1 text-xs text-slate-500">Only this field is shown. Captains can book available slots.</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <span className="h-3 w-3 rounded-sm bg-emerald-600" /> Available
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span className="h-3 w-3 rounded-sm bg-amber-500" /> Pending
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span className="h-3 w-3 rounded-sm bg-red-600" /> Booked
                              </span>
<<<<<<< HEAD
=======
                              <span className="inline-flex items-center gap-1">
                                <span className="h-3 w-3 rounded-sm bg-slate-600" /> Closed
                              </span>
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
                            </div>
                          </div>
                        </div>

                        <div className="flex border-b border-slate-200 bg-blue-600 text-white">
                          <div className="w-24 px-4 py-3 text-sm font-semibold">Time</div>
                          <div className="flex-1 border-l border-white/20 px-4 py-3 text-center">
                            <div className="font-semibold">{field.name}</div>
                            <div className="text-xs opacity-90">{field.fieldType || 'Field'}</div>
                          </div>
                        </div>

                        {slotItems.map((slot) => {
                          const isAvailable = slot.state === 'available';
                          const isPending = slot.state === 'pending';
<<<<<<< HEAD
                          const slotToneClass = isAvailable
                            ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
=======
                          const isClosed = slot.state === 'closed';
                          const slotToneClass = isAvailable
                            ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            : isClosed
                            ? 'bg-slate-600 text-white'
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
                            : isPending
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white';

                          return (
                            <div key={slot.key} className="flex border-b border-slate-200 last:border-b-0">
                              <div className="w-24 px-4 py-3 text-sm font-semibold text-slate-900">{formatHourLabel(slot.hour)}</div>
                              <div className="flex-1 border-l border-slate-200 p-1.5">
                                {isAvailable ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSlotBook(slot.hour)}
<<<<<<< HEAD
                                    className={`flex min-h-[62px] w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-slate-800 transition ${slotToneClass}`}
                                    title={canCreateBooking ? 'Available - click to book' : 'Available slot'}
=======
                                    disabled={!canBookThisField}
                                    className={`flex min-h-[62px] w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-slate-800 transition ${slotToneClass}`}
                                    title={
                                      !canBookThisField
                                        ? 'Field is not available for booking'
                                        : canCreateBooking
                                        ? 'Available - click to book'
                                        : 'Available slot'
                                    }
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
                                  >
                                    <div>
                                      <div className="text-sm font-semibold">{formatSlotRange(slot.hour)}</div>
                                      <div className="mt-1 text-xs text-slate-500">Open for booking on this field.</div>
                                    </div>
                                    <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                                      <ClockIcon className="h-3.5 w-3.5" />
<<<<<<< HEAD
                                      ${field.pricePerHour}/hr
=======
                                      ${discountPercent > 0 ? discountedPrice : field.pricePerHour}/hr
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
                                    </div>
                                  </button>
                                ) : (
                                  <div className={`min-h-[62px] rounded-lg px-3 py-2 transition ${slotToneClass}`}>
<<<<<<< HEAD
                                    <div className="truncate text-sm font-bold">{slot.booking?.team?.name || 'Reserved slot'}</div>
                                    <div className="mt-1 text-xs opacity-90">{formatSlotRange(slot.hour)}</div>
                                    <div className="mt-1 text-xs opacity-90">
                                      {isPending ? 'Pending request on this field.' : 'Confirmed booking on this field.'}
=======
                                    <div className="truncate text-sm font-bold">
                                      {isClosed ? 'Field closed' : slot.booking?.team?.name || 'Reserved slot'}
                                    </div>
                                    <div className="mt-1 text-xs opacity-90">{formatSlotRange(slot.hour)}</div>
                                    <div className="mt-1 text-xs opacity-90">
                                      {isClosed
                                        ? field.closureMessage || 'This field is not accepting bookings right now.'
                                        : isPending
                                        ? 'Pending request on this field.'
                                        : 'Confirmed booking on this field.'}
>>>>>>> bfc700581fa606479e4b6c51bab8bd4dc3459bd0
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comment-rate' && (
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                    <h2 className="text-xl font-semibold text-slate-950">Comment & Rate</h2>
                    <p className="mt-2 text-sm text-slate-600">See field feedback and rating summary for this venue.</p>
                  </div>

                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-slate-950">Reviews will appear here</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Field comments and rating submissions can be shown in this section after review data is connected for this page.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default FieldDetailsPage;
