import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bookingService from '../services/bookingService';
import teamService from '../services/teamService';
import {
  ArrowRightOnRectangleIcon,
  BookmarkSquareIcon,
  CameraIcon,
  CalendarIcon,
  ClockIcon,
  EnvelopeIcon,
  LifebuoyIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_AVATAR_PATH = '/uploads/profile/default_profile.jpg';
const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const inputClass =
  'mt-1 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100';

const getInitialFormData = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  phone: user?.phone || '',
  address: user?.address || '',
  dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
  gender: user?.gender || ''
});

const formatDate = (dateString, fallback = 'Not specified') => {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString();
};

const formatRoleLabel = (role) => {
  if (!role) return 'Guest';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatRolePill = (role) => {
  const colors = {
    admin: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    field_owner: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    captain: 'bg-sky-50 text-sky-700 border border-sky-100',
    player: 'bg-amber-50 text-amber-700 border border-amber-100',
    guest: 'bg-slate-100 text-slate-600 border border-slate-200'
  };

  return colors[role] || colors.guest;
};

const formatGender = (gender) => {
  if (!gender) return 'Not specified';
  return gender.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getYearsActive = (createdAt) => {
  if (!createdAt) return 0;

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;

  const now = new Date();
  let years = now.getFullYear() - created.getFullYear();
  const hasNotReachedAnniversary =
    now.getMonth() < created.getMonth() ||
    (now.getMonth() === created.getMonth() && now.getDate() < created.getDate());

  if (hasNotReachedAnniversary) {
    years -= 1;
  }

  return Math.max(0, years);
};

const ProfilePage = () => {
  const { user, updateProfile, uploadAvatar, deleteAvatar, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalTeams: 0,
    memberSince: 'Unknown',
    yearsActive: 0
  });
  const [formData, setFormData] = useState(getInitialFormData(user));

  useEffect(() => {
    setFormData(getInitialFormData(user));
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
      const memberSince = user?.createdAt ? formatDate(user.createdAt, 'Unknown') : 'Unknown';
      const yearsActive = getYearsActive(user?.createdAt);

      try {
        const [bookingsResult, teamsResult] = await Promise.allSettled([
          bookingService.getAllBookings({ limit: 1000 }),
          teamService.getMyTeams()
        ]);

        const bookings =
          bookingsResult.status === 'fulfilled' && Array.isArray(bookingsResult.value?.data)
            ? bookingsResult.value.data
            : [];

        const teams =
          teamsResult.status === 'fulfilled' && Array.isArray(teamsResult.value?.data)
            ? teamsResult.value.data
            : [];

        if (!active) return;

        setStats({
          totalBookings: bookings.length,
          totalTeams: teams.length,
          memberSince,
          yearsActive
        });
      } catch {
        if (!active) return;

        setStats({
          totalBookings: 0,
          totalTeams: 0,
          memberSince,
          yearsActive
        });
      }
    };

    loadStats();

    return () => {
      active = false;
    };
  }, [user?.id, user?.createdAt]);

  const displayName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Unknown User';
  const roleLabel = formatRoleLabel(user?.role);
  const resolvedAvatarUrl = (() => {
    if (avatarPreview) return avatarPreview;
    const rawAvatar = user?.avatarUrl || user?.avatar_url;
    if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_AVATAR_PATH}`;
    if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
    const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
    return `${API_ORIGIN}${normalizedPath}`;
  })();
  const teamStatLabel = user?.role === 'captain' || user?.role === 'field_owner' ? 'Teams Managed' : 'Teams Joined';
  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: BookmarkSquareIcon,
      iconClass: 'text-sky-500 bg-sky-50'
    },
    {
      label: teamStatLabel,
      value: stats.totalTeams,
      icon: UserGroupIcon,
      iconClass: 'text-violet-500 bg-violet-50'
    },
    {
      label: 'Years Active',
      value: stats.yearsActive,
      icon: ClockIcon,
      iconClass: 'text-amber-500 bg-amber-50'
    }
  ];
  const infoItems = [
    { label: 'Full Name', value: displayName, icon: UserIcon },
    { label: 'Email Address', value: user?.email || 'Not specified', icon: EnvelopeIcon },
    { label: 'Phone Number', value: user?.phone || 'Not specified', icon: PhoneIcon },
    { label: 'Date of Birth', value: formatDate(user?.dateOfBirth), icon: CalendarIcon },
    { label: 'Physical Address', value: user?.address || 'Not specified', icon: MapPinIcon },
    { label: 'Gender', value: formatGender(user?.gender), icon: UserIcon }
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleCancelEdit = () => {
    setFormData(getInitialFormData(user));
    setProfileError(null);
    setSuccessMessage(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        setSuccessMessage('Profile updated successfully.');
        setIsEditing(false);
        return;
      }

      setProfileError(result.error || 'Failed to update profile');
    } catch (error) {
      setProfileError(error.error || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfileError(null);
    setSuccessMessage(null);

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select an image file');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setProfileError(`Avatar file size must be less than ${MAX_AVATAR_SIZE_MB}MB`);
      event.target.value = '';
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
      setSuccessMessage('Profile picture updated successfully.');
    } catch (error) {
      setProfileError(error.message || error.error || 'Failed to upload avatar');
    } finally {
      event.target.value = '';
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

      setSuccessMessage('Profile picture removed successfully.');
    } catch (error) {
      setProfileError(error.message || error.error || 'Failed to remove avatar');
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Do you want to logout?');
    if (!confirmed) return;

    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {profileError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {profileError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0">
              <img
                src={resolvedAvatarUrl}
                alt={`${displayName} avatar`}
                className="h-24 w-24 rounded-full border-4 border-emerald-100 object-cover shadow-sm"
                onError={(event) => {
                  const fallbackUrl = `${API_ORIGIN}${DEFAULT_AVATAR_PATH}`;
                  if (event.currentTarget.src !== fallbackUrl) {
                    event.currentTarget.src = fallbackUrl;
                  }
                }}
              />
              <label className="absolute bottom-0 left-0 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition hover:bg-emerald-100">
                <CameraIcon className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{displayName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${formatRolePill(user?.role)}`}>
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <ClockIcon className="h-4 w-4" />
                  Active since {stats.memberSince}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <PencilSquareIcon className="h-5 w-5" />
              {isEditing ? 'Close Edit' : 'Edit Profile'}
            </button>
            <button
              type="button"
              onClick={handleAvatarDelete}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <TrashIcon className="h-5 w-5" />
              Remove Photo
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-semibold text-slate-900">Personal Information</h2>
          </div>

          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">
                      Date of Birth
                    </label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="text-sm font-medium text-slate-700">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Not specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="text-sm font-medium text-slate-700">
                    Physical Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={4}
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {infoItems.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <div className="mt-3 flex items-start gap-3">
                      <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <p className="text-base font-semibold text-slate-900">{item.value}</p>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl bg-slate-50 px-4 py-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Account Type
                  </p>
                  <div className="mt-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${formatRolePill(user?.role)}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Account Statistics</h2>
            <div className="mt-5 space-y-3">
              {statCards.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconClass}`}>
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                <LifebuoyIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Need Help?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Contact support if you need help with your account or profile information.
                </p>
              </div>
            </div>

            <a
              href="mailto:support@football.com"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Contact Support
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
