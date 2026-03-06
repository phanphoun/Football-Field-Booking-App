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
  StarIcon,
  TrophyIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';
import bookingService from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, EmptyState, Spinner } from '../components/ui';

const HERO_IMAGE =
  'https://i.pinimg.com/1200x/a7/3b/e1/a73be158c7884ef379c16e6b14dfc264.jpg';

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
const PRICING_PLANS = [
  {
    name: 'Basic',
    subtitle: 'Perfect for casual games',
    price: 50,
    highlight: false,
    features: ['Standard outdoor field', 'Basic facilities', 'Up to 14 players', 'Regular maintenance', 'Free parking']
  },
  {
    name: 'Premium',
    subtitle: 'Most popular choice',
    price: 80,
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Premium outdoor field',
      'Enhanced facilities',
      'Up to 22 players',
      'Daily maintenance',
      'Free parking',
      'Changing rooms',
      'Shower facilities'
    ]
  },
  {
    name: 'Elite',
    subtitle: 'Professional experience',
    price: 120,
    highlight: false,
    features: [
      'Stadium-quality pitch',
      'Premium facilities',
      'Up to 22 players',
      'Professional maintenance',
      'VIP parking',
      'Luxury changing rooms',
      'Premium showers',
      'Equipment storage',
      'Live streaming setup'
    ]
  }
];
const LIVE_AVAILABILITY_TIMES = ['18:00', '20:00', '09:00', '19:00'];
const LIVE_AVAILABILITY_LABELS = ['Today 6:00 PM', 'Today 8:00 PM', 'Tomorrow 9:00 AM', 'Today 7:00 PM'];
const LIVE_AVAILABILITY_SLOTS = [3, 1, 5, 4];
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
const WORLD_CLASS_FACILITIES = [
  { title: 'Free WiFi', description: 'High-speed internet available', icon: GlobeAltIcon, iconBg: 'bg-blue-100', iconTone: 'text-blue-600' },
  { title: 'Free Parking', description: 'Ample parking space', icon: MapPinIcon, iconBg: 'bg-emerald-100', iconTone: 'text-emerald-600' },
  { title: 'Shower Rooms', description: 'Clean changing facilities', icon: SparklesIcon, iconBg: 'bg-violet-100', iconTone: 'text-violet-600' },
  { title: 'CCTV Security', description: '24/7 surveillance', icon: BuildingOfficeIcon, iconBg: 'bg-red-100', iconTone: 'text-red-600' },
  { title: 'LED Floodlights', description: 'Professional lighting', icon: StarIcon, iconBg: 'bg-amber-100', iconTone: 'text-amber-600' },
  { title: 'Cafeteria', description: 'Snacks & beverages', icon: CreditCardIcon, iconBg: 'bg-orange-100', iconTone: 'text-orange-600' },
  { title: 'First Aid', description: 'Medical assistance ready', icon: CheckCircleIcon, iconBg: 'bg-teal-100', iconTone: 'text-teal-600' },
  { title: 'Air Conditioned', description: 'Climate controlled rooms', icon: BoltIcon, iconBg: 'bg-cyan-100', iconTone: 'text-cyan-600' },
  { title: 'Water Stations', description: 'Free drinking water', icon: TrophyIcon, iconBg: 'bg-indigo-100', iconTone: 'text-indigo-600' },
  { title: 'Spectator Area', description: 'Seating for supporters', icon: UsersIcon, iconBg: 'bg-indigo-100', iconTone: 'text-indigo-600' },
  { title: 'Equipment Rental', description: 'Balls, bibs & gear', icon: BuildingOfficeIcon, iconBg: 'bg-pink-100', iconTone: 'text-pink-600' },
  { title: 'Lounge Area', description: 'Comfortable waiting space', icon: CalendarIcon, iconBg: 'bg-yellow-100', iconTone: 'text-yellow-700' }
];
const PREMIUM_GUARANTEE_ITEMS = [
  { label: 'Daily Maintenance', className: 'bg-emerald-100 text-emerald-700' },
  { label: 'Professional Standards', className: 'bg-blue-100 text-blue-700' },
  { label: 'Safety Certified', className: 'bg-violet-100 text-violet-700' },
  { label: 'Eco Friendly', className: 'bg-amber-100 text-amber-700' }
];
const HOME_STATS = [
  {
    value: '50+',
    label: 'Football Fields',
    icon: MapPinIcon,
    iconTone: 'text-emerald-600',
    iconBg: 'bg-emerald-100'
  },
  {
    value: '10,000+',
    label: 'Active Users',
    icon: UsersIcon,
    iconTone: 'text-blue-600',
    iconBg: 'bg-blue-100'
  },
  {
    value: '25,000+',
    label: 'Bookings Completed',
    icon: TrophyIcon,
    iconTone: 'text-violet-600',
    iconBg: 'bg-violet-100'
  },
  {
    value: '4.9/5',
    label: 'Customer Rating',
    icon: StarIcon,
    iconTone: 'text-amber-500',
    iconBg: 'bg-amber-100'
  }
];

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_FIELD_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%25" height="100%25" fill="%23e5e7eb"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="28">No Field Image</text></svg>';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const scheduleSectionRef = useRef(null);
  const [popularFields, setPopularFields] = useState([]);
  const [popularTeams, setPopularTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSocial, setActiveSocial] = useState('facebook');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));
  const [quickLocation, setQuickLocation] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().slice(0, 10));
  const [quickTimeSlot, setQuickTimeSlot] = useState('Afternoon (12PM - 5PM)');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleFieldsData, setScheduleFieldsData] = useState([]);
  const [scheduleBookingsData, setScheduleBookingsData] = useState([]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [fieldsResponse, teamsResponse] = await Promise.all([
          fieldService.getAllFields({ limit: 12 }),
          teamService.getPublicTeams()
        ]);

        const fields = Array.isArray(fieldsResponse.data) ? fieldsResponse.data : [];
        const teams = Array.isArray(teamsResponse.data) ? teamsResponse.data : [];

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

        const topTeams = [...teams].slice(0, 3);

        setPopularFields(topFields);
        setPopularTeams(topTeams);
      } catch (err) {
        console.error('Failed to load landing data:', err);
        setError('Failed to load landing data');
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
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

<<<<<<< HEAD
  const normalizeImages = (imagesValue) => {
    if (Array.isArray(imagesValue)) return imagesValue;
    if (typeof imagesValue === 'string') {
      try {
        const parsed = JSON.parse(imagesValue);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const resolveFieldImageUrl = (rawImage) => {
    if (!rawImage) return DEFAULT_FIELD_IMAGE;
    if (/^https?:\/\//i.test(rawImage) || /^data:image\//i.test(rawImage)) return rawImage;
    if (String(rawImage).startsWith('/uploads/')) return `${API_ORIGIN}${rawImage}`;
    return rawImage;
  };

=======
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
  }, [selectedDay]);

  const scheduleFields = useMemo(() => {
    if (scheduleFieldsData.length > 0) return scheduleFieldsData;
    return featuredFields.slice(0, 3);
  }, [scheduleFieldsData, featuredFields]);

  const quickLocationOptions = useMemo(() => {
    const source = scheduleFields.length > 0 ? scheduleFields : featuredFields;
    return source
      .map((field) => field?.name)
      .filter(Boolean)
      .slice(0, 8);
  }, [scheduleFields, featuredFields]);

  useEffect(() => {
    if (!quickLocation && quickLocationOptions.length > 0) {
      setQuickLocation(quickLocationOptions[0]);
    }
  }, [quickLocation, quickLocationOptions]);

  const formatHHMM = (value) =>
    new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  const scheduleEvents = useMemo(() => {
    const toneByStatus = {
      confirmed: 'bg-blue-600',
      pending: 'bg-amber-500',
      completed: 'bg-emerald-600'
    };

    return scheduleBookingsData.map((booking) => ({
      id: `bk-${booking.id}`,
      fieldKey: booking.fieldId,
      team: booking.teamName || 'Booked Slot',
      start: formatHHMM(booking.startTime),
      end: formatHHMM(booking.endTime),
      players: booking.players || 22,
      tone: toneByStatus[booking.status] || 'bg-slate-600'
    }));
  }, [scheduleBookingsData]);

  const availableNowCards = useMemo(() => {
    const source = scheduleFields.length > 0 ? scheduleFields : featuredFields;
    return source.slice(0, 4).map((field, index) => ({
      id: field.id,
      name: field.name || `Field ${index + 1}`,
      location: field.address || field.city || 'Sports Complex',
      fieldType: field.fieldType || '11v11',
      surfaceType: String(field.surfaceType || 'artificial_turf').replace('_', ' '),
      pricePerHour: Number(field.pricePerHour || 0),
      nextTime: LIVE_AVAILABILITY_TIMES[index] || '18:00',
      nextLabel: LIVE_AVAILABILITY_LABELS[index] || 'Today 6:00 PM',
      slotsLeft: LIVE_AVAILABILITY_SLOTS[index] || 2
    }));
  }, [scheduleFields, featuredFields]);

  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const timelineStart = toMinutes('08:00');
  const timelineEnd = toMinutes('21:00');
  const timelineDuration = timelineEnd - timelineStart;

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

  const handleQuickSearch = () => {
    const params = new URLSearchParams({
      focus: 'search',
      location: quickLocation || '',
      day: quickDate || '',
      timeSlot: quickTimeSlot || ''
    });
    navigate(`/fields?${params.toString()}`);
  };

  const slotToneClass = (tone) => {
    if (tone === 'limited') return 'border-red-300 bg-red-50 text-red-600';
    if (tone === 'available') return 'border-emerald-300 bg-emerald-50 text-emerald-600';
    if (tone === 'moderate') return 'border-amber-300 bg-amber-50 text-amber-600';
    return 'border-blue-300 bg-blue-50 text-blue-600';
  };

  const handleClaimOffer = (code, preferredTime = '18:00') => {
    const day = quickDate || selectedDay || new Date().toISOString().slice(0, 10);
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


>>>>>>> guest-register-ponmakara
  return (
    <div className="space-y-14">
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-screen overflow-hidden text-white shadow-sm ring-1 ring-black/10">
        <img
          src={HERO_IMAGE}
          alt="Football stadium with soccer ball"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">Book Your Perfect Football Field</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/90 sm:text-2xl">
              Find and reserve the best football fields in your area with easy booking and competitive prices.
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
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <h2 className="text-5xl font-semibold text-slate-900">Quick Booking</h2>
            <p className="mt-3 text-2xl text-slate-600">Find and book your perfect field in seconds</p>
          </div>
<<<<<<< HEAD
        ) : popularFields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularFields.map((field) => (
              <Link
                key={field.id}
                to={`/fields/${field.id}`}
                className="group bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-gray-200 overflow-hidden">
                  <img
                    src={resolveFieldImageUrl(normalizeImages(field.images)[0])}
                    alt={field.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    onError={(e) => {
                      if (e.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                        e.currentTarget.src = DEFAULT_FIELD_IMAGE;
                      }
                    }}
=======

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <MapPinIcon className="h-5 w-5 text-emerald-600" />
                  Location
                </label>
                <select
                  value={quickLocation}
                  onChange={(e) => setQuickLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {quickLocationOptions.length > 0 ? (
                    quickLocationOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  ) : (
                    <option value="">Select location</option>
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <CalendarIcon className="h-5 w-5 text-emerald-600" />
                  Date
                </label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <ClockIcon className="h-5 w-5 text-emerald-600" />
                  Time Slot
                </label>
                <select
                  value={quickTimeSlot}
                  onChange={(e) => setQuickTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option>Morning (8AM - 12PM)</option>
                  <option>Afternoon (12PM - 5PM)</option>
                  <option>Evening (5PM - 9PM)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleQuickSearch}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-lg font-semibold text-white shadow-sm hover:bg-slate-900"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  Search Fields
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 py-12 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 text-center sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">
          {HOME_STATS.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full ${item.iconBg}`}>
                <item.icon className={`h-10 w-10 ${item.iconTone}`} />
              </div>
              <div className="mt-5 text-5xl font-extrabold leading-none">{item.value}</div>
              <div className="mt-3 text-3xl font-medium text-white/90">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-base font-semibold text-violet-600">
              <ArrowTrendingUpIcon className="h-4 w-4" />
              Popular Times
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-900">Most Booked Time Slots</h2>
            <p className="mt-2 text-2xl text-slate-600">See when others are playing and find the best time for your team</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {POPULAR_TIME_SLOTS.map((slot) => (
              <div key={slot.time} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-3xl font-bold text-slate-900">
                  <ClockIcon className="h-6 w-6 text-violet-600" />
                  <span>{slot.time}</span>
                </div>
                <p className="mt-5 text-2xl font-medium text-slate-700">{slot.label}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl text-slate-600">Booking Rate:</span>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-base font-semibold text-violet-600">{slot.rate}%</span>
                </div>

                <div className={`mt-4 rounded-xl border px-4 py-2 text-center text-lg font-semibold ${slotToneClass(slot.tone)}`}>
                  {slot.status}
                </div>

                <div className="mt-4 h-3 w-full rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-violet-600"
                    style={{ width: `${Math.max(10, Math.min(slot.rate, 100))}%` }}
>>>>>>> guest-register-ponmakara
                  />
                </div>

              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xl text-slate-600">
            Pro Tip: Book morning or night sessions for better availability and special rates.
          </p>
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-base font-semibold text-emerald-700">
              <TrophyIcon className="h-4 w-4" />
              Limited Time Offers
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-900">Special Deals & Discounts</h2>
            <p className="mt-2 text-xl text-slate-600">Save more with football-friendly offers and promotional deals.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-500 p-6 text-white shadow-lg">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-5xl font-extrabold">Flash Deal: 50% OFF Tonight!</h3>
                <p className="mt-2 text-xl text-emerald-50">Limited slots available for tonight&apos;s bookings (8PM - 10PM)</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                  <span className="rounded-full bg-white/20 px-3 py-1">Ends in 4h 23m</span>
                  <span className="rounded-full bg-white/20 px-3 py-1">Premium Fields Only</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClaimOffer('FLASH50', '20:00')}
                className="rounded-xl bg-white px-6 py-3 text-lg font-bold text-emerald-700 shadow-sm hover:bg-emerald-100"
              >
                Grab This Deal
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {SPECIAL_OFFERS.map((offer) => (
              <div key={offer.code} className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3">
                    <offer.icon className="h-6 w-6 text-emerald-700" />
                  </div>
                  <span className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-bold text-white">{offer.discount}</span>
                </div>

                <h3 className="mt-4 text-3xl font-bold text-slate-900">{offer.title}</h3>
                <p className="mt-2 text-base text-slate-600">{offer.description}</p>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Validity:</span>
                  <span className="font-semibold text-slate-800">{offer.validity}</span>
                </div>
                <div className="mt-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-3 py-2 text-center">
                  <p className="text-xs text-slate-500">Promo Code:</p>
                  <p className="text-base font-bold tracking-wider text-emerald-700">{offer.code}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleClaimOffer(offer.code, offer.time)}
                  className="mt-4 w-full rounded-xl bg-slate-950 py-2.5 text-base font-semibold text-white hover:bg-slate-900"
                >
                  Claim Offer
                </button>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-center text-lg text-slate-700 shadow-sm">
            Pro Tip: Combine offers with loyalty plans to maximize your football savings.
          </div>
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900">Flexible Pricing Plans</h2>
            <p className="mt-3 text-xl text-slate-600">Choose the perfect field for your team - all with transparent pricing</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
                  plan.highlight ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-emerald-600 px-4 py-1 text-sm font-semibold text-white">
                    {plan.badge}
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-4xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-2 text-lg text-slate-600">{plan.subtitle}</p>
                  <div className="mt-5">
                    <span className="text-6xl font-extrabold text-emerald-600">${plan.price}</span>
                    <span className="ml-1 text-xl text-slate-600">/per hour</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={`${plan.name}-${feature}`} className="flex items-center gap-2 text-base text-slate-700">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/fields?focus=search')}
                  className={`mt-7 w-full rounded-xl border px-4 py-2.5 text-base font-semibold transition ${
                    plan.highlight
                      ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-900'
                      : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-base font-semibold text-emerald-700">
              <BoltIcon className="h-4 w-4" />
              Live Updates
            </span>
            <h2 className="mt-4 text-4xl font-bold text-slate-900">Available Right Now</h2>
            <p className="mt-2 text-xl text-slate-600">Real-time availability - book instantly before slots fill up!</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {availableNowCards.map((field, index) => (
              <div
                key={`live-${field.id}-${index}`}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${
                  index === 1 ? 'border-emerald-500 ring-1 ring-emerald-300' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900">{field.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-base text-slate-500">
                      <MapPinIcon className="h-4 w-4" />
                      {field.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-extrabold text-emerald-600">${field.pricePerHour}/hr</div>
                    {field.slotsLeft <= 1 && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                        Filling Fast
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-sm text-slate-500">Field Size</p>
                    <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-slate-900">
                      <UsersIcon className="h-4 w-4 text-blue-600" />
                      {field.fieldType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Surface Type</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{field.surfaceType}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Next Available</p>
                    <p className="text-2xl font-semibold text-emerald-600">{field.nextLabel}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {field.slotsLeft} slots left
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleBookNow(field, quickDate || selectedDay, field.nextTime)}
                  className="mt-5 w-full rounded-xl bg-slate-950 py-2.5 text-base font-semibold text-white hover:bg-slate-900"
                >
                  Quick Book
                </button>
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

      <section ref={scheduleSectionRef} className="p-6 sm:p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Live Booking Schedule</h2>
          <p className="mt-2 text-lg text-slate-600">Visual timeline of all field bookings - see who&apos;s playing when</p>
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
              <div className="text-sm text-slate-600">Total Bookings</div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/fields')}
              className="rounded-xl bg-white px-5 py-3 text-center shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
                <div className="text-3xl font-bold text-blue-600">{scheduleLoading ? '...' : scheduleFields.length}</div>
              <div className="text-sm text-slate-600">Active Fields</div>
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
            <div className="w-56 p-4 font-semibold">Fields / Time</div>
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${TIME_SLOTS.length}, minmax(64px, 1fr))` }}>
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => navigate(`/fields?day=${selectedDay}&time=${slot}`)}
                  className="border-l border-white/20 px-2 py-4 text-center text-sm font-semibold hover:bg-white/10"
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {scheduleFields.map((field) => {
            const rowEvents = scheduleEvents.filter((event) => Number(event.fieldKey) === Number(field.id));
            return (
              <div key={field.id} className="flex border-b border-slate-200 last:border-b-0">
                <button
                  type="button"
                  onClick={() => handleOpenFieldFromSchedule(field)}
                  className="w-56 p-4 text-left hover:bg-slate-50"
                >
                  <div className="font-semibold text-slate-900">{field.name}</div>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {field.fieldType || 'Outdoor'}
                  </span>
                </button>
                <div className="relative flex-1">
                  <div className="grid h-36" style={{ gridTemplateColumns: `repeat(${TIME_SLOTS.length}, minmax(64px, 1fr))` }}>
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={`${field.id}-${slot}`}
                        type="button"
                        onClick={() => handleTimeSlotClick(field, slot)}
                        className="border-l border-slate-200 hover:bg-slate-50"
                        aria-label={`Open ${field.name} at ${slot}`}
                      />
                    ))}
                  </div>
                  {rowEvents.map((event, index) => {
                    const startPct = ((toMinutes(event.start) - timelineStart) / timelineDuration) * 100;
                    const widthPct = ((toMinutes(event.end) - toMinutes(event.start)) / timelineDuration) * 100;
                    return (
                      <div
                        key={event.id}
                        className={`absolute rounded-xl p-3 text-white shadow-md ${event.tone}`}
                        style={{
                          left: `${startPct}%`,
                          width: `max(${widthPct}%, 120px)`,
                          top: `${10 + index * 8}px`
                        }}
                        onClick={() => handleOpenFieldFromSchedule(field)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenFieldFromSchedule(field);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="truncate text-sm font-bold">{event.team}</div>
                        <div className="mt-1 text-xs">{event.start} - {event.end}</div>
                        <div className="mt-1 text-xs">{event.players} players</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold text-gray-900">Featured Football Fields</h2>
          <p className="mx-auto mt-3 max-w-3xl text-2xl text-gray-600">
            Choose from our premium selection of football fields, each equipped with top-quality facilities
          </p>
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
                  className="group overflow-hidden rounded-2xl bg-white ring-1 ring-gray-300 transition hover:shadow-lg"
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
                      <span className="ml-1 text-xl font-semibold text-gray-700">/session</span>
                    </div>

                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBookNow(field);
                        }}
                        className="w-full rounded-xl bg-slate-950 py-3 text-lg font-semibold text-white hover:bg-slate-900"
                      >
                        Book Now
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-xl bg-gray-500 py-3 text-lg font-semibold text-white"
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

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Why Choose Us</h2>
            <p className="mt-2 text-gray-600">We make football field booking simple, secure, and convenient.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyChooseUs.map((item) => (
              <div
                key={item.title}
                className="group rounded-xl bg-white p-5 text-center ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 transition group-hover:bg-green-600 group-active:bg-green-600">
                  <item.icon className="h-6 w-6 text-green-700 transition group-hover:text-white group-active:text-white" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-2 text-gray-600">Book your football field in four simple steps.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.id} className="rounded-xl border border-green-100 bg-white p-5 text-center">
              <div className="mx-auto relative mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-300 bg-green-50">
                <step.icon className="h-7 w-7 text-green-700" />
                <span className="absolute -right-2 -top-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {step.id}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Popular Teams</h2>
          <Link to="/teams" className="text-sm font-medium text-green-700 hover:text-green-800">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : popularTeams.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {popularTeams.map((team) => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">{team.name}</h3>
                  <Badge tone="gray">{team.memberCount || 0} members</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{team.description || 'Community football team'}</p>
                <p className="mt-3 text-xs text-gray-500">
                  Captain: {team.captain?.firstName || team.captain?.username || 'Unknown'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UsersIcon}
            title="No teams yet"
            description="Captains can create teams after registering."
            actionLabel="Browse Teams"
            onAction={() => (window.location.href = '/teams')}
          />
        )}
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900">World-Class Facilities</h2>
            <p className="mx-auto mt-3 max-w-3xl text-xl text-slate-600">
              Every field comes equipped with premium amenities to enhance your playing experience
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WORLD_CLASS_FACILITIES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg}`}>
                  <item.icon className={`h-7 w-7 ${item.iconTone}`} />
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-base text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="rounded-2xl border border-emerald-200 bg-white px-6 py-8 text-center shadow-sm">
            <h2 className="text-4xl font-bold text-slate-900">Premium Experience Guaranteed</h2>
            <p className="mx-auto mt-3 max-w-4xl text-lg text-slate-600">
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

      <footer className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-black text-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
                  <GlobeAltIcon className="h-7 w-7 text-white" />
                </div>
                <div className="text-3xl font-extrabold tracking-tight">FieldBook</div>
              </div>
              <p className="mt-5 text-base text-slate-300">
                Your trusted platform for booking premium football fields. Easy, fast, and reliable.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold">Quick Links</h3>
              <div className="mt-5 space-y-3 text-lg">
                <Link to="/" className="block text-slate-200 hover:text-white">
                  About Us
                </Link>
                <Link to="/fields" className="block text-slate-200 hover:text-white">
                  Browse Fields
                </Link>
                <Link to="/teams" className="block text-slate-200 hover:text-white">
                  Pricing
                </Link>
                <Link to="/teams" className="block text-slate-200 hover:text-white">
                  FAQs
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold">Contact Us</h3>
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
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  onMouseEnter={() => setActiveSocial('facebook')}
                  onFocus={() => setActiveSocial('facebook')}
                  onTouchStart={() => setActiveSocial('facebook')}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                    activeSocial === 'facebook'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700/35 text-slate-200 hover:bg-slate-600/55'
                  }`}
                >
                  <span className="text-2xl font-semibold leading-none">f</span>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter"
                  onMouseEnter={() => setActiveSocial('twitter')}
                  onFocus={() => setActiveSocial('twitter')}
                  onTouchStart={() => setActiveSocial('twitter')}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                    activeSocial === 'twitter'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700/35 text-slate-200 hover:bg-slate-600/55'
                  }`}
                >
                  <span className="text-2xl font-semibold leading-none">t</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  onMouseEnter={() => setActiveSocial('instagram')}
                  onFocus={() => setActiveSocial('instagram')}
                  onTouchStart={() => setActiveSocial('instagram')}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                    activeSocial === 'instagram'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700/35 text-slate-200 hover:bg-slate-600/55'
                  }`}
                >
                  <span className="text-2xl font-semibold leading-none">i</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xl text-slate-300">
            {`(c) ${new Date().getFullYear()} FieldBook. All rights reserved.`}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
