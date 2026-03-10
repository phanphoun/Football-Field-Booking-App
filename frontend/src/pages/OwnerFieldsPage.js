import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';
import bookingService from '../services/bookingService';
import { Badge, Button, Card, CardBody, EmptyState, Spinner } from '../components/ui';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_FIELD_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%25" height="100%25" fill="%23e5e7eb"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="24">No Field Image</text></svg>';

const CAMBODIA_PROVINCES = [
  'Banteay Meanchey',
  'Battambang',
  'Kampong Cham',
  'Kampong Chhnang',
  'Kampong Speu',
  'Kampong Thom',
  'Kampot',
  'Kandal',
  'Kep',
  'Koh Kong',
  'Kratie',
  'Mondulkiri',
  'Oddar Meanchey',
  'Pailin',
  'Preah Vihear',
  'Prey Veng',
  'Pursat',
  'Ratanakiri',
  'Siem Reap',
  'Preah Sihanouk',
  'Stung Treng',
  'Svay Rieng',
  'Takeo',
  'Tboung Khmum'
];

const emptyForm = {
  name: '',
  description: '',
  address: '',
  city: '',
  province: '',
  pricePerHour: '',
  capacity: '',
  fieldType: '11v11',
  surfaceType: 'artificial_turf',
  status: 'available',
  amenities: ''
};

const PAGE_SIZE = 6;

const statusTone = (status) => {
  if (status === 'available') return 'green';
  if (status === 'maintenance') return 'yellow';
  if (status === 'unavailable') return 'red';
  return 'gray';
};

const formatMoney = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
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

const resolveFieldImageUrl = (rawImage) => {
  if (!rawImage) return DEFAULT_FIELD_IMAGE;
  if (/^https?:\/\//i.test(rawImage) || /^data:image\//i.test(rawImage)) return rawImage;
  if (String(rawImage).startsWith('/uploads/')) return `${API_ORIGIN}${rawImage}`;
  return rawImage;
};

const OwnerFieldsPage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [surfaceFilter, setSurfaceFilter] = useState('all');
  const [page, setPage] = useState(1);

  const refresh = async () => {
    const [fieldsRes, bookingsRes] = await Promise.all([
      fieldService.getMyFields(),
      bookingService.getAllBookings({ limit: 500 })
    ]);
    setFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : []);
    setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
  };

  useEffect(() => {
    const fetchOwnerFields = async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        setError(err?.error || 'Failed to load fields');
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerFields();
  }, []);

  const bookingStatsByField = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const fieldId = b?.fieldId;
      if (!fieldId) continue;
      if (!map[fieldId]) {
        map[fieldId] = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
      }
      map[fieldId].total += 1;
      if (map[fieldId][b.status] !== undefined) {
        map[fieldId][b.status] += 1;
      }
    }
    return map;
  }, [bookings]);

  const statusCounts = useMemo(() => {
    const base = { all: fields.length, available: 0, maintenance: 0, unavailable: 0 };
    for (const f of fields) {
      if (base[f.status] !== undefined) base[f.status] += 1;
    }
    return base;
  }, [fields]);

  const filteredFields = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return fields.filter((f) => {
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesSurface = surfaceFilter === 'all' || f.surfaceType === surfaceFilter;
      if (!matchesStatus || !matchesSurface) return false;

      if (!query) return true;
      return [f.name, f.address, f.city, f.province, f.fieldType, f.surfaceType]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    });
  }, [fields, searchTerm, statusFilter, surfaceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFields.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pagedFields = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filteredFields.slice(start, start + PAGE_SIZE);
  }, [filteredFields, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, surfaceFilter]);

  const startCreate = () => {
    setSuccessMessage(null);
    setError(null);
    setEditingFieldId(null);
    setForm(emptyForm);
    setImageFiles([]);
    setCurrentImages([]);
    setIsCreating(true);
  };

  const startEdit = (field) => {
    setSuccessMessage(null);
    setError(null);
    setIsCreating(false);
    setEditingFieldId(field.id);
    setImageFiles([]);
    setCurrentImages(normalizeImages(field.images));
    setForm({
      name: field.name || '',
      description: field.description || '',
      address: field.address || '',
      city: field.city || '',
      province: field.province || '',
      pricePerHour: field.pricePerHour ?? '',
      capacity: field.capacity ?? '',
      fieldType: field.fieldType || '11v11',
      surfaceType: field.surfaceType || 'artificial_turf',
      status: field.status || 'available',
      amenities: Array.isArray(field.amenities) ? field.amenities.join(', ') : ''
    });
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingFieldId(null);
    setForm(emptyForm);
    setImageFiles([]);
    setCurrentImages([]);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const picked = Array.from(e.target.files || []);
    const onlyImages = picked.filter((file) => String(file.type || '').startsWith('image/'));
    setImageFiles(onlyImages.slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        name: form.name,
        description: form.description || undefined,
        address: form.address,
        city: form.city,
        province: form.province,
        pricePerHour: Number(form.pricePerHour),
        capacity: Number(form.capacity),
        fieldType: form.fieldType,
        surfaceType: form.surfaceType,
        status: form.status,
        amenities: form.amenities
          ? form.amenities
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []
      };

      if (editingFieldId) {
        await fieldService.updateField(editingFieldId, payload);
        if (imageFiles.length > 0) {
          await fieldService.uploadFieldImages(editingFieldId, imageFiles, { replaceExisting: true });
        }
        const updated = await fieldService.getFieldById(editingFieldId);
        setCurrentImages(normalizeImages(updated?.data?.images));
        setSuccessMessage('Field updated.');
      } else {
        const created = await fieldService.createField(payload);
        const createdId = created?.data?.id;
        if (createdId && imageFiles.length > 0) {
          await fieldService.uploadFieldImages(createdId, imageFiles);
        }
        setSuccessMessage('Field created.');
      }

      await refresh();
      resetForm();
    } catch (err) {
      setError(err?.error || 'Failed to save field');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetCover = async (imageIndex) => {
    if (!editingFieldId) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      const response = await fieldService.setFieldCoverImage(editingFieldId, imageIndex);
      setCurrentImages(normalizeImages(response?.data?.images));
      setSuccessMessage('Cover image updated.');
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to set cover image');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (fieldId) => {
    if (!window.confirm('Delete this field?')) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      await fieldService.deleteField(fieldId);
      setSuccessMessage('Field deleted.');
      await refresh();
    } catch (err) {
      setError(err?.error || 'Failed to delete field');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const statusTabs = [
    { key: 'all', label: 'All Fields', count: statusCounts.all },
    { key: 'available', label: 'Available', count: statusCounts.available },
    { key: 'maintenance', label: 'Maintenance', count: statusCounts.maintenance },
    { key: 'unavailable', label: 'Unavailable', count: statusCounts.unavailable }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Fields</h1>
          <p className="mt-1 text-sm text-gray-600">Manage field details, status, photos, and bookings from database records.</p>
        </div>
        <Button onClick={startCreate}>
          <PlusIcon className="h-4 w-4" />
          Add New Field
        </Button>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                  statusFilter === tab.key
                    ? 'bg-green-600 text-white ring-green-600'
                    : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={statusFilter === tab.key ? 'text-white/80' : 'text-gray-500'}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by field name, city, province, address..."
                className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <div className="relative">
              <FunnelIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={surfaceFilter}
                onChange={(e) => setSurfaceFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm"
              >
                <option value="all">All Surfaces</option>
                <option value="artificial_turf">Artificial Turf</option>
                <option value="natural_grass">Natural Grass</option>
                <option value="concrete">Concrete</option>
                <option value="indoor">Indoor</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {(isCreating || editingFieldId) && (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {editingFieldId ? 'Edit Field' : 'Create Field'}
            </h2>
            <button type="button" onClick={resetForm} className="text-sm text-gray-600 hover:text-gray-900">
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price / Hour</label>
              <input
                name="pricePerHour"
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerHour}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Province</label>
              <select
                name="province"
                value={form.province}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a province</option>
                {CAMBODIA_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity</label>
              <input
                name="capacity"
                type="number"
                min="1"
                max="50"
                value={form.capacity}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Field Type</label>
              <select
                name="fieldType"
                value={form.fieldType}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="5v5">5v5</option>
                <option value="7v7">7v7</option>
                <option value="11v11">11v11</option>
                <option value="futsal">Futsal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Surface Type</label>
              <select
                name="surfaceType"
                value={form.surfaceType}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="artificial_turf">Artificial Turf</option>
                <option value="natural_grass">Natural Grass</option>
                <option value="concrete">Concrete</option>
                <option value="indoor">Indoor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amenities (comma separated)</label>
            <input
              name="amenities"
              value={form.amenities}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="parking, showers, floodlights"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Field Photos (Maximum 5)</label>
            <label className="mt-1 relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <PhotoIcon className="h-16 w-16 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-700">Click to upload field photos</p>
              <p className="mt-1 text-xs text-gray-500">Accepted formats: PNG, JPG, WEBP.</p>
            </label>
            {imageFiles.length > 0 && (
              <div className="mt-3 rounded-md border border-gray-200 bg-white p-3">
                <p className="text-xs font-medium text-gray-700">{imageFiles.length} image(s) selected</p>
                <ul className="mt-1 space-y-1 text-xs text-gray-600">
                  {imageFiles.map((file) => (
                    <li key={`${file.name}-${file.lastModified}`} className="truncate">
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {editingFieldId && (
              <p className="mt-2 text-xs text-gray-500">When editing, newly selected photos will replace existing field photos.</p>
            )}
          </div>

          {editingFieldId && currentImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Cover Photo</label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                {currentImages.map((img, index) => (
                  <div
                    key={`${img}-${index}`}
                    className={`rounded-md border overflow-hidden ${
                      index === 0 ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={resolveFieldImageUrl(img)}
                      alt={`Field ${index + 1}`}
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                          e.currentTarget.src = DEFAULT_FIELD_IMAGE;
                        }
                      }}
                    />
                    <div className="p-2 bg-white flex items-center justify-between gap-2">
                      {index === 0 ? (
                        <span className="text-[11px] font-medium text-emerald-700">Cover photo</span>
                      ) : (
                        <span className="text-[11px] text-gray-500">Image {index + 1}</span>
                      )}
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(index)}
                          disabled={actionLoading}
                          className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Set as cover photo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {pagedFields.length === 0 ? (
        <Card>
          <CardBody className="p-8">
            <EmptyState
              icon={PhotoIcon}
              title="No fields found"
              description="Try changing your filters, or create your first field."
              actionLabel="Add New Field"
              onAction={startCreate}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pagedFields.map((field) => {
            const images = normalizeImages(field.images);
            const cover = resolveFieldImageUrl(images[0]);
            const stats = bookingStatsByField[field.id] || { total: 0, pending: 0, confirmed: 0, completed: 0 };
            return (
              <Card key={field.id} className="overflow-hidden border border-gray-200">
                <div className="relative h-40">
                  <img
                    src={cover}
                    alt={field.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (e.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                        e.currentTarget.src = DEFAULT_FIELD_IMAGE;
                      }
                    }}
                  />
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge tone={statusTone(field.status)} className="capitalize">
                      {field.status || 'unknown'}
                    </Badge>
                    <Badge tone="gray">{field.surfaceType || '-'}</Badge>
                  </div>
                </div>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{field.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {field.address}, {field.city}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                      {formatMoney(field.pricePerHour)}/hr
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                    <Badge tone="gray">{field.fieldType || '-'}</Badge>
                    <Badge tone="gray">Capacity {field.capacity || 0}</Badge>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    Bookings: {stats.total} total, {stats.pending} pending, {stats.confirmed} confirmed, {stats.completed} completed
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => startEdit(field)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/owner/bookings?fieldId=${field.id}`)}
                    >
                      Bookings
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={actionLoading}
                      onClick={() => handleDelete(field.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}

          <button
            type="button"
            onClick={startCreate}
            className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors min-h-[290px] flex flex-col items-center justify-center text-center p-6"
          >
            <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <PlusIcon className="h-5 w-5 text-gray-700" />
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-900">Add New Field</div>
            <div className="mt-1 text-xs text-gray-500">Create a new pitch with pricing, capacity, and photos.</div>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          Showing {(pageSafe - 1) * PAGE_SIZE + (pagedFields.length > 0 ? 1 : 0)} to {(pageSafe - 1) * PAGE_SIZE + pagedFields.length} of {filteredFields.length} fields
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-xs text-gray-600">
            Page {pageSafe} / {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OwnerFieldsPage;
