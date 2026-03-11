import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CurrencyDollarIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhotoIcon,
  Squares2X2Icon,
  TrashIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import FieldLocationPicker from '../components/maps/FieldLocationPicker';
import fieldService from '../services/fieldService';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_FIELD_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%25" height="100%25" fill="%23e5e7eb"/></svg>';
const isPlaceholderImage = (rawImage) => String(rawImage || '').toLowerCase().includes('no field image');

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

const formatSurfaceLabel = (value) => {
  if (!value) return 'Not set';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const parseAmenities = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const OwnerFieldsPage = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [viewMode, setViewMode] = useState('mine');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [fieldPendingDelete, setFieldPendingDelete] = useState(null);
  const selectedImagePreviews = useMemo(
    () =>
      imageFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        url: URL.createObjectURL(file)
      })),
    [imageFiles]
  );

  const visibleFields = useMemo(() => {
    return viewMode === 'all' ? allFields : fields;
  }, [viewMode, allFields, fields]);

  const isOwnedByCurrentUser = useCallback(
    (field) => {
      const ownerId = field?.ownerId || field?.owner?.id;
      return Number(ownerId) === Number(user?.id);
    },
    [user?.id]
  );

  const fieldStats = useMemo(() => {
    const totalFields = visibleFields.length;
    const totalCapacity = visibleFields.reduce((sum, field) => sum + Number(field?.capacity || 0), 0);
    const averagePrice =
      totalFields > 0
        ? visibleFields.reduce((sum, field) => sum + Number(field?.pricePerHour || 0), 0) / totalFields
        : 0;

    return {
      totalFields,
      totalCapacity,
      averagePrice: averagePrice.toFixed(2)
    };
  }, [visibleFields]);

  const amenitiesList = useMemo(() => parseAmenities(form.amenities), [form.amenities]);

  const refresh = async () => {
    const [myRes, allRes] = await Promise.all([
      fieldService.getMyFields(),
      fieldService.getAllFields({ limit: 200 })
    ]);
    setFields(Array.isArray(myRes.data) ? myRes.data : []);
    setAllFields(Array.isArray(allRes.data) ? allRes.data : []);
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

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedImagePreviews]);

  const modalOpen = Boolean(isCreating || editingFieldId || fieldPendingDelete);

  useEffect(() => {
    if (!modalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  const startCreate = () => {
    setSuccessMessage(null);
    setError(null);
    setEditingFieldId(null);
    setForm(emptyForm);
    setAmenitiesInput('');
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
      latitude: field.latitude ?? '',
      longitude: field.longitude ?? '',
      pricePerHour: field.pricePerHour ?? '',
      capacity: field.capacity ?? '',
      fieldType: field.fieldType || '11v11',
      surfaceType: field.surfaceType || 'artificial_turf',
      amenities: Array.isArray(field.amenities) ? field.amenities.join(', ') : ''
    });
    setAmenitiesInput('');
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingFieldId(null);
    setForm(emptyForm);
    setAmenitiesInput('');
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

  const resolveFieldImageUrl = (rawImage) => {
    if (!rawImage || isPlaceholderImage(rawImage)) return DEFAULT_FIELD_IMAGE;
    if (/^https?:\/\//i.test(rawImage) || /^data:image\//i.test(rawImage)) return rawImage;
    if (String(rawImage).startsWith('/uploads/')) return `${API_ORIGIN}${rawImage}`;
    return rawImage;
  };

  const handleLocationChange = useCallback((locationData) => {
    setForm((prev) => ({
      ...prev,
      address: locationData.address || prev.address,
      city: locationData.city || prev.city,
      province: locationData.province || prev.province,
      latitude: locationData.latitude ?? '',
      longitude: locationData.longitude ?? ''
    }));
  }, []);

  const syncAmenities = useCallback((nextAmenities) => {
    setForm((prev) => ({
      ...prev,
      amenities: nextAmenities.join(', ')
    }));
  }, []);

  const addAmenity = useCallback(
    (rawValue) => {
      const amenity = String(rawValue || '').trim();
      if (!amenity) return;
      if (amenitiesList.some((item) => item.toLowerCase() === amenity.toLowerCase())) {
        setAmenitiesInput('');
        return;
      }
      syncAmenities([...amenitiesList, amenity]);
      setAmenitiesInput('');
    },
    [amenitiesList, syncAmenities]
  );

  const removeAmenity = useCallback(
    (amenityToRemove) => {
      syncAmenities(amenitiesList.filter((item) => item !== amenityToRemove));
    },
    [amenitiesList, syncAmenities]
  );

  const handleAmenitiesKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addAmenity(amenitiesInput);
    }

    if (event.key === 'Backspace' && !amenitiesInput && amenitiesList.length > 0) {
      removeAmenity(amenitiesList[amenitiesList.length - 1]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (!form.address || !form.city || !form.province) {
        setError('Please select your field on the map.');
        return;
      }

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

  const handleDelete = async () => {
    if (!fieldPendingDelete?.id) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMessage(null);
      await fieldService.deleteField(fieldPendingDelete.id);
      setSuccessMessage('Field deleted.');
      await refresh();
      setFieldPendingDelete(null);
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
          <button
            onClick={startCreate}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Field
          </button>
        </div>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-sky-500 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Total fields</p>
              <p className="mt-2 text-3xl font-bold">{fieldStats.totalFields}</p>
            </div>
            <Squares2X2Icon className="h-10 w-10 text-white/80" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average price</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">${fieldStats.averagePrice}</p>
            </div>
            <CurrencyDollarIcon className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total capacity</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{fieldStats.totalCapacity}</p>
            </div>
            <UsersIcon className="h-10 w-10 text-amber-500" />
          </div>
        </div>
      </div>

      {(isCreating || editingFieldId) && (
        <div
          className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/70"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="absolute inset-0" onClick={resetForm} />
          <div className="relative min-h-screen w-full md:flex md:items-start md:justify-center md:px-6 md:py-6">
            <form
              onSubmit={handleSubmit}
              className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f8fbff] shadow-2xl md:min-h-0 md:max-h-[calc(100vh-3rem)] md:max-w-5xl md:rounded-[32px]"
            >
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur sm:px-7 md:rounded-t-[32px]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Field Studio</p>
                  <h2 className="mt-1 text-xl font-semibold text-gray-900">
                    {editingFieldId ? 'Edit Field' : 'Create Field'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {editingFieldId ? 'Update your field details and photos.' : 'Add a new field for booking.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-slate-50 hover:text-gray-900"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7" style={{ scrollbarWidth: 'none' }}>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                  <div className="space-y-6">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-base font-semibold text-slate-900">Field Details</h3>
                      <p className="mt-1 text-sm text-slate-500">Basic information people will see before they book.</p>

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5"
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
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5"
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
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Field Type</label>
                          <select
                            name="fieldType"
                            value={form.fieldType}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5"
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
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5"
                          >
                            <option value="artificial_turf">Artificial Turf</option>
                            <option value="natural_grass">Natural Grass</option>
                            <option value="concrete">Concrete</option>
                            <option value="indoor">Indoor</option>
                          </select>
                        </div>
                      </div>
                    </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
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
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Description</h3>
                  <p className="mt-1 text-sm text-slate-500">Tell players what makes this field worth booking.</p>
                  <textarea
                    name="description"
                    rows={4}
                    value={form.description}
                    onChange={handleChange}
                    className="mt-4 block w-full rounded-2xl border border-gray-300 px-3 py-3"
                    placeholder="Clean pitch, strong lights, easy parking, changing rooms..."
                  />
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Amenities</h3>
                  <p className="mt-1 text-sm text-slate-500">Type an amenity and press Enter or comma to add it.</p>
                  <div className="mt-4 rounded-2xl border border-gray-300 bg-white px-3 py-3 focus-within:border-blue-400">
                    <div className="flex flex-wrap gap-2">
                      {amenitiesList.map((amenity) => (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => removeAmenity(amenity)}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                          title={`Remove ${amenity}`}
                        >
                          <span>{amenity}</span>
                          <span className="text-slate-400">x</span>
                        </button>
                      ))}
                      <input
                        value={amenitiesInput}
                        onChange={(event) => setAmenitiesInput(event.target.value)}
                        onKeyDown={handleAmenitiesKeyDown}
                        onBlur={() => addAmenity(amenitiesInput)}
                        className="min-w-[180px] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-slate-900 outline-none"
                        placeholder={amenitiesList.length === 0 ? 'parking, showers, floodlights' : 'Add another amenity'}
                      />
                    </div>
                  </div>
                </section>
                  </div>

                  <div className="space-y-6">
                    <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-600 to-sky-500 p-5 text-white shadow-sm">
                  <h3 className="text-base font-semibold">Photos</h3>
                  <p className="mt-1 text-sm text-blue-100">Upload up to 5 images. The first one becomes the main cover.</p>

                  <label className="relative mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-white/30 bg-white/10 px-6 py-10 text-center backdrop-blur transition hover:bg-white/15">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <PhotoIcon className="h-14 w-14 text-white/80" />
                    <p className="mt-3 text-sm font-semibold text-white">Choose field photos</p>
                    <p className="mt-1 text-xs text-blue-100">PNG, JPG, WEBP</p>
                  </label>

                  {editingFieldId && (
                    <p className="mt-3 text-xs text-blue-100/90">Uploading new photos will replace the existing gallery.</p>
                  )}
                </section>

                    {selectedImagePreviews.length > 0 && (
                      <section className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Selected Photos</h3>
                        <p className="mt-1 text-sm text-slate-500">Preview before saving.</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {selectedImagePreviews.length} selected
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedImagePreviews.map((preview, index) => (
                        <div
                          key={preview.id}
                          className="flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="h-20 w-24 flex-shrink-0 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-medium text-slate-700"
                              title={preview.name}
                            >
                              {index === 0 ? 'Cover photo' : `Photo ${index + 1}`}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-slate-500" title={preview.name}>
                              {index === 0 ? 'Will be cover photo' : 'Selected upload'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                    {editingFieldId && currentImages.length > 0 && (
                      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900">Current Photos</h3>
                    <p className="mt-1 text-sm text-slate-500">Choose which existing image should stay as the cover.</p>
                    <div className="mt-4 space-y-3">
                      {currentImages.map((img, index) => (
                        <div
                          key={`${img}-${index}`}
                          className={`flex items-center gap-3 overflow-hidden rounded-2xl border p-3 ${
                            index === 0 ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={resolveFieldImageUrl(img)}
                            alt={`Field ${index + 1}`}
                            className="h-20 w-24 flex-shrink-0 rounded-xl object-cover"
                            onError={(e) => {
                              if (e.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                                e.currentTarget.src = DEFAULT_FIELD_IMAGE;
                              }
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-medium text-slate-700"
                              title={index === 0 ? 'Cover photo' : `Photo ${index + 1}`}
                            >
                              {index === 0 ? 'Cover photo' : `Photo ${index + 1}`}
                            </p>
                            {index === 0 ? (
                              <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                Current cover photo
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCover(index)}
                                disabled={actionLoading}
                                className="mt-2 rounded-lg border border-gray-300 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Set as cover
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur sm:px-7 md:rounded-b-[32px]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your fields</h2>
            <p className="mt-1 text-sm text-gray-500">Manage each field from a visual card instead of a table row.</p>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {visibleFields.length} field{visibleFields.length === 1 ? '' : 's'}
          </div>
        </div>

        {visibleFields.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {visibleFields.map((f) => {
              const images = normalizeImages(f.images);
              const amenities = Array.isArray(f.amenities) ? f.amenities : [];
              const isOwned = isOwnedByCurrentUser(f);

              return (
                <div
                  key={f.id}
                  className="overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={resolveFieldImageUrl(images[0])}
                      alt={f.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_FIELD_IMAGE) {
                          e.currentTarget.src = DEFAULT_FIELD_IMAGE;
                        }
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent px-5 pb-4 pt-10">
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-xl font-bold text-white">{f.name}</h3>
                          <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-white/85">
                            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="block min-w-0 truncate">
                              {f.address}, {f.city}
                            </span>
                          </p>
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900">
                          {images.length} photo{images.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Price</p>
                        <p className="mt-1 flex items-center gap-1 text-base font-semibold text-gray-900">
                          <CurrencyDollarIcon className="h-4 w-4 text-emerald-500" />
                          ${f.pricePerHour}/hr
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Capacity</p>
                        <p className="mt-1 flex items-center gap-1 text-base font-semibold text-gray-900">
                          <UsersIcon className="h-4 w-4 text-amber-500" />
                          {f.capacity} players
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${isOwned ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {isOwned ? 'Your field' : 'Other owner'}
                      </span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {f.fieldType || 'Field'}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {formatSurfaceLabel(f.surfaceType)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {f.province}
                      </span>
                      {Number.isFinite(Number(f.latitude)) && Number.isFinite(Number(f.longitude)) && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Map ready
                        </span>
                      )}
                    </div>

                    {f.description && (
                      <p className="text-sm leading-6 text-gray-600 break-words">
                        {f.description}
                      </p>
                    )}

                    {amenities.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Amenities</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {amenities.slice(0, 5).map((amenity) => (
                            <span
                              key={`${f.id}-${amenity}`}
                              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
                            >
                              {amenity}
                            </span>
                          ))}
                          {amenities.length > 5 && (
                            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                              +{amenities.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                      <button
                        disabled={actionLoading || !isOwned}
                        onClick={() => startEdit(f)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        disabled={actionLoading || !isOwned}
                        onClick={() => setFieldPendingDelete(f)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Squares2X2Icon className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No fields yet</h3>
            <p className="mt-2 text-sm text-gray-500">Create your first field to start receiving bookings.</p>
            <button
              type="button"
              onClick={startCreate}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Add Field
            </button>
          </div>
        )}
      </div>

      {fieldPendingDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="absolute inset-0" onClick={() => setFieldPendingDelete(null)} />
          <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <TrashIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Delete Field?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This will remove <span className="font-semibold text-slate-900">{fieldPendingDelete.name}</span> from your fields.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFieldPendingDelete(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerFieldsPage;
