import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BoltIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  EnvelopeIcon,
  GiftIcon,
  GlobeAltIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  SparklesIcon,
  TrophyIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import bookingService from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { Button, EmptyState, Spinner } from '../components/ui';

const HERO_IMAGES = [
  '/hero-manu.jpg',
  'https://img.freepik.com/premium-photo/soccer-field-background-with-illumination-green-grass-cloudy-sky-european-football-arena-with-white-goal-post-blurred-fans-playground-view-outdoor-sport-championship-match-game-space_497537-4167.jpg',
  'https://4kwallpapers.com/images/walls/thumbs_3t/19432.jpeg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Wembley_Stadium_interior.jpg/1280px-Wembley_Stadium_interior.jpg'
];

const FIELD_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=900&q=80';

const FEATURED_CARD_IMAGES = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Wembley_Stadium_interior.jpg/1280px-Wembley_Stadium_interior.jpg',
  'https://i.pinimg.com/1200x/5c/41/fa/5c41fab583e85303594a8b24ae0132ce.jpg',
  'https://4kwallpapers.com/images/walls/thumbs_3t/19432.jpeg'
];

const FEATURED_FALLBACK_FIELDS = [
  {
    id: 'fallback-1',
    name: 'Premium Outdoor Field',
    address: 'Downtown Sports Complex',
    city: 'Phnom Penh',
    capacity: 22,
    sessionDuration: 90,
    pricePerHour: 80,
    status: 'available',
    images: [
      'https://images.unsplash.com/photo-1509228627152-9cbb192e1400?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'fallback-2',
    name: 'Stadium Football Pitch',
    address: 'City Stadium Arena',
    city: 'Phnom Penh',
    capacity: 22,
    sessionDuration: 90,
    pricePerHour: 120,
    status: 'available',
    images: [
      'https://img.freepik.com/premium-photo/soccer-field-background-with-illumination-green-grass-cloudy-sky-european-football-arena-with-white-goal-post-blurred-fans-playground-view-outdoor-sport-championship-match-game-space_497537-4167.jpg'
    ]
  },
  {
    id: 'fallback-3',
    name: 'Indoor Football Arena',
    address: 'Sports Hub Indoor',
    city: 'Phnom Penh',
    capacity: 14,
    sessionDuration: 60,
    pricePerHour: 100,
    status: 'booked',
    images: [
      'https://4kwallpapers.com/images/walls/thumbs_3t/19436.jpg'
    ]
  },
  {
    id: 'fallback-4',
    name: 'City Center Pitch',
    address: 'Central Sports Park',
    city: 'Phnom Penh',
    capacity: 18,
    sessionDuration: 90,
    pricePerHour: 95,
    status: 'available',
    images: [
      'https://i.pinimg.com/1200x/02/b2/71/02b27138f9d525e29e0d22061e7059e5.jpg'
    ]
  },
  
  {
    id: 'fallback-5',
    name: 'Night Lights Field',
    address: 'North Arena',
    city: 'Phnom Penh',
    capacity: 20,
    sessionDuration: 90,
    pricePerHour: 110,
    status: 'available',
    images: [
      'https://i.pinimg.com/1200x/ea/2c/a5/ea2ca50f12b26c94d819ff8e9cfb3f00.jpg'
    ]
  },
  {
    id: 'fallback-6',
    name: 'Champions Ground',
    address: 'West Stadium',
    city: 'Phnom Penh',
    capacity: 22,
    sessionDuration: 90,
    pricePerHour: 130,
    status: 'booked',
    images: [
      'https://i.pinimg.com/736x/c4/01/be/c401be8ee710e375cc1eda174943b546.jpg'
    ]
  }
  
];

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const POPULAR_TIME_SLOTS = [
  { time: '18:00 - 20:00', label: 'Evening Prime Time', rate: 95, status: 'Limited', tone: 'limited' },
  { time: '08:00 - 10:00', label: 'Morning Session', rate: 65, status: 'Available', tone: 'available' },
  { time: '12:00 - 14:00', label: 'Lunch Break', rate: 75, status: 'Moderate', tone: 'moderate' },
  { time: '20:00 - 22:00', label: 'Night Session', rate: 55, status: 'Available', tone: 'cool' }
];

// Calculate real popular time slots from booking data
const calculatePopularTimeSlots = (bookings) => {
  if (!bookings || bookings.length === 0) {
    return POPULAR_TIME_SLOTS; // Fallback to static data
  }

  const timeSlotCounts = {};
  
  // Count bookings per time slot
  bookings.forEach(booking => {
    if (booking.startTime && booking.status === 'confirmed') {
      // Extract time from datetime string
      const bookingDate = new Date(booking.startTime);
      const hours = bookingDate.getHours();
      const timeSlot = `${hours.toString().padStart(2, '0')}:00`;
      
      // Only count if it's within our TIME_SLOTS range
      if (TIME_SLOTS.includes(timeSlot)) {
        timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + 1;
      }
    }
  });

  // Calculate popularity for each time slot
  const popularSlots = TIME_SLOTS.map((time, index) => {
    const count = timeSlotCounts[time] || 0;
    const rate = Math.round((count / Math.max(bookings.filter(b => b.status === 'confirmed').length, 1)) * 100);
    
    let status = 'Available';
    let tone = 'available';
    
    if (rate >= 80) {
      status = 'Limited';
      tone = 'limited';
    } else if (rate >= 60) {
      status = 'Moderate';
      tone = 'moderate';
    } else if (rate >= 40) {
      status = 'Available';
      tone = 'available';
    } else {
      status = 'Cool';
      tone = 'cool';
    }

    // Create time range
    const hour = parseInt(time.split(':')[0]);
    const endHour = hour + 2;
    const endTime = endHour.toString().padStart(2, '0') + ':00';
    
    return {
      time: `${time} - ${endTime}`,
      label: getTimeLabel(hour),
      rate: Math.min(rate, 95), // Cap at 95%
      status,
      tone
    };
  });

  // Sort by rate and return top 4
  return popularSlots
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 4);
};

const getTimeLabel = (hour) => {
  if (hour >= 17 && hour <= 20) return 'Evening Prime Time';
  if (hour >= 6 && hour <= 10) return 'Morning Session';
  if (hour >= 11 && hour <= 14) return 'Lunch Break';
  if (hour >= 20 || hour <= 5) return 'Night Session';
  return 'Afternoon Session';
};
const SPECIAL_OFFERS = [
  {
    title: 'Early Bird Special',
    description: 'Book morning slots (6AM - 10AM) and save big!',
    discount: '30% OFF',
    validity: 'Valid Mon-Fri',
    code: 'EARLY30',
    icon: ClockIcon,
    time: '08:00'
  },
  {
    title: 'Weekend Warrior',
    description: 'Book 3+ hours on weekends and get instant discount.',
    discount: '20% OFF',
    validity: 'Sat-Sun Only',
    code: 'WEEKEND20',
    icon: UsersIcon,
    time: '18:00'
  },
  {
    title: 'First-Time Bonus',
    description: 'New customer? Get 25% off your first booking!',
    discount: '25% OFF',
    validity: 'New Users Only',
    code: 'WELCOME25',
    icon: GiftIcon,
    time: '19:00'
  },
  {
    title: 'Monthly Member',
    description: 'Subscribe to monthly plans and enjoy exclusive rates.',
    discount: 'Up to 40% OFF',
    validity: 'Subscription',
    code: 'MEMBER40',
    icon: SparklesIcon,
    time: '20:00'
  }
];
const PREMIUM_GUARANTEE_ITEMS = [
  { label: 'Daily Maintenance', className: 'bg-emerald-100 text-emerald-700' },
  { label: 'Professional Standards', className: 'bg-blue-100 text-blue-700' },
  { label: 'Safety Certified', className: 'bg-violet-100 text-violet-700' },
  { label: 'Eco Friendly', className: 'bg-amber-100 text-amber-700' }
];
const SCHEDULE_ROW_HEIGHT_CLASS = 'h-16';
const toLocalDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const parseSlotToMinutes = (slot) => {
  const [h, m] = String(slot || '')
    .split(':')
    .map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};
const isBookingActiveOnSchedule = (booking) =>
  booking?.status !== 'cancelled' && booking?.status !== 'completed';
const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const scheduleSectionRef = useRef(null);
  const [popularFields, setPopularFields] = useState([]);
  const [popularTimeSlots, setPopularTimeSlots] = useState(POPULAR_TIME_SLOTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(toLocalDateKey(new Date()));
  const [quickDate] = useState(toLocalDateKey(new Date()));
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleFieldsData, setScheduleFieldsData] = useState([]);
  const [scheduleBookingsData, setScheduleBookingsData] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [fieldsResult, bookingsResult] = await Promise.allSettled([
          fieldService.getAllFields({ limit: 12 }),
          bookingService.getPublicBookingStats({
            lookbackDays: 30,
            top: 4,
            statuses: 'confirmed,completed',
            timezoneOffsetMinutes: new Date().getTimezoneOffset()
          })
        ]);

        const fieldsResponse = fieldsResult.status === 'fulfilled' ? fieldsResult.value : null;
        const bookingsResponse = bookingsResult.status === 'fulfilled' ? bookingsResult.value : { success: false, data: {} };

        const fields = Array.isArray(fieldsResponse?.data) ? fieldsResponse.data : [];
        const slotStats = bookingsResponse?.success && Array.isArray(bookingsResponse?.data?.timeSlots)
          ? bookingsResponse.data.timeSlots
          : [];
        const bookings = bookingsResponse?.success && Array.isArray(bookingsResponse?.data) ? bookingsResponse.data : [];

        const topFields = [...fields]
          .sort((a, b) => {
            const ratingA = Number(a.rating || 0);
            const ratingB = Number(b.rating || 0);
            const totalA = Number(a.totalRatings || 0);
            const totalB = Number(b.totalRatings || 0);
            if (ratingB !== ratingA) return ratingB - ratingA;
            return totalB - totalA;
          })
          .slice(0, 6);

        // Use server-side aggregation as source of truth; fallback to client calculation if needed.
        if (slotStats.length > 0) {
          setPopularTimeSlots(slotStats);
        } else {
          const calculatedPopularSlots = calculatePopularTimeSlots(bookings);
          setPopularTimeSlots(calculatedPopularSlots);
        }

        setPopularFields(topFields);

        // Show page with partial data when stats fail; field data is required.
        if (fieldsResult.status === 'rejected') {
          throw new Error('Landing field request failed');
        }
      } catch (err) {
        console.error('Failed to load landing data:', err);
        setError('Failed to load landing data');
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  const whyChooseUs = useMemo(
    () => [
      { title: 'Easy Booking', description: 'Reserve your field in a few clicks with clear schedules.', icon: CalendarIcon },
      { title: 'Secure Payment', description: 'Reliable and secure transactions for every booking.', icon: CreditCardIcon },
      { title: 'Flexible Hours', description: 'Morning to night slots for casual or competitive matches.', icon: ClockIcon },
      { title: 'Best Prices', description: 'Transparent pricing with competitive rates from owners.', icon: TrophyIcon },
      { title: 'Team Friendly', description: 'Build teams, invite players, and organize faster.', icon: UsersIcon },
      { title: 'Premium Facilities', description: 'Discover fields with quality turf and useful amenities.', icon: BuildingOfficeIcon }
    ],
    []
  );

  const steps = useMemo(
    () => [
      { id: '01', title: 'Browse Fields', description: 'Explore available football fields and compare options.', icon: MagnifyingGlassIcon },
      { id: '02', title: 'Select Date & Time', description: 'Pick a slot that fits your team schedule.', icon: CalendarIcon },
      { id: '03', title: 'Confirm Booking', description: 'Submit and receive booking confirmation quickly.', icon: CheckCircleIcon },
      { id: '04', title: 'Play Your Game', description: 'Arrive, play, and enjoy your match.', icon: TrophyIcon }
    ],
    []
  );

  const featuredFields = useMemo(() => {
    const merged = [...popularFields];
    for (let i = merged.length; i < 6; i += 1) {
      merged.push(FEATURED_FALLBACK_FIELDS[i]);
    }
    return merged.slice(0, 6);
  }, [popularFields]);

  const scheduleDays = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    return Array.from({ length: 6 }).map((_, index) => {
      const day = new Date(base);
      day.setDate(base.getDate() + index);
      const key = day.toISOString().slice(0, 10);
      const label =
        index === 0
          ? 'Today'
          : index === 1
            ? 'Tomorrow'
            : `${String(day.getDate()).padStart(2, '0')} ${day.toLocaleDateString('en-US', { weekday: 'short' })}`;

      return { key, label };
    });
  }, []);

  const resolveFieldImage = (images) => {
    if (Array.isArray(images) && images.length > 0) return images[0];

    if (typeof images === 'string') {
      // Handle JSON string values saved by backend like: '["https://..."]'
      if (images.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        } catch (_e) {
          // fall through
        }
      }
      // Handle direct URL string values
      if (images.startsWith('http://') || images.startsWith('https://')) return images;
    }

    return FIELD_FALLBACK_IMAGE;
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setScheduleLoading(true);
        if (isAuthenticated) {
          const scheduleResponse = await bookingService.getSchedule(selectedDay);
          const payload = scheduleResponse.data || {};
          const fields = Array.isArray(payload.fields) ? payload.fields : [];
          const bookings = Array.isArray(payload.bookings) ? payload.bookings : [];
          setScheduleFieldsData(fields);
          setScheduleBookingsData(bookings);
          return;
        }

        const response = await bookingService.getPublicSchedule(selectedDay, 6);
        const payload = response.data || {};
        const fields = Array.isArray(payload.fields) ? payload.fields : [];
        const bookings = Array.isArray(payload.bookings) ? payload.bookings : [];
        setScheduleFieldsData(fields);
        setScheduleBookingsData(bookings);
      } catch (err) {
        console.error('Failed to load public schedule:', err);
        setScheduleFieldsData([]);
        setScheduleBookingsData([]);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, [isAuthenticated, selectedDay]);

  const scheduleFields = useMemo(() => {
    if (scheduleFieldsData.length > 0) return scheduleFieldsData;
    return featuredFields.slice(0, 3);
  }, [scheduleFieldsData, featuredFields]);
  const scheduleTableMinWidth = `${Math.max(scheduleFields.length, 1) * 170 + 96}px`;

  const formatHHMM = (value) =>
    new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  const scheduleEvents = useMemo(() => {
    return scheduleBookingsData
      .filter((booking) => isBookingActiveOnSchedule(booking))
      .map((booking) => {
        const start = formatHHMM(booking.startTime);
        const end = formatHHMM(booking.endTime);
        const isOwnBooking =
          Number(booking?.createdBy) === Number(user?.id) ||
          Number(booking?.team?.captainId) === Number(user?.id);

        return {
          id: `bk-${booking.id}`,
          bookingId: booking.id,
          status: booking.status,
          fieldKey: booking.fieldId,
          team: booking.teamName || booking?.team?.name || 'Booked Slot',
          start,
          end,
          startMinutes: parseSlotToMinutes(start),
          endMinutes: parseSlotToMinutes(end),
          players: booking.players || booking?.team?.teamMembers?.length || 22,
          isOwnBooking,
          tone:
            booking.status === 'pending'
              ? 'bg-amber-500'
              : isOwnBooking
              ? 'bg-emerald-600'
              : 'bg-red-600'
        };
      });
  }, [scheduleBookingsData, user?.id]);

  const availableNowCards = useMemo(() => {
    const source = scheduleFields.length > 0 ? scheduleFields : featuredFields;
    const today = new Date();
    const currentTime = today.getHours() * 60 + today.getMinutes();
    
    return source.slice(0, 4).map((field, index) => {
      // Calculate real availability based on current time and schedule
      let nextAvailableTime = null;
      let slotsLeft = 0;
      
      // Find next available time slot
      for (const timeSlot of TIME_SLOTS) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotTime = hours * 60 + minutes;
        
        // Check if this slot is in the future and available
        if (slotTime > currentTime) {
          const isBooked = scheduleEvents.some(event => 
            event.start === timeSlot && 
            Number(event.fieldKey) === Number(field.id) &&
            event.status === 'confirmed'
          );
          
          if (!isBooked) {
            nextAvailableTime = timeSlot;
            // Count remaining available slots for this field
            slotsLeft = TIME_SLOTS.filter(slot => {
              const [h, m] = slot.split(':').map(Number);
              const slotTimeMinutes = h * 60 + m;
              return slotTimeMinutes > currentTime && 
                     !scheduleEvents.some(event => 
                       event.start === slot && 
                       Number(event.fieldKey) === Number(field.id) &&
                       event.status === 'confirmed'
                     );
            }).length;
            break;
          }
        }
      }
      
      // If no available slots today, show tomorrow's first slot
      if (!nextAvailableTime) {
        nextAvailableTime = TIME_SLOTS[0]; // First slot tomorrow
        slotsLeft = TIME_SLOTS.length; // All slots available tomorrow
      }
      
      // Create time label
      const hour = parseInt(nextAvailableTime.split(':')[0]);
      const timeLabel = hour >= 12 ? 
        `Today ${hour === 12 ? 12 : hour - 12}:${nextAvailableTime.split(':')[1]} ${hour >= 12 ? 'PM' : 'AM'}` :
        `Today ${hour}:${nextAvailableTime.split(':')[1]} AM`;
      
      return {
        id: field.id,
        name: field.name || `Field ${index + 1}`,
        location: field.address || field.city || 'Sports Complex',
        fieldType: field.fieldType || '11v11',
        surfaceType: String(field.surfaceType || 'artificial_turf').replace('_', ' '),
        pricePerHour: Number(field.pricePerHour || 0),
        nextTime: nextAvailableTime,
        nextLabel: timeLabel,
        slotsLeft: slotsLeft
      };
    });
  }, [scheduleFields, featuredFields, scheduleEvents]);

  const getDayIndex = (dayKey) => scheduleDays.findIndex((day) => day.key === dayKey);

  const toFieldRoute = (field) => {
    if (!field) return '/fields';
    return String(field.id).startsWith('fallback-') ? '/fields' : `/fields/${field.id}`;
  };

  const handlePrevDay = () => {
    const currentIndex = getDayIndex(selectedDay);
    const nextIndex = currentIndex <= 0 ? scheduleDays.length - 1 : currentIndex - 1;
    setSelectedDay(scheduleDays[nextIndex].key);
  };

  const handleNextDay = () => {
    const currentIndex = getDayIndex(selectedDay);
    const nextIndex = currentIndex >= scheduleDays.length - 1 ? 0 : currentIndex + 1;
    setSelectedDay(scheduleDays[nextIndex].key);
  };

  const handleOpenFieldFromSchedule = (field) => {
    navigate(toFieldRoute(field));
  };

  const buildBookingPath = (field, day = null, time = null) => {
    const params = new URLSearchParams({ fieldId: String(field.id) });
    if (day) params.set('day', day);
    if (time) params.set('time', time);
    return `/app/bookings/new?${params.toString()}`;
  };

  const handleBookNow = (field, day = null, time = null) => {
    if (!field || String(field.id).startsWith('fallback-')) {
      navigate('/fields');
      return;
    }

    const bookingPath = buildBookingPath(field, day, time);

    if (!isAuthenticated) {
      navigate('/login', { state: { from: bookingPath } });
      return;
    }

    navigate(bookingPath);
  };

  const handleTimeSlotClick = (field, slot) => {
    handleBookNow(field, selectedDay, slot);
  };
  const slotToneClass = (tone) => {
    if (tone === 'limited') return 'border-red-300 bg-red-50 text-red-600';
    if (tone === 'available') return 'border-emerald-300 bg-emerald-50 text-emerald-600';
    if (tone === 'moderate') return 'border-amber-300 bg-amber-50 text-amber-600';
    return 'border-blue-300 bg-blue-50 text-blue-600';
  };

  const handleClaimOffer = (code, preferredTime = '18:00') => {
    const day = quickDate || selectedDay || toLocalDateKey(new Date());
    const preferredField = scheduleFields.find((f) => !String(f?.id || '').startsWith('fallback-'));

    if (preferredField) {
      handleBookNow(preferredField, day, preferredTime);
      return;
    }

    const params = new URLSearchParams({
      focus: 'search',
      promo: code,
      day,
      time: preferredTime
    });
    navigate(`/fields?${params.toString()}`);
  };
  return (
    <div className="flex flex-col gap-14 bg-gradient-to-b from-emerald-50/70 via-white to-sky-50/40">
      <section className="order-1 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-screen overflow-hidden text-white shadow-sm ring-1 ring-black/10">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="flex h-full w-full transition-transform duration-700 ease-in-out"
            style={{
              width: `${HERO_IMAGES.length * 100}%`,
              transform: `translateX(-${heroIndex * (100 / HERO_IMAGES.length)}%)`
            }}
          >
            {HERO_IMAGES.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`Football stadium background ${index + 1}`}
                className="h-full w-full flex-shrink-0 object-cover object-center"
                style={{ width: `${100 / HERO_IMAGES.length}%` }}
                onError={(e) => {
                  if (e.currentTarget.dataset.fallbackApplied !== 'true') {
                    e.currentTarget.dataset.fallbackApplied = 'true';
                    e.currentTarget.src = HERO_IMAGES[0];
                  }
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/65" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">Book the Perfect Football Field in Minutes</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/90 sm:text-2xl">
              Discover top-rated pitches near you, check live availability, and secure your slot at the best price.
            </p>
            <div className="mt-8 mx-auto grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                as={Link}
                to="/app/bookings/new"
                className="justify-center rounded-md border-2 border-emerald-300 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700"
              >
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                Book a Field
              </Button>

              <Button
                as={Link}
                to="/fields?focus=search"
                className="justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700"
              >
                Browse Fields
              </Button>

              <Button
                as={Link}
                to="/register"
                variant="neutral"
                className="justify-center rounded-md border border-white/30 bg-white/15 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/25"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-8 z-20">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/30 bg-black/25 px-3 py-2 backdrop-blur-sm">
            <button
              type="button"
              aria-label="Previous hero image"
              onClick={() => setHeroIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)}
              className="rounded-full border border-white/45 bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {HERO_IMAGES.map((_, index) => (
                <button
                  key={`hero-dot-${index}`}
                  type="button"
                  aria-label={`Go to hero image ${index + 1}`}
                  onClick={() => setHeroIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    heroIndex === index ? 'w-8 bg-emerald-400' : 'w-2.5 bg-white/70 hover:bg-white'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next hero image"
              onClick={() => setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length)}
              className="rounded-full border border-white/45 bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="order-5 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-gradient-to-b from-white to-emerald-50/60 py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              <ArrowTrendingUpIcon className="h-4 w-4" />
              Popular Times
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Most Booked Time Slots</h2>
            <p className="mt-2 text-base text-slate-600">See when others are playing and find the best time for your team</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {popularTimeSlots.map((slot) => (
              <div key={slot.time} className="group rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <ClockIcon className="h-6 w-6 text-emerald-600" />
                  <span>{slot.time}</span>
                </div>
                <p className="mt-5 text-xl font-medium text-slate-700">{slot.label}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-base text-slate-600">Booking Rate:</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{slot.rate}%</span>
                </div>

                <div className={`mt-4 rounded-xl border px-4 py-2 text-center text-base font-semibold ${slotToneClass(slot.tone)}`}>
                  {slot.status}
                </div>

                <div className="mt-4 h-3 w-full rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{ width: `${Math.max(10, Math.min(slot.rate, 100))}%` }}
                  />
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      <section className="order-7 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-gradient-to-b from-emerald-50/40 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              <TrophyIcon className="h-4 w-4" />
              Limited Time Offers
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Special Deals & Discounts</h2>
            <p className="mt-2 text-base text-slate-600">Save more with football-friendly offers and promotional deals.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-500 p-6 text-white shadow-lg">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-4xl font-extrabold">Flash Deal: 50% OFF Tonight!</h3>
                <p className="mt-2 text-base text-emerald-50">Limited slots available for tonight&apos;s bookings (8PM - 10PM)</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                  <span className="rounded-full bg-white/20 px-3 py-1">Ends in 4h 23m</span>
                  <span className="rounded-full bg-white/20 px-3 py-1">Premium Fields Only</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClaimOffer('FLASH50', '20:00')}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Grab This Deal
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {SPECIAL_OFFERS.map((offer) => (
              <div key={offer.code} className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3">
                    <offer.icon className="h-6 w-6 text-emerald-700" />
                  </div>
                  <span className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">{offer.discount}</span>
                </div>

                <h3 className="mt-4 text-2xl font-bold text-slate-900">{offer.title}</h3>
                <p className="mt-2 text-base text-slate-600">{offer.description}</p>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Validity:</span>
                  <span className="font-semibold text-slate-800">{offer.validity}</span>
                </div>
                <div className="mt-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-3 py-2 text-center">
                  <p className="text-xs text-slate-500">Promo Code:</p>
                  <p className="text-sm font-bold tracking-wider text-emerald-700">{offer.code}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleClaimOffer(offer.code, offer.time)}
                  className="mt-4 w-full rounded-xl bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Claim Offer
                </button>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-center text-sm text-slate-700 shadow-sm">
            Pro Tip: Combine offers with loyalty plans to maximize your football savings.
          </div>
        </div>
      </section>

      <section className="order-6 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-gradient-to-b from-white to-sky-50/50 py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-base font-semibold text-emerald-700">
              <BoltIcon className="h-4 w-4" />
              Live Updates
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Available Right Now</h2>
            <p className="mt-2 text-base text-slate-600">Real-time availability - book instantly before slots fill up!</p>
          </div>

          <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-4">
            {availableNowCards.map((field, index) => (
              <div
                key={`live-${field.id}-${index}`}
                className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-2xl font-bold text-slate-900">{field.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <MapPinIcon className="h-4 w-4" />
                      {field.location}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                        <UsersIcon className="h-3.5 w-3.5 text-blue-600" />
                        {field.fieldType}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                        {field.surfaceType}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                        {field.slotsLeft} slots left
                      </span>
                    </div>
                  </div>

                  <div className="flex min-w-[150px] flex-col items-start gap-2 md:items-end">
                    <div className="text-3xl font-extrabold text-emerald-600">${field.pricePerHour}/hr</div>
                    <p className="text-sm font-semibold text-emerald-700">{field.nextLabel}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        field.slotsLeft <= 1 ? 'bg-red-100 text-red-600' : 'invisible'
                      }`}
                    >
                      Filling Fast
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBookNow(field, quickDate || selectedDay, field.nextTime)}
                      className="mt-1 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-emerald-700 hover:to-green-700"
                    >
                      Quick Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate('/fields?focus=search')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-base font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              View All Available Fields
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">24 more</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Booking Schedule - Only visible to authenticated users */}
      {isAuthenticated && (
        <>
        <section ref={scheduleSectionRef} className="order-4 p-6 sm:p-8">
          <div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Live Booking Schedule</h2>
              <p className="mt-2 text-base text-slate-600">Visual timeline of all field bookings - see who&apos;s playing when</p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={handlePrevDay} className="rounded-xl p-2 text-slate-500 hover:bg-white">
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex flex-wrap gap-2">
                  {scheduleDays.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setSelectedDay(day.key)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        selectedDay === day.key
                          ? 'border-slate-800 bg-white text-slate-900'
                          : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={handleNextDay} className="rounded-xl p-2 text-slate-500 hover:bg-white">
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/app/bookings')}
                  className="rounded-xl bg-white px-5 py-3 text-center shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <div className="text-3xl font-bold text-emerald-600">{scheduleLoading ? '...' : scheduleEvents.length}</div>
                  <div className="text-base text-slate-600">Total Bookings</div>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/fields')}
                  className="rounded-xl bg-white px-5 py-3 text-center shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <div className="text-3xl font-bold text-blue-600">{scheduleLoading ? '...' : scheduleFields.length}</div>
                  <div className="text-base text-slate-600">Active Fields</div>
                </button>
              </div>
            </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <div style={{ minWidth: scheduleTableMinWidth }}>
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-800">Color guide:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-emerald-600" /> Your booking
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-red-600" /> Other team (blocked)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded-sm bg-amber-500" /> Pending (still bookable)
                </span>
              </div>
            </div>
            <div className="flex border-b border-slate-200 bg-blue-600 text-white">
              <div className="w-24 p-4 font-semibold">Time</div>
              <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${scheduleFields.length}, minmax(120px, 1fr))` }}>
                {scheduleFields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => handleOpenFieldFromSchedule(field)}
                    className="border-l border-white/20 px-2 py-4 text-center text-sm font-semibold hover:bg-white/10"
                  >
                    <div className="font-semibold">{field.name}</div>
                    <div className="text-xs opacity-90">{field.fieldType || 'Outdoor'}</div>
                  </button>
                ))}
              </div>
            </div>

            {TIME_SLOTS.map((slot) => {
              const slotEventsForAllFields = scheduleEvents.filter((event) => event.start === slot);
              return (
                <div key={slot} className="flex border-b border-slate-200 last:border-b-0">
                  <div className={`w-24 p-2.5 text-left font-semibold text-slate-900 ${SCHEDULE_ROW_HEIGHT_CLASS}`}>
                    {slot}
                  </div>
                  <div className="relative flex-1">
                    <div className={`grid ${SCHEDULE_ROW_HEIGHT_CLASS}`} style={{ gridTemplateColumns: `repeat(${scheduleFields.length}, minmax(120px, 1fr))` }}>
                      {scheduleFields.map((field) => {
                        const rowEvents = slotEventsForAllFields.filter((event) => Number(event.fieldKey) === Number(field.id));
                        const slotOwnEvent = rowEvents.find((event) => event.isOwnBooking);
                        const slotOtherConfirmedEvent = rowEvents.find(
                          (event) => !event.isOwnBooking && event.status === 'confirmed'
                        );
                        const slotOtherPendingEvent = rowEvents.find(
                          (event) => !event.isOwnBooking && event.status === 'pending'
                        );
                        const slotTakenByOther = Boolean(slotOtherConfirmedEvent);
                        const slotTakenByMe = Boolean(slotOwnEvent);
                        const slotHasOtherPending = Boolean(slotOtherPendingEvent);

                        // If there's a booking, show a colored block
                        if (slotTakenByMe || slotTakenByOther || slotHasOtherPending) {
                          return (
                            <div
                              key={`${field.id}-${slot}`}
                              className={`m-1 rounded-lg px-2 py-1 text-xs font-medium text-white cursor-pointer transition-colors ${
                                slotTakenByMe
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : slotTakenByOther
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-amber-500 hover:bg-amber-600'
                              }`}
                              onClick={() => slotTakenByMe ? navigate('/app/bookings') : handleOpenFieldFromSchedule(field)}
                              title={slotTakenByMe
                                ? 'Your booking - click to track'
                                : slotTakenByOther
                                ? `${slotOtherConfirmedEvent.team} - Click to view field`
                                : `${slotOtherPendingEvent.team} - Pending request`
                              }
                            >
                              <div className="truncate font-bold">
                                {slotTakenByMe ? slotOwnEvent.team : 
                                 slotTakenByOther ? slotOtherConfirmedEvent.team : 
                                 slotOtherPendingEvent.team}
                              </div>
                              <div className="text-xs opacity-90">
                                {slotTakenByMe ? slotOwnEvent.start + ' - ' + slotOwnEvent.end : 
                                 slotTakenByOther ? slotOtherConfirmedEvent.start + ' - ' + slotOtherConfirmedEvent.end : 
                                 slotOtherPendingEvent.start + ' - ' + slotOtherPendingEvent.end}
                              </div>
                            </div>
                          );
                        }

                        // If no booking, show empty cell
                        return (
                          <div
                            key={`${field.id}-${slot}`}
                            className="m-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                            onClick={() => handleTimeSlotClick(field, slot)}
                            title="Available - click to book"
                          >
                            {/* Empty cell - just shows the time slot background */}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
        </section>
        </>
      )}

      <section className="order-3 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-gradient-to-b from-white to-emerald-50/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Featured Football Fields</h2>
          <p className="mt-2 text-base text-gray-600">Choose from our premium selection of football fields, each equipped with top-quality facilities</p>
          </div>

          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : featuredFields.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featuredFields.map((field, index) => {
              const isAvailable = (field.status || 'available') === 'available';
              const players = field.capacity || 22;
              const duration = field.sessionDuration || 90;
              const price = Number(field.pricePerHour || 0);
              const preferredImage = FEATURED_CARD_IMAGES[index % FEATURED_CARD_IMAGES.length];
              const initialImage = resolveFieldImage(field.images) || preferredImage;

              return (
                <Link
                  key={field.id}
                  to={String(field.id).startsWith('fallback-') ? '/fields' : `/fields/${field.id}`}
                  className="group overflow-hidden rounded-2xl bg-white ring-1 ring-emerald-100 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-200">
                    <img
                      src={initialImage}
                      alt={field.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = preferredImage || FIELD_FALLBACK_IMAGE;
                      }}
                    />
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Booked'}
                    </span>
                  </div>

                  <div className="space-y-4 p-6">
                    <h3 className="text-2xl font-semibold text-gray-900">{field.name}</h3>

                    <div className="flex items-center gap-2 text-base text-gray-600">
                      <MapPinIcon className="h-5 w-5" />
                      <span>{field.city || field.address || 'City Stadium Arena'}</span>
                    </div>

                    <div className="flex items-center justify-between text-base text-gray-700">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5" />
                        <span>{players} players</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" />
                        <span>{duration} min</span>
                      </div>
                    </div>

                    <div className="text-4xl font-bold leading-none text-green-600">
                      ${Number.isFinite(price) ? price.toFixed(0) : 0}
                      <span className="ml-1 text-xl font-semibold text-green-700">/session</span>
                    </div>

                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBookNow(field);
                        }}
                        className="w-full rounded-xl bg-emerald-600 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        Book Now
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-xl bg-emerald-500 py-2 text-base font-semibold text-white"
                      >
                        Fully Booked
                      </button>
                    )}
                  </div>
                </Link>
              );
              })}
            </div>
          ) : (
            <EmptyState
              icon={BuildingOfficeIcon}
              title="No fields yet"
              description="Once owners add fields, they will appear here for guests."
              actionLabel="Browse Fields"
              onAction={() => (window.location.href = '/fields')}
            />
          )}
        </div>
      </section>

      <section className="order-8 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-gradient-to-b from-sky-50/40 to-white py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Why Choose Us</h2>
            <p className="mt-2 text-gray-600">We make football field booking simple, secure, and convenient.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyChooseUs.map((item) => (
              <div
                key={item.title}
                className="group rounded-xl bg-white p-5 text-center ring-1 ring-emerald-100 transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.99]"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 transition group-hover:bg-green-600 group-active:bg-green-600">
                  <item.icon className="h-6 w-6 text-green-700 transition group-hover:text-white group-active:text-white" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-base text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="order-9 rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-2 text-gray-600">Book your football field in four simple steps.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.id} className="rounded-xl border border-green-100 bg-white p-5 text-center transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mx-auto relative mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-300 bg-green-50">
                <step.icon className="h-7 w-7 text-green-700" />
                <span className="absolute -right-2 -top-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {step.id}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-base text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="order-12 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-gradient-to-b from-white to-emerald-50/50 py-8">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="rounded-2xl border border-emerald-200 bg-white px-6 py-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Premium Experience Guaranteed</h2>
            <p className="mx-auto mt-3 max-w-4xl text-base text-slate-600">
              All our facilities are regularly maintained and sanitized. We ensure the highest standards of cleanliness and
              safety for all our customers. Every field is inspected daily and meets professional football standards.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {PREMIUM_GUARANTEE_ITEMS.map((item) => (
                <span key={item.label} className={`rounded-md px-4 py-2 text-sm font-semibold ${item.className}`}>
                  {`✓ ${item.label}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="order-last !mt-0 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-black text-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
                  <GlobeAltIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-4xl font-extrabold tracking-tight">FieldBook</div>
              </div>
              <p className="mt-5 max-w-xs text-base text-slate-300">
                Your trusted platform for booking premium football fields. Easy, fast, and reliable.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white">Quick Links</h3>
              <div className="mt-5 space-y-3 text-lg">
                <Link to="/" className="block text-slate-200 hover:text-white">About Us</Link>
                <Link to="/fields" className="block text-slate-200 hover:text-white">Browse Fields</Link>
                <Link to="/teams" className="block text-slate-200 hover:text-white">Pricing</Link>
                <Link to="/teams" className="block text-slate-200 hover:text-white">FAQs</Link>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white">Contact Us</h3>
              <div className="mt-5 space-y-4 text-lg text-slate-200">
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-slate-300" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-slate-300" />
                  <span>info@fieldbook.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPinIcon className="h-5 w-5 text-slate-300" />
                  <span>123 Sports Ave, City</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white">Follow Us</h3>
              <div className="mt-5 flex items-center gap-3">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                  <span className="text-2xl font-semibold leading-none">f</span>
                </a>
                <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700">
                  <span className="text-2xl font-semibold leading-none">t</span>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700">
                  <span className="text-2xl font-semibold leading-none">i</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;





