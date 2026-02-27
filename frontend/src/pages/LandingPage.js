import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import fieldService from '../services/fieldService';
import teamService from '../services/teamService';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';
import {
  BuildingOfficeIcon,
  UsersIcon,
  CalendarIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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
          fieldService.getAllFields(),
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

  const howItWorks = useMemo(
    () => [
      {
        title: 'Find',
        description: 'Browse fields and teams near you with easy filters.',
        icon: MagnifyingGlassIcon
      },
      {
        title: 'Request / Book',
        description: 'Request to join a team or book a field for your next match.',
        icon: CalendarIcon
      },
      {
        title: 'Play / Manage',
        description: 'Captains manage teams. Owners confirm bookings and manage fields.',
        icon: BellIcon
      }
    ],
    []
  );

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-sm ring-1 ring-black/5">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white_0%,transparent_45%),radial-gradient(circle_at_80%_30%,white_0%,transparent_40%)]" />
        <div className="relative px-6 py-12 sm:px-10">
          <div className="max-w-2xl">
            <Badge tone="green" className="bg-white/15 text-white ring-1 ring-white/20">
              Guest browsing • Role-based dashboards
            </Badge>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Book fields. Build your team. Play more.
            </h1>
            <p className="mt-4 text-white/90">
              Browse fields and teams as a guest. Log in as a player/captain to book and manage teams. Field owners can
              manage fields and approve bookings.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button as={Link} to="/fields" className="bg-white text-green-800 hover:bg-white/90">
                Browse Fields
              </Button>
              <Button as={Link} to="/teams" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Browse Teams
              </Button>
              <Button as={Link} to="/register" variant="neutral" className="bg-black/15 text-white hover:bg-black/25">
                Register
              </Button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Popular Fields</h2>
          <Link to="/fields" className="text-sm font-medium text-green-700 hover:text-green-800">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Spinner className="h-6 w-6" />
          </div>
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
                    src={field.images?.[0] || 'https://via.placeholder.com/400x200'}
                    alt={field.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">{field.name}</h3>
                    {field.rating ? (
                      <Badge tone="yellow">{`${Number(field.rating).toFixed(1)}★`}</Badge>
                    ) : (
                      <Badge tone="gray">New</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {field.address}, {field.city}
                  </p>
                  <p className="mt-2 text-sm font-medium text-green-700">
                    ${field.pricePerHour}/hour
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BuildingOfficeIcon}
            title="No fields yet"
            description="Once owners add fields, they’ll show up here for guests to browse."
            actionLabel="Browse Fields"
            onAction={() => (window.location.href = '/fields')}
          />
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Popular Teams</h2>
          <Link to="/teams" className="text-sm font-medium text-green-700 hover:text-green-800">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Spinner className="h-6 w-6" />
          </div>
        ) : popularTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularTeams.map((team) => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="group bg-white shadow-sm ring-1 ring-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">{team.name}</h3>
                  <Badge tone="gray">{team.memberCount || 0} members</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{team.description}</p>
                <div className="mt-3 text-xs text-gray-500">
                  Captain: {team.captain?.firstName || team.captain?.username || 'Unknown'}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UsersIcon}
            title="No teams yet"
            description="Captains can create teams after registering. Guests will be able to browse them here."
            actionLabel="Browse Teams"
            onAction={() => (window.location.href = '/teams')}
          />
        )}
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-900">How it works</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step) => (
              <div key={step.title} className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-green-50 ring-1 ring-green-100">
                  <step.icon className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{step.title}</div>
                  <div className="mt-1 text-sm text-gray-600">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <UsersIcon className="h-6 w-6 text-green-700" />
              <h3 className="text-lg font-semibold text-gray-900">For Players & Captains</h3>
            </div>
            <ul className="mt-4 text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>Request to join teams</li>
              <li>Book fields for matches</li>
              <li>Captains can create and manage teams</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-700" />
              <h3 className="text-lg font-semibold text-gray-900">For Field Owners</h3>
            </div>
            <ul className="mt-4 text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>Create and manage fields</li>
              <li>Confirm/cancel bookings</li>
              <li>Track usage and upcoming bookings</li>
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  );
};

export default LandingPage;
