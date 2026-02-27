import React, { useEffect, useState } from 'react';
import fieldService from '../services/fieldService';

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
    setIsCreating(true);
  };

  const startEdit = (field) => {
    setSuccessMessage(null);
    setError(null);
    setIsCreating(false);
    setEditingFieldId(field.id);
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
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        setSuccessMessage('Field updated.');
      } else {
        await fieldService.createField(payload);
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
                <div>
                  <div className="text-sm font-medium text-gray-900">{f.name}</div>
                  <div className="text-xs text-gray-500">
                    {f.address}, {f.city} • ${f.pricePerHour}/hr
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
