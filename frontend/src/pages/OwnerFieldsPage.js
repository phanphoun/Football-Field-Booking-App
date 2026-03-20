import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, PencilSquareIcon, PhotoIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import FieldLocationPicker from '../components/maps/FieldLocationPicker';
import fieldService from '../services/fieldService';
import { useAuth } from '../context/AuthContext';
import { useDialog, useToast } from '../components/ui';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const CLOSURE_DAY_PRESETS = [1, 3, 7, 14];
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
  discountPercent: '',
  capacity: '',
  status: 'available',
  fieldType: '11v11',
  surfaceType: 'artificial_turf',
  amenities: '',
  closureMessage: '',
  closureStartAt: '',
  closureEndAt: ''
};

const getDiscountPercent = (field) => Math.min(100, Math.max(0, Number(field?.discountPercent || 0)));
const getDiscountedHourlyPrice = (field) => {
  const price = Number(field?.pricePerHour || 0);
  const discountPercent = getDiscountPercent(field);
  return Number((price * (1 - discountPercent / 100)).toFixed(2));
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

const toDateInputValue = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const addDaysToDateInput = (baseValue, days) => {
  const baseDate = baseValue ? new Date(baseValue) : new Date();
  if (Number.isNaN(baseDate.getTime())) return '';
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + Number(days || 0));
  return toDateInputValue(nextDate);
};

const isOwnedByCurrentUser = (field, user) => {
  if (!field) return false;
  const ownerId =
    field.ownerId ||
    field.owner_id ||
    field.userId ||
    field.user_id ||
    field.fieldOwnerId ||
    field.owner?.id ||
    field.owner?._id ||
    null;
  const userId = user?.id || user?._id || null;
  if (!ownerId || !userId) return true;
  return String(ownerId) === String(userId);
};

const OwnerFieldsPage = () => {
  const { user } = useAuth();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const selectedField = useMemo(
    () => fields.find((field) => Number(field.id) === Number(editingFieldId)) || null,
    [editingFieldId, fields]
  );
  const visibleFields = useMemo(() => fields, [fields]);

  const loadFields = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fieldService.getMyFields();
      setFields(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err?.error || 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await loadFields();
      } catch (err) {
        showToast(err?.error || 'Failed to load fields', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadFields, showToast]);

  const resetForm = () => {
    setForm(emptyForm);
    setImageFiles([]);
    setExistingImages([]);
    setEditingFieldId(null);
    setIsOpen(false);
  };

  const startCreate = () => {
    setForm(emptyForm);
    setImageFiles([]);
    setExistingImages([]);
    setEditingFieldId(null);
    setIsOpen(true);
  };

  const startEdit = (field) => {
    setEditingFieldId(field.id);
    setImageFiles([]);
    setExistingImages(normalizeImages(field.images).map((image) => resolveFieldImageUrl(image)));
    setForm({
      name: field.name || '',
      description: field.description || '',
      address: field.address || '',
      city: field.city || '',
      province: field.province || '',
      latitude: field.latitude ?? '',
      longitude: field.longitude ?? '',
      pricePerHour: field.pricePerHour ?? '',
      discountPercent: field.discountPercent ?? '',
      capacity: field.capacity ?? '',
      status: field.status || 'available',
      fieldType: field.fieldType || '11v11',
      surfaceType: field.surfaceType || 'artificial_turf',
      amenities: Array.isArray(field.amenities) ? field.amenities.join(', ') : '',
      closureMessage: field.closureMessage || '',
      closureStartAt: toDateInputValue(field.closureStartAt),
      closureEndAt: toDateInputValue(field.closureEndAt)
    });
    setIsOpen(true);
  };

  const selectedImagePreviews = useMemo(
    () =>
      imageFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file)
      })),
    [imageFiles]
  );

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [selectedImagePreviews]);

  const visibleImagePreviews = selectedImagePreviews.length > 0
    ? selectedImagePreviews
    : existingImages.map((url, index) => ({ name: `Current image ${index + 1}`, url }));

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

  const applyClosureDaysPreset = (days) => {
    setForm((current) => {
      const baseStart = current.closureStartAt || toDateInputValue(new Date());
      const nextEnd = addDaysToDateInput(baseStart, days);
      return {
        ...current,
        closureStartAt: baseStart,
        closureEndAt: nextEnd
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);

      const payload = {
        name: form.name,
        description: form.description || undefined,
        address: form.address,
        city: form.city,
        province: form.province,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        pricePerHour: Number(form.pricePerHour),
        discountPercent: form.discountPercent === '' ? 0 : Number(form.discountPercent),
        capacity: Number(form.capacity),
        status: form.status,
        fieldType: form.fieldType,
        surfaceType: form.surfaceType,
        amenities: form.amenities ? form.amenities.split(',').map((item) => item.trim()).filter(Boolean) : [],
        closureMessage:
          form.status === 'available'
            ? null
            : form.closureMessage?.trim()
            ? form.closureMessage.trim()
            : null,
        closureStartAt: form.status === 'available' ? null : toIsoOrNull(form.closureStartAt),
        closureEndAt: form.status === 'available' ? null : toIsoOrNull(form.closureEndAt)
      };

      if (editingFieldId) {
        await fieldService.updateField(editingFieldId, payload);
        if (imageFiles.length > 0) {
          await fieldService.uploadFieldImages(editingFieldId, imageFiles, { replaceExisting: true });
        }
        showToast('Field updated.', { type: 'success' });
      } else {
        const created = await fieldService.createField(payload);
        const createdId = created?.data?.id;
        if (createdId && imageFiles.length > 0) {
          await fieldService.uploadFieldImages(createdId, imageFiles);
        }
        showToast('Field created.', { type: 'success' });
      }

      await loadFields();
      resetForm();
    } catch (err) {
      showToast(err?.error || 'Failed to save field', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (field) => {
    const confirmed = await confirm(`Delete "${field.name}"?`, { title: 'Delete Field' });
    if (!confirmed) return;

    try {
      setSaving(true);
      await fieldService.deleteField(field.id);
      showToast('Field deleted.', { type: 'success' });
      await loadFields();
    } catch (err) {
      showToast(err?.error || 'Failed to delete field', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFieldStatus = async (field) => {
    const isCurrentlyOpen = (field?.status || 'available') === 'available';
    const nextStatus = isCurrentlyOpen ? 'unavailable' : 'available';

    const confirmed = await confirm(
      isCurrentlyOpen
        ? `Close "${field.name}" for now? Players will not be able to create new bookings.`
        : `Open "${field.name}" for booking again?`,
      { title: isCurrentlyOpen ? 'Close Field' : 'Open Field' }
    );
    if (!confirmed) return;

    try {
      setSaving(true);

      await fieldService.updateField(field.id, {
        status: nextStatus,
        closureMessage: nextStatus === 'available' ? null : field?.closureMessage || 'Temporarily closed by field owner.',
        closureStartAt: nextStatus === 'available' ? null : new Date().toISOString(),
        closureEndAt: nextStatus === 'available' ? null : field?.closureEndAt || null
      });

      showToast(nextStatus === 'available' ? 'Field is now open for booking.' : 'Field is now closed for booking.', { type: 'success' });
      await loadFields();
    } catch (err) {
      showToast(err?.error || 'Failed to update field status', { type: 'error' });
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
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Fields</h1>
          <p className="mt-1 text-sm text-gray-600">Create, edit, and manage your field listings.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add Field
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-32px)] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.24)] md:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  {editingFieldId ? 'Edit Field' : 'Create Field'}
                </span>
                <h2 className="mt-3 text-2xl font-bold text-gray-900">
                  {editingFieldId ? 'Update Field Information' : 'Add a New Field'}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                x
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Field Name</span>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Field name" className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Price Per Hour</span>
                <input name="pricePerHour" type="number" value={form.pricePerHour} onChange={handleChange} placeholder="Price per hour" className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Capacity</span>
                <input name="capacity" type="number" value={form.capacity} onChange={handleChange} placeholder="Capacity" className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Discount Percent</span>
                <input name="discountPercent" type="number" min="0" max="100" value={form.discountPercent} onChange={handleChange} placeholder="0" className="w-full rounded-xl border border-gray-300 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Field Type</span>
                <select name="fieldType" value={form.fieldType} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3">
                  <option value="5v5">5v5</option>
                  <option value="7v7">7v7</option>
                  <option value="11v11">11v11</option>
                  <option value="futsal">Futsal</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Surface Type</span>
                <select name="surfaceType" value={form.surfaceType} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3">
                  <option value="artificial_turf">Artificial Turf</option>
                  <option value="natural_grass">Natural Grass</option>
                  <option value="concrete">Concrete</option>
                  <option value="indoor">Indoor</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Status</span>
                <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3">
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Amenities</span>
                <input name="amenities" value={form.amenities} onChange={handleChange} placeholder="parking, showers, lights" className="w-full rounded-xl border border-gray-300 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Field Status</span>
                <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3">
                  <option value="available">Open</option>
                  <option value="unavailable">Closed</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>
            </div>

            {form.status !== 'available' && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-slate-700">Close Date</span>
                    <input
                      name="closureStartAt"
                      type="date"
                      value={form.closureStartAt}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-slate-700">Open Back Date</span>
                    <input
                      name="closureEndAt"
                      type="date"
                      value={form.closureEndAt}
                      min={form.closureStartAt || undefined}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3"
                    />
                  </label>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Reopen Presets</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CLOSURE_DAY_PRESETS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => applyClosureDaysPreset(days)}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        +{days} {days === 1 ? 'day' : 'days'}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block space-y-2">
                  <span className="block text-sm font-medium text-slate-700">Closure Message</span>
                  <textarea
                    name="closureMessage"
                    value={form.closureMessage}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    placeholder="Example: Closed for maintenance until 6 PM."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3"
                  />
                  <span className="block text-xs text-slate-500">This message is shown to users when booking is unavailable.</span>
                </label>
              </div>
            )}

            <div className="mt-5">
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
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <label htmlFor="field-images" className="block text-sm font-semibold text-slate-900">
                    Photos
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload up to 5 images. New uploads replace the current saved photos.
                  </p>
                </div>
                <label
                  htmlFor="field-images"
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  {existingImages.length > 0 ? 'Change Photos' : 'Upload Photos'}
                </label>
              </div>

              <input
                id="field-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="sr-only"
              />

              {imageFiles.length > 0 && (
                <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  {imageFiles.length} new image(s) selected
                </div>
              )}
              {imageFiles.length === 0 && existingImages.length > 0 && (
                <div className="mt-3 inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                  Showing current image(s)
                </div>
              )}

              {visibleImagePreviews.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleImagePreviews.map((image, index) => (
                    <div
                      key={`${image.url}-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <img src={image.url} alt={image.name} className="h-36 w-full object-cover" />
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-slate-600">{image.name}</p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                          {imageFiles.length > 0 ? 'New' : 'Current'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
                  No photos selected yet.
                </div>
              )}
            </div>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Field description"
              className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleFields.map((field) => {
          const images = normalizeImages(field.images);
          const coverImage = resolveFieldImageUrl(images[0]);
          const isOwned = isOwnedByCurrentUser(field, user);

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
              <div className="space-y-3 p-5">
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
        })}

        {fields.length === 0 && (
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
