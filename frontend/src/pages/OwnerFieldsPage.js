import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPinIcon, PencilSquareIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import FieldLocationPicker from '../components/maps/FieldLocationPicker';
import fieldService from '../services/fieldService';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_FIELD_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%25" height="100%25" fill="%23e5e7eb"/></svg>';

const emptyForm = {
  name: '',
  description: '',
  address: '',
  city: '',
  province: '',
  latitude: '',
  longitude: '',
  pricePerHour: '',
  capacity: '',
  fieldType: '11v11',
  surfaceType: 'artificial_turf',
  amenities: ''
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
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [viewMode, setViewMode] = useState('mine');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const visibleFields = useMemo(() => (viewMode === 'all' ? allFields : fields), [viewMode, allFields, fields]);

  const isOwnedByCurrentUser = useCallback(
    (field) => {
      const ownerId = field?.ownerId || field?.owner?.id;
      return Number(ownerId) === Number(user?.id);
    },
    [user?.id]
  );

  const loadFields = useCallback(async () => {
    const [myRes, allRes] = await Promise.all([fieldService.getMyFields(), fieldService.getAllFields({ limit: 200 })]);
    setFields(Array.isArray(myRes.data) ? myRes.data : []);
    setAllFields(Array.isArray(allRes.data) ? allRes.data : []);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        await loadFields();
      } catch (err) {
        setError(err?.error || 'Failed to load fields');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadFields]);

  const resetForm = () => {
    setForm(emptyForm);
    setImageFiles([]);
    setEditingFieldId(null);
    setIsOpen(false);
  };

  const startCreate = () => {
    setError('');
    setSuccessMessage('');
    setForm(emptyForm);
    setImageFiles([]);
    setEditingFieldId(null);
    setIsOpen(true);
  };

  const startEdit = (field) => {
    setError('');
    setSuccessMessage('');
    setEditingFieldId(field.id);
    setImageFiles([]);
    setForm({
      name: field.name || '',
      description: field.description || '',
      address: field.address || '',
      city: field.city || '',
      province: field.province || '',
      latitude: field.latitude ?? '',
      longitude: field.longitude ?? '',
      pricePerHour: field.pricePerHour ?? '',
      capacity: field.capacity ?? '',
      fieldType: field.fieldType || '11v11',
      surfaceType: field.surfaceType || 'artificial_turf',
      amenities: Array.isArray(field.amenities) ? field.amenities.join(', ') : ''
    });
    setIsOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleLocationChange = (locationData) => {
    setForm((current) => ({
      ...current,
      address: locationData.address || current.address,
      city: locationData.city || current.city,
      province: locationData.province || current.province,
      latitude: locationData.latitude ?? '',
      longitude: locationData.longitude ?? ''
    }));
  };

  const handleImageChange = (event) => {
    const nextFiles = Array.from(event.target.files || []).filter((file) => String(file.type || '').startsWith('image/'));
    setImageFiles(nextFiles.slice(0, 5));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const payload = {
        name: form.name,
        description: form.description || undefined,
        address: form.address,
        city: form.city,
        province: form.province,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        pricePerHour: Number(form.pricePerHour),
        capacity: Number(form.capacity),
        fieldType: form.fieldType,
        surfaceType: form.surfaceType,
        amenities: form.amenities ? form.amenities.split(',').map((item) => item.trim()).filter(Boolean) : []
      };

      if (editingFieldId) {
        await fieldService.updateField(editingFieldId, payload);
        if (imageFiles.length > 0) {
          await fieldService.uploadFieldImages(editingFieldId, imageFiles, { replaceExisting: true });
        }
        setSuccessMessage('Field updated.');
      } else {
        const created = await fieldService.createField(payload);
        const createdId = created?.data?.id;
        if (createdId && imageFiles.length > 0) {
          await fieldService.uploadFieldImages(createdId, imageFiles);
        }
        setSuccessMessage('Field created.');
      }

      await loadFields();
      resetForm();
    } catch (err) {
      setError(err?.error || 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (field) => {
    const confirmed = window.confirm(`Delete "${field.name}"?`);
    if (!confirmed) return;

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      await fieldService.deleteField(field.id);
      setSuccessMessage('Field deleted.');
      await loadFields();
    } catch (err) {
      setError(err?.error || 'Failed to delete field');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Fields</h1>
          <p className="mt-1 text-sm text-gray-600">Create and manage your football fields, or view all fields.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setViewMode('mine')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === 'mine' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              My Fields
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              All Fields
            </button>
          </div>
          <button onClick={startCreate} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Add Field
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {successMessage && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{editingFieldId ? 'Edit Field' : 'Create Field'}</h2>
            <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Field name" className="rounded-lg border border-gray-300 px-3 py-2" required />
            <input name="pricePerHour" type="number" value={form.pricePerHour} onChange={handleChange} placeholder="Price per hour" className="rounded-lg border border-gray-300 px-3 py-2" required />
            <input name="capacity" type="number" value={form.capacity} onChange={handleChange} placeholder="Capacity" className="rounded-lg border border-gray-300 px-3 py-2" required />
            <select name="fieldType" value={form.fieldType} onChange={handleChange} className="rounded-lg border border-gray-300 px-3 py-2">
              <option value="5v5">5v5</option>
              <option value="7v7">7v7</option>
              <option value="11v11">11v11</option>
              <option value="futsal">Futsal</option>
            </select>
            <select name="surfaceType" value={form.surfaceType} onChange={handleChange} className="rounded-lg border border-gray-300 px-3 py-2">
              <option value="artificial_turf">Artificial Turf</option>
              <option value="natural_grass">Natural Grass</option>
              <option value="concrete">Concrete</option>
              <option value="indoor">Indoor</option>
            </select>
            <input name="amenities" value={form.amenities} onChange={handleChange} placeholder="parking, showers, lights" className="rounded-lg border border-gray-300 px-3 py-2" />
          </div>

          <FieldLocationPicker
            value={{
              address: form.address,
              city: form.city,
              province: form.province,
              latitude: form.latitude,
              longitude: form.longitude
            }}
            onChange={handleLocationChange}
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Field description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Photos</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="block w-full text-sm" />
            {imageFiles.length > 0 && <p className="text-xs text-gray-500">{imageFiles.length} image(s) selected</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleFields.length > 0 ? (
          visibleFields.map((field) => {
            const images = normalizeImages(field.images);
            const coverImage = resolveFieldImageUrl(images[0]);
            const isOwned = isOwnedByCurrentUser(field);

            return (
              <div key={field.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <img
                  src={coverImage}
                  alt={field.name}
                  className="h-48 w-full object-cover"
                  onError={(event) => {
                    if (event.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                      event.currentTarget.src = DEFAULT_FIELD_IMAGE;
                    }
                  }}
                />
                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{field.name}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4" />
                      {field.address}, {field.city}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>${field.pricePerHour}/hr</span>
                    <span>{field.capacity} players</span>
                  </div>
                  {field.description && <p className="text-sm text-gray-600">{field.description}</p>}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(field)}
                      disabled={!isOwned || saving}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(field)}
                      disabled={!isOwned || saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
            <PhotoIcon className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No fields yet</h3>
            <p className="mt-2 text-sm text-gray-500">Create your first field to start receiving bookings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerFieldsPage;
