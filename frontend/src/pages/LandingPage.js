import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  TrophyIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';
import { Badge, Button, EmptyState, Spinner } from '../components/ui';

const HERO_IMAGE =
  'https://img.freepik.com/free-photo/close-up-sport-environment-with-soccer-ball_23-2151891105.jpg?semt=ais_user_personalization&w=740&q=80';

const FIELD_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=900&q=80';

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
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80'
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
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80'
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
      'https://images.unsplash.com/photo-1628891890467-b79de9b4fce8?auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

const LandingPage = () => {
  const [popularFields, setPopularFields] = useState([]);
  const [popularTeams, setPopularTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          .slice(0, 3);

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
    for (let i = merged.length; i < 3; i += 1) {
      merged.push(FEATURED_FALLBACK_FIELDS[i]);
    }
    return merged.slice(0, 3);
  }, [popularFields]);

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
            <Badge tone="green" className="bg-green-500/25 text-white ring-1 ring-green-300/40">
              Guest browsing and role-based dashboards
            </Badge>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">Book Your Perfect Football Field</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/90 sm:text-2xl">
              Find and reserve the best football fields in your area with easy booking and competitive prices.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button as={Link} to="/fields" className="bg-green-600 hover:bg-green-700">
                Browse Fields
              </Button>
              <Button as={Link} to="/fields" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Check Availability
              </Button>
              <Button as={Link} to="/register" variant="neutral" className="bg-white/15 text-white hover:bg-white/25">
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
              {featuredFields.map((field) => {
              const isAvailable = (field.status || 'available') === 'available';
              const players = field.capacity || 22;
              const duration = field.sessionDuration || 90;
              const price = Number(field.pricePerHour || 0);

              return (
                <Link
                  key={field.id}
                  to={String(field.id).startsWith('fallback-') ? '/fields' : `/fields/${field.id}`}
                  className="group overflow-hidden rounded-2xl bg-white ring-1 ring-gray-300 transition hover:shadow-lg"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-200">
                    <img
                      src={field.images?.[0] || FIELD_FALLBACK_IMAGE}
                      alt={field.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
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

      <section className="rounded-2xl bg-green-50 px-6 py-10 sm:px-10">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Why Choose Us</h2>
          <p className="mt-2 text-gray-600">We make football field booking simple, secure, and convenient.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="rounded-xl bg-white p-5 text-center ring-1 ring-green-100">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <item.icon className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
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

      <footer className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-950 text-slate-100">
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
              <h3 className="text-xl font-bold">Follow Us</h3>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <span className="text-lg font-bold">f</span>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <span className="text-lg font-bold">t</span>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <span className="text-lg font-bold">i</span>
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
