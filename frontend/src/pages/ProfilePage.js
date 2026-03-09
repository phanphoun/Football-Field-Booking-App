import React, { useEffect, useMemo, useState } from 'react';
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
  BookmarkSquareIcon,
  UserGroupIcon,
  ClockIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_AVATAR_PATH = '/uploads/profile/default_profile.jpg';
const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const inputClass =
  'mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500';

const ProfilePage = () => {
  const { user, updateProfile, uploadAvatar, deleteAvatar, changePassword, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
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
    gender: user?.gender || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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
      const { currentPassword, newPassword, confirmPassword, ...profileData } = formData;
      const payload = {
        ...profileData,
        phone: profileData.phone?.trim() || '',
        address: profileData.address?.trim() || '',
        dateOfBirth: profileData.dateOfBirth || '',
        gender: profileData.gender || ''
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setSuccessMessage(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setProfileError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setProfileError('Password must be at least 6 characters long');
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      if (!result.success) {
        setProfileError(result.error || 'Failed to change password');
        return;
      }

      setSuccessMessage('Password changed successfully!');
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setShowPasswordSection(false);
    } catch (err) {
      setProfileError(err?.error || 'Failed to change password');
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

    try {
      const result = await authService.requestFieldOwnerRole(requestData);
      if (result.success) {
        setRequestSuccess('Request submitted successfully. Waiting for admin approval.');
        setRequestPending(true);
        setShowRequestForm(false);
      } else {
        setRequestError(result.message || 'Failed to submit request');
      }
    } catch (err) {
      setRequestError(err.message || 'Failed to submit request');
    }
  };

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || 'Unknown User';

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
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

          {showPasswordSection && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className={`${inputClass} pr-10`}
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`${inputClass} pr-10`}
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <LockClosedIcon className="h-4 w-4" />
                Update Password
              </button>
            </form>
          )}
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Need Help?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Contact our priority field owner support line for assistance.
          </p>
          <a
            href="mailto:support@fieldmanager.com?subject=Field%20Owner%20Support%20Request"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
