import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BuildingOfficeIcon, MapPinIcon, CurrencyDollarIcon, StarIcon as SparklesIcon } from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { Badge, Button, Card, CardBody, EmptyState, Spinner, useDialog } from '../components/ui';
import notificationService from '../services/notificationService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_FIELD_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%25" height="100%25" fill="%23e5e7eb"/></svg>';
const isPlaceholderImage = (rawImage) => String(rawImage || '').toLowerCase().includes('no field image');
const getDiscountPercent = (field) => Math.min(100, Math.max(0, Number(field?.discountPercent || 0)));
const getDiscountedPrice = (field) => {
  const basePrice = Number(field?.pricePerHour || 0);
  const discountPercent = getDiscountPercent(field);
  return Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
};
const getStatusToneClasses = (status) => {
  const normalizedStatus = String(status || 'available').toLowerCase();
  if (normalizedStatus === 'available') return 'bg-blue-50 text-blue-700';
  if (normalizedStatus === 'booked') return 'bg-red-100 text-red-700';
  if (normalizedStatus === 'maintenance') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-200 text-slate-700';
};
const isBookableField = (field) => String(field?.status || 'available').toLowerCase() === 'available';
const getOwnerDisplayName = (field) => {
  const owner = field?.owner;
  if (!owner) return field?.ownerId ? `Owner #${field.ownerId}` : 'Unknown owner';
  const fullName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim();
  return fullName || owner.username || `Owner #${owner.id}`;
};

const FieldsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { version } = useRealtime();
  const { showAlert } = useDialog();
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const canCreateBooking = ['captain', 'field_owner'].includes(user?.role);
  const isAdmin = user?.role === 'admin';
  const bookingAccessMessage = 'Booking access is required.';
  const [fields, setFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingFieldId, setDeletingFieldId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldTypeFilter, setFieldTypeFilter] = useState('');
  const [surfaceTypeFilter, setSurfaceTypeFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        const response = await fieldService.getAllFields();
        // Ensure we always set an array, even if response.data is not an array
        const fieldsData = Array.isArray(response.data) ? response.data : [];
        setFields(fieldsData);
        setFilteredFields(fieldsData);
      } catch (err) {
        console.error('Failed to fetch fields:', err);
        setError('Failed to load fields');
        setFields([]);
        setFilteredFields([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [version]);

  useEffect(() => {
    const filtered = fields.filter(field => {
      const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        field.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !fieldTypeFilter || field.fieldType === fieldTypeFilter;
      const matchesSurface = !surfaceTypeFilter || field.surfaceType === surfaceTypeFilter;
      const matchesPrice = !maxPriceFilter || field.pricePerHour <= parseFloat(maxPriceFilter);
      
      return matchesSearch && matchesType && matchesSurface && matchesPrice;
    });

    setFilteredFields(filtered);
  }, [fields, searchTerm, fieldTypeFilter, surfaceTypeFilter, maxPriceFilter]);

  useEffect(() => {
    const focusMode = searchParams.get('focus');
    if (focusMode !== 'search') return;

    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchInputRef.current?.focus();
  }, [searchParams]);

  const handleBookField = async (fieldId) => {
    const bookingPath = `/app/bookings/new?fieldId=${fieldId}`;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: bookingPath, backgroundLocation: location } });
      return;
    }

    if (!canCreateBooking) {
      await showAlert(bookingAccessMessage, {
        title: 'Booking Access',
        onConfirm: () => navigate('/#account-upgrade')
      });
      return;
    }

    navigate(bookingPath);
  };

  const handleViewDetails = (fieldId) => {
    navigate(`/fields/${fieldId}`);
  };

  const openDeleteDialog = (field) => {
    setFieldToDelete(field);
    setDeleteMessage('');
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setFieldToDelete(null);
    setDeleteMessage('');
  };

  const handleDeleteField = async () => {
    if (!fieldToDelete?.id) return;
    const message = deleteMessage.trim();
    if (!message) {
      setError('Please enter a message to owner before deleting.');
      return;
    }

    const fieldId = fieldToDelete.id;

    try {
      setDeletingFieldId(fieldId);
      setError(null);
      const ownerUserId = fieldToDelete?.ownerId || fieldToDelete?.owner?.id;

      if (ownerUserId) {
        await notificationService.create({
          userId: ownerUserId,
          type: 'system',
          title: `Field deleted by admin: ${fieldToDelete.name}`,
          message,
          metadata: {
            event: 'field_deleted_by_admin',
            fieldId: fieldToDelete.id,
            fieldName: fieldToDelete.name,
            actorId: user?.id
          }
        });
      }

      await fieldService.deleteField(fieldId);
      setFields((prev) => prev.filter((field) => field.id !== fieldId));
      closeDeleteDialog();
    } catch (err) {
      setError(err?.error || 'Failed to delete field');
    } finally {
      setDeletingFieldId(null);
    }
  };

  const getRatingDisplay = (rating, totalRatings) => {
    const numericRating = Number(rating);
    const numericTotalRatings = Number(totalRatings) || 0;

    if (!Number.isFinite(numericRating) || numericRating <= 0 || numericTotalRatings === 0) {
      return 'No rating';
    }

    return `${numericRating.toFixed(1)} (${numericTotalRatings} reviews)`;
  };

  const resolveFieldImageUrl = (rawImage, versionToken = '') => {
    if (!rawImage || isPlaceholderImage(rawImage)) return DEFAULT_FIELD_IMAGE;
    if (/^https?:\/\//i.test(rawImage) || /^data:image\//i.test(rawImage)) return rawImage;
    if (String(rawImage).startsWith('/uploads/')) {
      const baseUrl = `${API_ORIGIN}${rawImage}`;
      if (!versionToken) return baseUrl;
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}v=${encodeURIComponent(String(versionToken))}`;
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fields</h1>
          <p className="mt-1 text-sm text-gray-600">Browse football fields near you.</p>
        </div>
        <Badge tone="gray">{filteredFields.length} results</Badge>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardBody className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
            <select
              value={fieldTypeFilter}
              onChange={(e) => setFieldTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Types</option>
              <option value="5v5">5v5</option>
              <option value="7v7">7v7</option>
              <option value="11v11">11v11</option>
              <option value="futsal">Futsal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Surface Type</label>
            <select
              value={surfaceTypeFilter}
              onChange={(e) => setSurfaceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Surfaces</option>
              <option value="natural_grass">Natural Grass</option>
              <option value="artificial_turf">Artificial Turf</option>
              <option value="concrete">Concrete</option>
              <option value="indoor">Indoor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Price/Hour</label>
            <input
              type="number"
              placeholder="50"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setFieldTypeFilter('');
              setSurfaceTypeFilter('');
              setMaxPriceFilter('');
            }}
          >
            Clear filters
          </Button>
        </div>
        </CardBody>
      </Card>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFields.length > 0 ? (
          filteredFields.map((field) => {
            const discountPercent = getDiscountPercent(field);
            const discountedPrice = getDiscountedPrice(field);
            const fieldStatus = String(field.status || 'available').toLowerCase();
            const canBookThisField = isBookableField(field);

            return (
            <div
              key={field.id}
              onClick={() => !isAdmin && canBookThisField && handleBookField(field.id)}
              role={!isAdmin && canBookThisField ? 'button' : undefined}
              tabIndex={!isAdmin && canBookThisField ? 0 : -1}
              onKeyDown={(event) => {
                if (isAdmin || !canBookThisField) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleBookField(field.id);
                }
              }}
              className={`bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow ${
                isAdmin ? '' : canBookThisField ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                <img
                  src={resolveFieldImageUrl(normalizeImages(field.images)[0], field.updatedAt || field.id)}
                  alt={field.name}
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform"
                  onError={(e) => {
                    if (e.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                      e.currentTarget.src = DEFAULT_FIELD_IMAGE;
                    }
                  }}
                />
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur">
                      {field.fieldType || 'Field'}
                    </span>
                    <div className="flex items-center gap-2">
                      {discountPercent > 0 && (
                        <span className="rounded-full bg-emerald-100/95 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur">
                          {discountPercent}% OFF
                        </span>
                      )}
                    {!isAdmin && (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize shadow-sm backdrop-blur ${getStatusToneClasses(fieldStatus)} bg-opacity-95`}>
                        {fieldStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{field.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <SparklesIcon className="h-4 w-4 text-yellow-400" />
                      <span className="ml-1 text-sm text-gray-600">
                        {getRatingDisplay(field.rating, field.totalRatings)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {field.address}, {field.city}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    {field.fieldType} • {String(field.surfaceType || '').replace('_', ' ')}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    {discountPercent > 0 ? (
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600">${discountedPrice}/hour</span>
                        <span className="text-gray-400 line-through">${field.pricePerHour}/hour</span>
                      </span>
                    ) : (
                      `$${field.pricePerHour}/hour`
                    )}
                  </div>
                  {isAdmin && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Owner:</span> {getOwnerDisplayName(field)}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {!isAdmin && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!canBookThisField) return;
                        handleBookField(field.id);
                      }}
                      disabled={!canBookThisField}
                      className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                        !canBookThisField
                          ? 'border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                          : isAuthenticated && !canCreateBooking
                          ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {canBookThisField ? 'Book Now' : 'Not Available'}
                    </button>
                  )}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleViewDetails(field.id);
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openDeleteDialog(field);
                      }}
                      disabled={deletingFieldId === field.id}
                      className="border border-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {deletingFieldId === field.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={BuildingOfficeIcon}
              title="No fields found"
              description="Try adjusting your search or filters."
              actionLabel="Clear filters"
              onAction={() => {
                setSearchTerm('');
                setFieldTypeFilter('');
                setSurfaceTypeFilter('');
                setMaxPriceFilter('');
              }}
            />
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredFields.length > 0 && filteredFields.length < fields.length && (
        <div className="mt-8 text-center">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Load More Fields
          </button>
        </div>
      )}

      {deleteDialogOpen && fieldToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Delete Field</h2>
              <p className="mt-1 text-sm text-gray-600">
                Send a message to owner before deleting <span className="font-semibold">{fieldToDelete.name}</span>.
              </p>
            </div>
            <div className="px-5 py-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Message to owner</label>
              <textarea
                value={deleteMessage}
                onChange={(e) => setDeleteMessage(e.target.value)}
                rows={4}
                placeholder="Explain why this field is being deleted..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingFieldId === fieldToDelete.id}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteField}
                disabled={deletingFieldId === fieldToDelete.id}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingFieldId === fieldToDelete.id ? 'Deleting...' : 'Send & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldsPage;
