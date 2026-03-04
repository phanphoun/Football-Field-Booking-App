import React, { useEffect, useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import fieldService from '../services/fieldService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_FIELD_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%25" height="100%25" fill="%23e5e7eb"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="24">No Field Image</text></svg>';

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
  amenities: ''
};

const OwnerFieldsPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);

  const refresh = async () => {
    const res = await fieldService.getMyFields();
    setFields(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    const fetchFields = async () => {
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
    fetchFields();
  }, []);

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
      const nextImages = normalizeImages(response?.data?.images);
      setCurrentImages(nextImages);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Fields</h1>
          <p className="mt-1 text-sm text-gray-600">Create and manage your football fields.</p>
        </div>
        <button
          onClick={startCreate}
          className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Field
        </button>
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
              <input
                name="province"
                value={form.province}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
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
            <label className="block text-sm font-medium text-gray-700">Field Pictures (up to 5)</label>
            <label className="mt-1 relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <PhotoIcon className="h-16 w-16 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-700">Click to upload field pictures</p>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP. Up to 5 files.</p>
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
              <p className="mt-2 text-xs text-gray-500">When editing, newly selected images replace old field pictures.</p>
            )}
          </div>

          {editingFieldId && currentImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Choose Main Cover</label>
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
                        <span className="text-[11px] font-medium text-emerald-700">Main cover</span>
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
                          Set as cover
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

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {fields.length > 0 ? (
            fields.map((f) => (
              <div key={f.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={resolveFieldImageUrl(normalizeImages(f.images)[0])}
                      alt={f.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                          e.currentTarget.src = DEFAULT_FIELD_IMAGE;
                        }
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{f.name}</div>
                    <div className="text-xs text-gray-500">
                      {f.address}, {f.city} - ${f.pricePerHour}/hr
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => startEdit(f)}
                    className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleDelete(f.id)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-sm text-gray-500">No fields yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerFieldsPage;
