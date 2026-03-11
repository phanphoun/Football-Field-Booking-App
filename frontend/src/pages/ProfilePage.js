<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from 'react';
=======
import React, { useEffect, useState } from 'react';
>>>>>>> 9f39085887a02703fc3c851c1aea50621613f89f
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bookingService from '../services/bookingService';
import teamService from '../services/teamService';
import {
  ArrowRightOnRectangleIcon,
  BookmarkSquareIcon,
  CalendarIcon,
  CameraIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserGroupIcon,
<<<<<<< HEAD
  ClockIcon
=======
  UserIcon
>>>>>>> 9f39085887a02703fc3c851c1aea50621613f89f
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_AVATAR_PATH = '/uploads/profile/default_profile.jpg';
const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const getInitialFormData = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  phone: user?.phone || '',
  address: user?.address || '',
  dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
  gender: user?.gender || ''
});

const formatDate = (value) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not specified' : date.toLocaleDateString();
};

const ProfilePage = () => {
  const { user, updateProfile, uploadAvatar, deleteAvatar, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(getInitialFormData(user));
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ totalBookings: 0, totalTeams: 0 });
  const [avatarPreview, setAvatarPreview] = useState(null);
<<<<<<< HEAD
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    totalTeams: 0,
    memberSince: 'Unknown',
    yearsActive: 0,
    fieldEfficiency: 0
  });

  // request field owner UI state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    fieldName: '',
    location: '',
    phone: '',
    description: ''
  });
  const [requestError, setRequestError] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(null);
  const [requestPending, setRequestPending] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || ''
  });
=======
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
>>>>>>> 9f39085887a02703fc3c851c1aea50621613f89f

  useEffect(() => {
    setFormData(getInitialFormData(user));
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      const [bookingsResult, teamsResult] = await Promise.allSettled([
        bookingService.getAllBookings({ limit: 1000 }),
        teamService.getMyTeams()
      ]);

      if (!active) return;

      setStats({
        totalBookings:
          bookingsResult.status === 'fulfilled' && Array.isArray(bookingsResult.value?.data)
            ? bookingsResult.value.data.length
            : 0,
        totalTeams:
          teamsResult.status === 'fulfilled' && Array.isArray(teamsResult.value?.data)
            ? teamsResult.value.data.length
            : 0
      });
    };

    loadStats();

    return () => {
      active = false;
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const resolvedAvatarUrl = (() => {
    if (avatarPreview) return avatarPreview;
    const rawAvatar = user?.avatarUrl || user?.avatar_url;
    if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_AVATAR_PATH}`;
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
    return `${API_ORIGIN}${normalizedPath}`;
  })();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const result = await updateProfile({
        ...formData,
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || ''
      });

      if (!result.success) {
        setError(result.error || 'Failed to update profile');
        return;
      }

      setSuccessMessage('Profile updated.');
      setIsEditing(false);
    } catch (err) {
      setError(err?.error || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError(`Avatar file size must be less than ${MAX_AVATAR_SIZE_MB}MB`);
      event.target.value = '';
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(URL.createObjectURL(file));

      const uploadData = new FormData();
      uploadData.append('avatar', file);
      const result = await uploadAvatar(uploadData);

      if (!result.success) {
        setError(result.error || 'Failed to upload avatar');
        return;
      }

      setAvatarPreview(null);
      setSuccessMessage('Profile photo updated.');
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to upload avatar');
    } finally {
      event.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    try {
      setError('');
      setSuccessMessage('');
      const result = await deleteAvatar();
      if (!result.success) {
        setError(result.error || 'Failed to remove avatar');
        return;
      }
      setAvatarPreview(null);
      setSuccessMessage('Profile photo removed.');
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to remove avatar');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

<<<<<<< HEAD
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  // Handlers for request form
  const handleRequestChange = (e) => {
    setRequestData({
      ...requestData,
      [e.target.name]: e.target.value
    });
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestError(null);
    setRequestSuccess(null);

    // simple validation
    if (!requestData.fieldName.trim()) {
      setRequestError('Field name is required.');
      return;
    }
    if (!requestData.location.trim()) {
      setRequestError('Location is required.');
      return;
    }

    setRequestPending(true);
    try {
      const result = await authService.requestFieldOwnerRole(requestData);
      if (result.success) {
        setRequestSuccess('Request submitted successfully. Waiting for admin approval.');
        setShowRequestForm(false);
        setRequestData({ fieldName: '', location: '', phone: '', description: '' });
      } else {
        setRequestError(result.error || result.message || 'Failed to submit request');
        setRequestPending(false);
      }
    } catch (err) {
      console.error('Request error:', err);
      setRequestError(err.error || err.message || 'Failed to submit request');
      setRequestPending(false);
    }
  };

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || 'Unknown User';

=======
>>>>>>> 9f39085887a02703fc3c851c1aea50621613f89f
  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={resolvedAvatarUrl}
                alt="Profile avatar"
                className="h-24 w-24 rounded-full border-4 border-emerald-100 object-cover"
                onError={(event) => {
                  const fallbackUrl = `${API_ORIGIN}${DEFAULT_AVATAR_PATH}`;
                  if (event.currentTarget.src !== fallbackUrl) {
                    event.currentTarget.src = fallbackUrl;
                  }
                }}
              />
              <label className="absolute bottom-0 right-0 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                <CameraIcon className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Unknown User'}
              </h1>
              <p className="text-sm text-gray-500">{user?.role?.replace('_', ' ') || 'guest'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <PencilSquareIcon className="h-4 w-4" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button
              type="button"
              onClick={handleAvatarDelete}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              Remove Photo
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {profileError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{profileError}</div>
      )}
      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      {/* role upgrade section */}
      {user && user.role !== 'field_owner' && !user.role.startsWith('admin') && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-gray-900">Role Upgrade</h2>
          {requestPending && (
            <p className="mb-2 text-sm text-orange-700">Your request is pending approval.</p>
          )}
          {requestSuccess && (
            <p className="mb-2 text-sm text-green-700">{requestSuccess}</p>
          )}
          {requestError && (
            <p className="mb-2 text-sm text-red-700">{requestError}</p>
          )}

          {!requestPending && !requestSuccess && !showRequestForm && (
            <button
              type="button"
              onClick={() => setShowRequestForm(true)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Request Field Owner
            </button>
          )}

          {showRequestForm && (
            <form onSubmit={handleRequestSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="fieldName" className="block text-sm font-medium text-gray-700">
                  Field Name
                </label>
                <input
                  id="fieldName"
                  name="fieldName"
                  value={requestData.fieldName}
                  onChange={handleRequestChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  value={requestData.location}
                  onChange={handleRequestChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={requestData.phone}
                  onChange={handleRequestChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={requestData.description}
                  onChange={handleRequestChange}
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    setRequestError(null);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Personal Information</h2>
=======
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
>>>>>>> 9f39085887a02703fc3c851c1aea50621613f89f

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className="rounded-lg border border-gray-300 px-3 py-2" />
                <select name="gender" value={formData.gender} onChange={handleChange} className="rounded-lg border border-gray-300 px-3 py-2">
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={4}
                placeholder="Address"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Full Name</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <UserIcon className="h-4 w-4 text-emerald-600" />
                  {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Unknown User'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <EnvelopeIcon className="h-4 w-4 text-emerald-600" />
                  {user?.email || 'Not specified'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <PhoneIcon className="h-4 w-4 text-emerald-600" />
                  {user?.phone || 'Not specified'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Date of Birth</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  {formatDate(user?.dateOfBirth)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Address</p>
                <p className="mt-2 inline-flex items-start gap-2 text-sm font-medium text-gray-900">
                  <MapPinIcon className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{user?.address || 'Not specified'}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Account Statistics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <BookmarkSquareIcon className="h-4 w-4 text-blue-500" />
                  Total Bookings
                </span>
                <span className="text-sm font-bold text-gray-900">{stats.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <UserGroupIcon className="h-4 w-4 text-violet-500" />
                  Teams
                </span>
                <span className="text-sm font-bold text-gray-900">{stats.totalTeams}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
