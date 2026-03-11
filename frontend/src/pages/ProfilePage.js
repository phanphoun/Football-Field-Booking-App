import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import {
  CameraIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  BookmarkSquareIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_AVATAR_PATH = '/uploads/profile/default_profile.jpg';
const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const inputClass =
  'mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500';

const ProfilePage = () => {
  const { user, updateProfile, uploadAvatar, deleteAvatar, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
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

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        const response = await authService.getProfileStats();
        const data = response?.data || {};

        if (!active) return;
        setStats({
          totalBookings: Number(data.totalBookings || 0),
          confirmedBookings: Number(data.confirmedBookings || 0),
          totalTeams: Number(data.teamsManaged || 0),
          memberSince: data.memberSince || 'Unknown',
          yearsActive: Number(data.yearsActive || 0),
          fieldEfficiency: Number(data.fieldEfficiency || 0)
        });
      } catch {
        if (!active) return;
        setStats({
          totalBookings: 0,
          confirmedBookings: 0,
          totalTeams: 0,
          memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
          yearsActive: 0,
          fieldEfficiency: 0
        });
      }
    };

    loadStats();

    return () => {
      active = false;
    };
  }, [user?.id, user?.createdAt]);

  const resolvedAvatarUrl = (() => {
    if (avatarPreview) return avatarPreview;
    const rawAvatar = user?.avatarUrl || user?.avatar_url;
    if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_AVATAR_PATH}`;
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
    return `${API_ORIGIN}${normalizedPath}`;
  })();

  const yearsActive = useMemo(() => Number(stats.yearsActive || 0), [stats.yearsActive]);
  const efficiencyScore = useMemo(() => Number(stats.fieldEfficiency || 0), [stats.fieldEfficiency]);

  const profileLastUpdated = useMemo(() => {
    if (!user?.updatedAt) return 'Unknown';
    const updated = new Date(user.updatedAt);
    if (Number.isNaN(updated.getTime())) return 'Unknown';
    return updated.toLocaleDateString();
  }, [user?.updatedAt]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        ...formData,
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || '',
        dateOfBirth: formData.dateOfBirth || '',
        gender: formData.gender || ''
      };

      const result = await updateProfile(payload);
      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setProfileError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError(err.error || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileError(null);
    setSuccessMessage(null);

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select an image file');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setProfileError(`Avatar file size must be less than ${MAX_AVATAR_SIZE_MB}MB`);
      e.target.value = '';
      return;
    }

    try {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(URL.createObjectURL(file));

      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      const result = await uploadAvatar(formDataUpload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      setAvatarPreview(null);
      setSuccessMessage('Profile picture updated successfully!');
    } catch (err) {
      setProfileError(err.message || err.error || 'Failed to upload avatar');
    } finally {
      e.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    setProfileError(null);
    setSuccessMessage(null);

    try {
      const result = await deleteAvatar();
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove avatar');
      }
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      setSuccessMessage('Profile picture removed successfully!');
    } catch (err) {
      setProfileError(err.message || err.error || 'Failed to remove avatar');
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Do you want to logout?');
    if (!confirmed) return;
    logout();
    navigate('/login');
  };

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your personal information and account settings
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {profileError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {profileError}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
            <div className="text-center">
              <div className="mx-auto h-28 w-28 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center overflow-hidden border-2 border-emerald-100 shadow-sm">
                {resolvedAvatarUrl ? (
                  <img
                    src={resolvedAvatarUrl}
                    alt={`${fullName} avatar`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <UserIcon className="h-10 w-10 text-gray-500" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                <CameraIcon className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-sm font-medium text-emerald-600 capitalize">
                {user?.role?.replace('_', ' ') || 'Guest'}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                <ClockIcon className="h-3.5 w-3.5" />
                Active since {stats.memberSince}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <PencilSquareIcon className="h-4 w-4" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button
              type="button"
              onClick={handleAvatarDelete}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              Remove Photo
            </button>
          </div>
        </div>
      </div>

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

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="text-xs font-semibold uppercase text-gray-500">
                    First Name
                  </label>
                  <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="lastName" className="text-xs font-semibold uppercase text-gray-500">
                    Last Name
                  </label>
                  <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="email" className="text-xs font-semibold uppercase text-gray-500">
                    Email
                  </label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="phone" className="text-xs font-semibold uppercase text-gray-500">
                    Phone
                  </label>
                  <input id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="text-xs font-semibold uppercase text-gray-500">
                    Date of Birth
                  </label>
                  <input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="gender" className="text-xs font-semibold uppercase text-gray-500">
                    Gender
                  </label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="text-xs font-semibold uppercase text-gray-500">
                  Address
                </label>
                <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} className={inputClass} />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-emerald-600" />
                    {fullName}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-emerald-600" />
                    {user?.phone || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Physical Address</p>
                  <p className="text-sm font-medium text-gray-900 inline-flex items-start gap-2">
                    <MapPinIcon className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{user?.address || 'Not specified'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Account Type</p>
                  <p className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {user?.role?.replace('_', ' ') || 'guest'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Email Address</p>
                  <p className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4 text-emerald-600" />
                    {user?.email || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-emerald-600" />
                    {formatDate(user?.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Gender</p>
                  <p className="text-sm font-medium capitalize text-gray-900">{user?.gender || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Account Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <BookmarkSquareIcon className="h-4 w-4 text-blue-500" />
                Total Bookings
              </span>
              <span className="text-sm font-bold text-gray-900">{stats.totalBookings}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <UserGroupIcon className="h-4 w-4 text-violet-500" />
                Teams Managed
              </span>
              <span className="text-sm font-bold text-gray-900">{stats.totalTeams}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <ShieldCheckIcon className="h-4 w-4 text-orange-500" />
                Years Active
              </span>
              <span className="text-sm font-bold text-gray-900">{yearsActive}</span>
            </div>
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span>Field Efficiency</span>
                <span className="font-semibold text-emerald-600">{efficiencyScore}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${efficiencyScore}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Security & Password</h2>
            <button
              type="button"
              onClick={() => setShowPasswordSection((prev) => !prev)}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
            >
              {showPasswordSection ? 'Close' : 'Change Password'}
            </button>
          </div>
          <p className="mb-4 text-xs text-gray-500">Profile last updated: {profileLastUpdated}</p>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
