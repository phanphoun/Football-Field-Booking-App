import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import fieldService from '../services/fieldService';
import { BuildingOfficeIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from '../components/ui';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_FIELD_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="100%25" height="100%25" fill="%23e5e7eb"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="30">No Field Image</text></svg>';

const FieldDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/app/bookings/new?fieldId=${id}` } });
      return;
    }

    navigate(`/app/bookings/new?fieldId=${id}`);
  };

  const resolveFieldImageUrl = (rawImage) => {
    if (!rawImage) return DEFAULT_FIELD_IMAGE;
    if (/^https?:\/\//i.test(rawImage) || /^data:image\//i.test(rawImage)) return rawImage;
    if (String(rawImage).startsWith('/uploads/')) return `${API_ORIGIN}${rawImage}`;
    return rawImage;
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="h-64 bg-gray-200 overflow-hidden">
          <img
            src={resolveFieldImageUrl(normalizeImages(field.images)[0])}
            alt={field.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              if (e.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                e.currentTarget.src = DEFAULT_FIELD_IMAGE;
              }
            }}
          />
        </div>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {field.address}, {field.city}, {field.province}
                </div>
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {field.fieldType} • {String(field.surfaceType || '').replace('_', ' ')}
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  ${field.pricePerHour}/hour
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleBook}>Book Now</Button>
              <Button as={Link} to="/fields" variant="outline">
                Back
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {field.status && (
              <Badge tone={field.status === 'available' ? 'green' : 'gray'} className="capitalize">
                {field.status}
              </Badge>
            )}
            {field.capacity && <Badge tone="gray">{field.capacity} capacity</Badge>}
          </div>

          {field.description && <p className="mt-6 text-gray-700">{field.description}</p>}

          {Array.isArray(field.amenities) && field.amenities.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-900">Amenities</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {field.amenities.map((a) => (
                  <Badge key={a} tone="gray">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default FieldDetailsPage;
