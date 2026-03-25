import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  ShieldCheckIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { ConfirmationModal, ImagePreviewModal, useDialog, useToast } from '../components/ui';

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

const openNativeDatePicker = (event) => {
  if (typeof event.currentTarget.showPicker === 'function') {
    event.currentTarget.showPicker();
  }
};

const resolveTeamLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (/^https?:\/\//i.test(rawLogo)) return rawLogo;
  const normalizedLogoPath = rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
  return `${API_ORIGIN}${normalizedLogoPath}`;
};

const ProfilePage = () => {
  const { user, updateProfile, uploadAvatar, deleteAvatar, logout, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const isAdminUser = user?.role === 'admin';
  const isFieldOwner = user?.role === 'field_owner';
  const [formData, setFormData] = useState(getInitialFormData(user));
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ totalBookings: 0, totalTeams: 0 });
  const [currentTeams, setCurrentTeams] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!successMessage) return;
    showToast(successMessage, { type: 'success', duration: 3200 });
    setSuccessMessage('');
  }, [showToast, successMessage]);

  useEffect(() => {
    if (!error) return;
    showToast(error, { type: 'error', duration: 3600 });
    setError('');
  }, [error, showToast]);
  const formatProfileDate = (value) => {
    if (!value) return t('profile_not_specified', 'Not specified');
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? t('profile_not_specified', 'Not specified')
      : date.toLocaleDateString(language === 'km' ? 'km-KH' : undefined);
  };

  useEffect(() => {
    setFormData(getInitialFormData(user));
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      if (isAdminUser) {
        if (!active) return;
        setStats({ totalBookings: 0, totalTeams: 0 });
        setCurrentTeams([]);
        return;
      }

      if (isFieldOwner) {
        if (!active) return;

        setStats({ totalBookings: 0, totalTeams: 0 });
        setCurrentTeams([]);
        return;
      }

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
  }, [avatarPreview, isAdminUser, isFieldOwner]);

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

  const handleEditOpen = () => {
    setFormData(getInitialFormData(user));
    setIsEditing(true);
  };

  const handleEditClose = () => {
    setFormData(getInitialFormData(user));
    setIsEditing(false);
  };

  const handleSubmit = async () => {
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
    const confirmed = await confirm('Are you sure you want to delete your profile photo?', {
      title: 'Delete Profile Photo'
    });
    if (!confirmed) return;

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

  const handleLogout = async () => {
    const confirmed = await confirm('Are you sure you want to logout?', { title: 'Logout' });
    if (!confirmed) return;

    logout();
    navigate('/login', { state: { backgroundLocation: location } });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 p-6 shadow-sm">
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
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-100">
                {isAdminUser ? t('profile_admin', 'Admin Profile') : isFieldOwner ? t('profile_owner', 'Owner Profile') : t('profile_account', 'Account Profile')}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || t('profile_unknown_user', 'Unknown User')}
              </h1>
              <p className="mt-1 text-sm text-slate-600">{user?.role?.replace('_', ' ') || t('profile_guest', 'guest')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={isEditing ? handleEditClose : handleEditOpen}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <PencilSquareIcon className="h-4 w-4" />
              {isEditing ? t('action_cancel', 'Cancel') : t('profile_edit', 'Edit Profile')}
            </button>
            <button
              type="button"
              onClick={handleAvatarDelete}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              {t('profile_remove_photo', 'Remove Photo')}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              {t('action_logout', 'Logout')}
            </button>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isAdminUser || isFieldOwner ? '' : 'lg:grid-cols-[2fr_1fr]'}`}>
        <div className="space-y-6">
          {isAdminUser && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    <ShieldCheckIcon className="h-4 w-4" />
                    {t('profile_admin_tools', 'Admin Tools')}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-gray-900">{t('profile_admin_shortcuts', 'Administration Shortcuts')}</h2>
                  <p className="mt-1 text-sm text-gray-500">{t('profile_admin_shortcuts_desc', 'Quick links for the areas you manage most often.')}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Link
                    to="/app/admin/users"
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/60"
                  >
                    <p className="text-sm font-semibold text-gray-900">{t('nav_manage_users', 'Manage Users')}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('profile_manage_users_desc', 'Review and manage user accounts.')}</p>
                  </Link>
                  <Link
                    to="/app/admin/role-requests"
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/60"
                  >
                    <p className="text-sm font-semibold text-gray-900">{t('nav_role_requests', 'Role Requests')}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('profile_role_requests_desc', 'Approve or reject access changes.')}</p>
                  </Link>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">{t('profile_account_status', 'Account Status')}</p>
                    <p className="mt-1 text-xs text-gray-500 capitalize">{user?.status || t('profile_active', 'active')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('profile_personal_info', 'Personal Information')}</h2>

          {(
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t('profile_full_name', 'Full Name')}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <UserIcon className="h-4 w-4 text-emerald-600" />
                  {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || t('profile_unknown_user', 'Unknown User')}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t('register_email', 'Email')}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <EnvelopeIcon className="h-4 w-4 text-emerald-600" />
                  {user?.email || t('profile_not_specified', 'Not specified')}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t('register_phone', 'Phone')}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <PhoneIcon className="h-4 w-4 text-emerald-600" />
                  {user?.phone || t('profile_not_specified', 'Not specified')}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t('profile_dob', 'Date of Birth')}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  {formatProfileDate(user?.dateOfBirth)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t('profile_address', 'Address')}</p>
                <p className="mt-2 inline-flex items-start gap-2 text-sm font-medium text-gray-900">
                  <MapPinIcon className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{user?.address || t('profile_not_specified', 'Not specified')}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        </div>

        {!isAdminUser && !isFieldOwner && (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('profile_account_stats', 'Account Statistics')}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <BookmarkSquareIcon className="h-4 w-4 text-blue-500" />
                    {t('profile_total_bookings', 'Total Bookings')}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalBookings}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <UserGroupIcon className="h-4 w-4 text-violet-500" />
                    {t('nav_teams', 'Teams')}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalTeams}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">{t('profile_current_teams', 'Current Teams')}</h2>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {currentTeams.length}
                </span>
              </div>

              {currentTeams.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-gray-500">
                  {t('profile_no_teams', 'You are not in any team yet.')}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentTeams.map((team) => {
                    const teamLogoUrl = resolveTeamLogoUrl(team.logoUrl || team.logo_url || team.logo);

                    return (
                      <div key={team.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
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
                              {team.homeField?.name || t('profile_no_home_field', 'No home field assigned')}
                            </p>
                            {team.skillLevel && (
                              <p className="mt-1 text-xs capitalize text-emerald-700">{team.skillLevel}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                          <span>{t('profile_members_count', '{{count}} members', { count: team.memberCount || 0 })}</span>
                          <Link
                            to={`/app/teams/${team.id}`}
                            className="font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            {t('profile_view_team', 'View team')}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ImagePreviewModal
        open={imagePreviewOpen}
        imageUrl={resolvedAvatarUrl}
        title={t('profile_photo', 'Profile photo')}
        onClose={() => setImagePreviewOpen(false)}
      />
      <ConfirmationModal
        isOpen={isEditing}
        title={t('profile_edit', 'Edit Profile')}
        message={t('profile_edit_message', 'Update your account information below.')}
        badgeLabel={t('nav_profile', 'Profile')}
        confirmLabel={loading ? t('profile_saving', 'Saving...') : t('profile_save_changes', 'Save Changes')}
        cancelLabel={t('action_cancel', 'Cancel')}
        variant="default"
        onConfirm={handleSubmit}
        onClose={handleEditClose}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">{t('register_first_name', 'First Name')}</span>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder={t('profile_enter_first_name', 'Enter first name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">{t('register_last_name', 'Last Name')}</span>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder={t('profile_enter_last_name', 'Enter last name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">{t('login_email_label', 'Email Address')}</span>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('profile_enter_email', 'Enter email address')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">{t('profile_phone_number', 'Phone Number')}</span>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('profile_enter_phone', 'Enter phone number')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">{t('profile_dob', 'Date of Birth')}</span>
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                onClick={openNativeDatePicker}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">{t('profile_gender', 'Gender')}</span>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">{t('profile_not_specified', 'Not specified')}</option>
                <option value="male">{t('profile_gender_male', 'Male')}</option>
                <option value="female">{t('profile_gender_female', 'Female')}</option>
                <option value="other">{t('profile_gender_other', 'Other')}</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700">{t('profile_address', 'Address')}</span>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={4}
              placeholder={t('profile_enter_address', 'Enter address')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default ProfilePage;