import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserIcon,
  CameraIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  LockClosedIcon,
  BookmarkSquareIcon,
  UserGroupIcon
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
  const { user, updateProfile, uploadAvatar, deleteAvatar, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
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

  const resolvedAvatarUrl = (() => {
    if (avatarPreview) return avatarPreview;
    const rawAvatar = user?.avatarUrl || user?.avatar_url;
    if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_AVATAR_PATH}`;
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
    return `${API_ORIGIN}${normalizedPath}`;
  })();

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
      setSuccessMessage('Password change feature coming soon!');
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setProfileError('Failed to change password');
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

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      field_owner: 'bg-sky-50 text-sky-700 border border-sky-100',
      captain: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      player: 'bg-amber-50 text-amber-700 border border-amber-100',
      guest: 'bg-gray-100 text-gray-700 border border-gray-200'
    };
    return colors[role] || colors.guest;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getAccountStats = () => {
    return {
      totalBookings: 0,
      totalTeams: 0,
      memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'
    };
  };

  const stats = getAccountStats();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your personal information and account settings
        </p>
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
                    alt={`${user?.firstName || user?.username || 'User'} avatar`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <UserIcon className="h-14 w-14 text-emerald-700" />
                )}
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center gap-3">
                  <label
                    title="Upload photo"
                    aria-label="Upload photo"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer transition-colors"
                  >
                    <CameraIcon className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAvatarDelete}
                    disabled={loading}
                    title="Remove photo"
                    aria-label="Remove photo"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || 'Unknown User'}
              </h2>
              <p className="text-sm text-gray-500">@{user?.username || 'unknown'}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleBadgeColor(user?.role)}`}>
                {user?.role || 'guest'}
              </span>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Statistics</h3>
              <dl className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Member Since</dt>
                  <dd className="font-medium text-gray-900">{stats.memberSince}</dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Total Bookings</dt>
                  <dd className="font-medium text-gray-900 inline-flex items-center gap-1">
                    <BookmarkSquareIcon className="h-4 w-4 text-gray-400" />
                    {stats.totalBookings}
                  </dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Teams Joined</dt>
                  <dd className="font-medium text-gray-900 inline-flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    {stats.totalTeams}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                  <PencilSquareIcon className="h-5 w-5 text-emerald-600" />
                  Personal Information
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                      <option value="">Not specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} className={inputClass} />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="space-y-4">
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                    <UserIcon className="h-5 w-5 text-emerald-600 mr-3" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="text-sm text-gray-900">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Not specified'}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                    <EnvelopeIcon className="h-5 w-5 text-emerald-600 mr-3" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{user?.email || 'Not specified'}</dd>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                    <PhoneIcon className="h-5 w-5 text-emerald-600 mr-3" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{user?.phone || 'Not specified'}</dd>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                    <MapPinIcon className="h-5 w-5 text-emerald-600 mr-3" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="text-sm text-gray-900">{user?.address || 'Not specified'}</dd>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                    <CalendarIcon className="h-5 w-5 text-emerald-600 mr-3" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="text-sm text-gray-900">{formatDate(user?.dateOfBirth)}</dd>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                    <ShieldCheckIcon className="h-5 w-5 text-emerald-600 mr-3" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                      <dd className="text-sm text-gray-900 capitalize">{user?.role || 'guest'}</dd>
                    </div>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                    <UserIcon className="h-5 w-5 text-emerald-600 mr-3" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="text-sm text-gray-900 capitalize">{user?.gender || 'Not specified'}</dd>
                    </div>
                  </div>
                </dl>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5 text-emerald-600" />
                Change Password
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className={`${inputClass} pr-10`}
                    />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className={`${inputClass} pr-10`}
                      />
                      <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`${inputClass} pr-10`}
                      />
                      <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
