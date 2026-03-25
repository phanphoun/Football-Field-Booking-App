import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, PencilSquareIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import FieldLocationPicker from '../components/maps/FieldLocationPicker';
import fieldService from '../services/fieldService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDialog, useToast } from '../components/ui';

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
  discountPercent: '',
  capacity: '',
  status: 'available',
  fieldType: '11v11',
  surfaceType: 'artificial_turf',
  amenities: ''
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

const OwnerFieldsPage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const text = useCallback((en, km) => (language === 'km' ? km : en), [language]);
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [viewMode, setViewMode] = useState('mine');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
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
        await loadFields();
      } catch (err) {
        showToast(err?.error || text('Failed to load fields', 'មិនអាចផ្ទុកទីលានបានទេ'), { type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadFields, showToast, text]);

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
      amenities: Array.isArray(field.amenities) ? field.amenities.join(', ') : ''
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

  const formatFieldStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'available') return text('Available', 'ទំនេរ');
    if (normalized === 'booked') return text('Booked', 'បានកក់');
    if (normalized === 'maintenance') return text('Maintenance', 'កំពុងជួសជុល');
    if (normalized === 'unavailable') return text('Unavailable', 'មិនអាចប្រើបាន');
    return status || text('Available', 'ទំនេរ');
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
        amenities: form.amenities ? form.amenities.split(',').map((item) => item.trim()).filter(Boolean) : []
      };

      if (editingFieldId) {
        await fieldService.updateField(editingFieldId, payload);
        if (imageFiles.length > 0) {
          await fieldService.uploadFieldImages(editingFieldId, imageFiles, { replaceExisting: true });
        }
        showToast(text('Field updated.', 'បានកែប្រែទីលាន។'), { type: 'success' });
      } else {
        const created = await fieldService.createField(payload);
        const createdId = created?.data?.id;
        if (createdId && imageFiles.length > 0) {
          await fieldService.uploadFieldImages(createdId, imageFiles);
        }
        showToast(text('Field created.', 'បានបង្កើតទីលាន។'), { type: 'success' });
      }

      await loadFields();
      resetForm();
    } catch (err) {
      showToast(err?.error || text('Failed to save field', 'មិនអាចរក្សាទុកទីលានបានទេ'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (field) => {
    const confirmed = await confirm(text(`Delete "${field.name}"?`, `លុប "${field.name}" មែនទេ?`), { title: text('Delete Field', 'លុបទីលាន') });
    if (!confirmed) return;

    try {
      setSaving(true);
      await fieldService.deleteField(field.id);
      showToast(text('Field deleted.', 'បានលុបទីលាន។'), { type: 'success' });
      await loadFields();
    } catch (err) {
      showToast(err?.error || text('Failed to delete field', 'មិនអាចលុបទីលានបានទេ'), { type: 'error' });
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
           <h1 className="text-2xl font-bold text-gray-900">{text('My Fields', 'ទីលានរបស់ខ្ញុំ')}</h1>
           <p className="mt-1 text-sm text-gray-600">{text('Create and manage your football fields, or view all fields.', 'បង្កើត និងគ្រប់គ្រងទីលានបាល់ទាត់របស់អ្នក ឬមើលទីលានទាំងអស់។')}</p>
         </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setViewMode('mine')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === 'mine' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              {text('My Fields', 'ទីលានរបស់ខ្ញុំ')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              {text('All Fields', 'ទីលានទាំងអស់')}
            </button>
          </div>
          <button onClick={startCreate} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            {text('Add Field', 'បន្ថែមទីលាន')}
          </button>
        </div>
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
                  {editingFieldId ? text('Edit Field', 'កែទីលាន') : text('Create Field', 'បង្កើតទីលាន')}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold text-gray-900">
                  {editingFieldId ? text('Update Field Information', 'កែព័ត៌មានទីលាន') : text('Add a New Field', 'បន្ថែមទីលានថ្មី')}
                  </h2>
                </div>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">{text('Field Name', 'ឈ្មោះទីលាន')}</span>
                <input name="name" value={form.name} onChange={handleChange} placeholder={text('Field name', 'ឈ្មោះទីលាន')} className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">{text('Price Per Hour', 'តម្លៃក្នុងមួយម៉ោង')}</span>
                <input name="pricePerHour" type="number" value={form.pricePerHour} onChange={handleChange} placeholder={text('Price per hour', 'តម្លៃក្នុងមួយម៉ោង')} className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">{text('Capacity', 'ចំណុះ')}</span>
                <input name="capacity" type="number" value={form.capacity} onChange={handleChange} placeholder={text('Capacity', 'ចំណុះ')} className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">{text('Discount Percent', 'ភាគរយបញ្ចុះតម្លៃ')}</span>
                <input name="discountPercent" type="number" min="0" max="100" value={form.discountPercent} onChange={handleChange} placeholder="0" className="w-full rounded-xl border border-gray-300 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">{text('Field Type', 'ប្រភេទទីលាន')}</span>
                <select name="fieldType" value={form.fieldType} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3">
                  <option value="5v5">5v5</option>
                  <option value="7v7">7v7</option>
                  <option value="11v11">11v11</option>
                  <option value="futsal">{text('Futsal', 'ហ្វូតសាល')}</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">{text('Surface Type', 'ប្រភេទផ្ទៃ')}</span>
                <select name="surfaceType" value={form.surfaceType} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3">
                  <option value="artificial_turf">{text('Artificial Turf', 'ស្មៅសិប្បនិម្មិត')}</option>
                  <option value="natural_grass">{text('Natural Grass', 'ស្មៅធម្មជាតិ')}</option>
                  <option value="concrete">{text('Concrete', 'បេតុង')}</option>
                  <option value="indoor">{text('Indoor', 'ក្នុងសាល')}</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">{text('Status', 'ស្ថានភាព')}</span>
                <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-gray-300 px-4 py-3">
                  <option value="available">{text('Available', 'ទំនេរ')}</option>
                  <option value="maintenance">{text('Maintenance', 'កំពុងជួសជុល')}</option>
                  <option value="unavailable">{text('Unavailable', 'មិនអាចប្រើបាន')}</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">{text('Amenities', 'សេវាកម្មបន្ថែម')}</span>
                <input name="amenities" value={form.amenities} onChange={handleChange} placeholder={text('parking, showers, lights', 'ចំណតឡាន កន្លែងងូតទឹក ភ្លើង')} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
              </label>
            </div>

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
                    {text('Photos', 'រូបភាព')}
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    {text('Upload up to 5 images. New uploads replace the current saved photos.', 'អាប់ឡូដបានរហូតដល់ 5 រូប។ រូបថ្មីនឹងជំនួសរូបដែលបានរក្សាទុកបច្ចុប្បន្ន។')}
                  </p>
                </div>
                <label
                  htmlFor="field-images"
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  {existingImages.length > 0 ? text('Change Photos', 'ប្ដូររូបភាព') : text('Upload Photos', 'អាប់ឡូដរូបភាព')}
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
                  {text(`${imageFiles.length} new image(s) selected`, `បានជ្រើសរើសរូបថ្មី ${imageFiles.length}`)}
                </div>
              )}
              {imageFiles.length === 0 && existingImages.length > 0 && (
                <div className="mt-3 inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                  {text('Showing current image(s)', 'កំពុងបង្ហាញរូបបច្ចុប្បន្ន')}
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
                          {imageFiles.length > 0 ? text('New', 'ថ្មី') : text('Current', 'បច្ចុប្បន្ន')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
                  {text('No photos selected yet.', 'មិនទាន់បានជ្រើសរើសរូបភាពនៅឡើយទេ។')}
                </div>
              )}
            </div>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder={text('Field description', 'ការពិពណ៌នាអំពីទីលាន')}
              className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700">
                {text('Cancel', 'បោះបង់')}
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? text('Saving...', 'កំពុងរក្សាទុក...') : text('Save', 'រក្សាទុក')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleFields.length > 0 ? (
          visibleFields.map((field) => {
            const images = normalizeImages(field.images);
            const coverImage = resolveFieldImageUrl(images[0]);
            const isOwned = isOwnedByCurrentUser(field);
            const discountPercent = getDiscountPercent(field);
            const discountedPrice = getDiscountedHourlyPrice(field);
            const fieldStatus = String(field.status || 'available').toLowerCase();
            const statusClasses =
              fieldStatus === 'available'
                ? 'bg-blue-50 text-blue-700'
                : fieldStatus === 'booked'
                ? 'bg-red-100 text-red-700'
                : fieldStatus === 'maintenance'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-200 text-slate-700';

            return (
              <div
                key={field.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/fields/${field.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/fields/${field.id}`);
                  }
                }}
                className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <div className="relative h-48 w-full overflow-hidden">
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
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize shadow-sm backdrop-blur ${statusClasses} bg-opacity-95`}>
                        {formatFieldStatus(fieldStatus)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{field.name}</h3>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4" />
                      {field.address}, {field.city}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex flex-col">
                      {discountPercent > 0 ? (
                        <>
                          <span className="text-base font-semibold text-emerald-600">${discountedPrice}/{text('hr', 'ម៉ោង')}</span>
                          <span className="text-xs text-gray-400 line-through">${field.pricePerHour}/{text('hr', 'ម៉ោង')}</span>
                        </>
                      ) : (
                        <span>${field.pricePerHour}/{text('hr', 'ម៉ោង')}</span>
                      )}
                    </div>
                    <span>{text(`${field.capacity} players`, `${field.capacity} នាក់`)}</span>
                  </div>
                  {field.description && <p className="text-sm text-gray-600">{field.description}</p>}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEdit(field);
                      }}
                      disabled={!isOwned || saving}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      {text('Edit', 'កែប្រែ')}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(field);
                      }}
                      disabled={!isOwned || saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {text('Delete', 'លុប')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
            <PhotoIcon className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">{text('No fields yet', 'មិនទាន់មានទីលាន')}</h3>
            <p className="mt-2 text-sm text-gray-500">{text('Create your first field to start receiving bookings.', 'បង្កើតទីលានដំបូងរបស់អ្នកដើម្បីចាប់ផ្តើមទទួលការកក់។')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerFieldsPage;
