import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  UserIcon
} from '@heroicons/react/24/outline';
import { ImagePreviewModal } from '../components/ui';

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

const resolveTeamLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
  const normalizedLogoPath = rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
  return `${API_ORIGIN}${normalizedLogoPath}`;
};

const ProfilePage = () => {
  const { user, updateProfile, uploadAvatar, deleteAvatar, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(getInitialFormData(user));
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ totalBookings: 0, totalTeams: 0 });
  const [currentTeams, setCurrentTeams] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

       const teams =
         teamsResult.status === 'fulfilled' && Array.isArray(teamsResult.value?.data)
           ? teamsResult.value.data
           : [];

      setStats({
        totalBookings:
          bookingsResult.status === 'fulfilled' && Array.isArray(bookingsResult.value?.data)
            ? bookingsResult.value.data.length
            : 0,
        totalTeams: teams.length
      });
      setCurrentTeams(teams);
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
                className="h-24 w-24 cursor-zoom-in rounded-full border-4 border-emerald-100 object-cover"
                onClick={() => setImagePreviewOpen(true)}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>

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

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Current Teams</h2>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                {currentTeams.length}
              </span>
            </div>

            {currentTeams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                You are not in any team yet.
              </div>
            ) : (
              <div className="space-y-3">
                {currentTeams.map((team) => {
                  const teamLogoUrl = resolveTeamLogoUrl(team.logoUrl || team.logo_url || team.logo);

                  return (
                    <div key={team.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                          {teamLogoUrl ? (
                            <img
                              src={teamLogoUrl}
                              alt={`${team.name} logo`}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <UserGroupIcon className="h-6 w-6 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{team.name}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {team.homeField?.name || 'No home field assigned'}
                          </p>
                          {team.skillLevel && (
                            <p className="mt-1 text-xs capitalize text-emerald-700">{team.skillLevel}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                        <span>{team.memberCount || 0} members</span>
                        <Link
                          to={`/app/teams/${team.id}`}
                          className="font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          View team
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <ImagePreviewModal
        open={imagePreviewOpen}
        imageUrl={resolvedAvatarUrl}
        title="Profile photo"
        onClose={() => setImagePreviewOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
