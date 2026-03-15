import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellAlertIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  SwatchIcon,
  UserCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { useDialog } from '../components/ui';

const SETTINGS_DEVICE_PREFS_KEY = 'app_settings_device_preferences';

const ROLE_OPTIONS = {
  captain: {
    title: 'Captain Access',
    description: 'Create field bookings, manage team members, approve join requests, and organize open matches.',
    icon: StarIcon,
    accent: 'emerald'
  },
  field_owner: {
    title: 'Field Owner Access',
    description: 'Create fields, manage booking requests, and control your venue schedule.',
    icon: BuildingOffice2Icon,
    accent: 'sky'
  }
};

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200'
};

const passwordInputClass =
  'mt-1 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100';

const toggleClass = (enabled) =>
  `relative inline-flex h-7 w-12 items-center rounded-full transition ${
    enabled ? 'bg-emerald-500' : 'bg-slate-300'
  }`;

const getStatusIcon = (status) => {
  switch (status) {
    case 'approved':
      return CheckCircleIcon;
    case 'rejected':
      return XCircleIcon;
    default:
      return ClockIcon;
  }
};

const formatRoleLabel = (role) => {
  if (!role) return 'Unknown';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString();
};

const getDefaultPreferences = () => ({
  emailUpdates: true,
  bookingReminders: true,
  matchAlerts: true,
  compactMode: false,
  startPage: 'dashboard'
});

const getStoredPreferences = () => {
  if (typeof window === 'undefined') {
    return getDefaultPreferences();
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_DEVICE_PREFS_KEY);
    if (!raw) return getDefaultPreferences();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultPreferences(),
      ...(parsed && typeof parsed === 'object' ? parsed : {})
    };
  } catch {
    return getDefaultPreferences();
  }
};

const PreferenceToggle = ({ title, description, enabled, onChange }) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
    <button
      type="button"
      onClick={onChange}
      className={toggleClass(enabled)}
      aria-pressed={enabled}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useDialog();
  const [roleRequests, setRoleRequests] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingRole, setSubmittingRole] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [preferences, setPreferences] = useState(getStoredPreferences);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false
  });

  const loadRoleRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authService.getRoleRequests();
      setRoleRequests(Array.isArray(response.data?.requests) ? response.data.requests : []);
      setAvailableRoles(Array.isArray(response.data?.availableRoles) ? response.data.availableRoles : []);
      setHasPendingRequest(Boolean(response.data?.hasPendingRequest));
    } catch (err) {
      setError(err.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoleRequests();
  }, [loadRoleRequests]);

  const latestRequestByRole = useMemo(
    () =>
      roleRequests.reduce((accumulator, request) => {
        const existing = accumulator[request.requestedRole];
        if (!existing || new Date(request.createdAt) > new Date(existing.createdAt)) {
          accumulator[request.requestedRole] = request;
        }
        return accumulator;
      }, {}),
    [roleRequests]
  );

  const sortedRoleRequests = useMemo(
    () =>
      [...roleRequests].sort((first, second) => {
        const firstDate = new Date(first.createdAt).getTime();
        const secondDate = new Date(second.createdAt).getTime();
        return secondDate - firstDate;
      }),
    [roleRequests]
  );

  const requestSummary = useMemo(
    () =>
      roleRequests.reduce(
        (summary, request) => {
          if (request.status === 'approved') summary.approved += 1;
          else if (request.status === 'rejected') summary.rejected += 1;
          else summary.pending += 1;
          return summary;
        },
        { approved: 0, rejected: 0, pending: 0 }
      ),
    [roleRequests]
  );

  const savePreferences = (nextPreferences) => {
    setPreferences(nextPreferences);
    window.localStorage.setItem(SETTINGS_DEVICE_PREFS_KEY, JSON.stringify(nextPreferences));
    setError('');
    setSuccessMessage('Settings preferences saved on this device.');
  };

  const updatePreference = (key, value) => {
    savePreferences({
      ...preferences,
      [key]: value
    });
  };

  const handleRoleRequest = async (requestedRole) => {
    const option = ROLE_OPTIONS[requestedRole];
    if (!option) return;

    const confirmed = await confirm(`Send a request for ${option.title.toLowerCase()}?`, {
      title: 'Role Request'
    });
    if (!confirmed) return;

    try {
      setSubmittingRole(requestedRole);
      setError('');
      setSuccessMessage('');

      const response = await authService.requestRoleUpgrade(requestedRole);
      setSuccessMessage(response.message || `${option.title} requested successfully.`);
      await loadRoleRequests();
    } catch (err) {
      setError(err.error || 'Failed to submit role request');
    } finally {
      setSubmittingRole('');
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setShowPassword({
      current: false,
      next: false,
      confirm: false
    });
  };

  const closePasswordModal = () => {
    if (changingPassword) return;
    setIsPasswordModalOpen(false);
    resetPasswordForm();
  };

  const handlePasswordFormChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await authService.changePassword(passwordForm);
      setSuccessMessage(response.message || 'Password changed successfully.');
      setIsPasswordModalOpen(false);
      resetPasswordForm();
    } catch (err) {
      setPasswordError(err.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((current) => ({
      ...current,
      [field]: !current[field]
    }));
  };

  const accountOverviewItems = [
    { label: 'Current role', value: formatRoleLabel(user?.role) },
    { label: 'Member since', value: formatDate(user?.createdAt) },
    { label: 'Pending requests', value: requestSummary.pending },
    { label: 'Available upgrades', value: availableRoles.length }
  ];

  const quickLinks = [
    {
      title: 'Profile details',
      description: 'Update your photo and personal information.',
      onClick: () => navigate(user?.role === 'field_owner' ? '/owner/profile' : '/app/profile')
    },
    {
      title: 'Notifications',
      description: 'Review invites, alerts, and unread updates.',
      onClick: () => navigate('/app/notifications')
    }
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#ecfdf5_100%)] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                <SparklesIcon className="h-4 w-4" />
                Account Center
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This page now groups the things people usually expect in settings: account overview,
                device preferences, security, and access requests.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[340px]">
              {accountOverviewItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/80 bg-white/80 px-4 py-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Preferences</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Small quality-of-life options that make the app feel more personal. These are
                  saved on this device.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <SwatchIcon className="h-4 w-4" />
                Local only
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <PreferenceToggle
                title="Email updates"
                description="Keep important account updates and approval decisions enabled."
                enabled={preferences.emailUpdates}
                onChange={() => updatePreference('emailUpdates', !preferences.emailUpdates)}
              />
              <PreferenceToggle
                title="Booking reminders"
                description="Show reminders for upcoming bookings and pending field confirmations."
                enabled={preferences.bookingReminders}
                onChange={() => updatePreference('bookingReminders', !preferences.bookingReminders)}
              />
              <PreferenceToggle
                title="Match and invite alerts"
                description="Prioritize team invites, join requests, and open match activity."
                enabled={preferences.matchAlerts}
                onChange={() => updatePreference('matchAlerts', !preferences.matchAlerts)}
              />
              <PreferenceToggle
                title="Compact layout"
                description="Use tighter spacing for tables and content-heavy pages."
                enabled={preferences.compactMode}
                onChange={() => updatePreference('compactMode', !preferences.compactMode)}
              />

              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <label htmlFor="startPage" className="text-sm font-semibold text-slate-900">
                  Default start page
                </label>
                <p className="mt-1 text-sm text-slate-600">
                  Choose the first area you want to land on when you open the app.
                </p>
                <select
                  id="startPage"
                  value={preferences.startPage}
                  onChange={(event) => updatePreference('startPage', event.target.value)}
                  className="mt-4 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="bookings">Bookings</option>
                  <option value="teams">Teams</option>
                  <option value="fields">Fields</option>
                  <option value="notifications">Notifications</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />
                Access Requests
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upgrade your account when you need more control, like creating field bookings, team management, or field administration.
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-500">Loading settings...</div>
              ) : availableRoles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-base font-semibold text-slate-900">No access upgrades available</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Your current account does not have any extra role requests available right now.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {availableRoles.map((roleKey) => {
                    const option = ROLE_OPTIONS[roleKey];
                    const latestRequest = latestRequestByRole[roleKey];
                    const Icon = option.icon;
                    const accentClasses =
                      option.accent === 'sky'
                        ? 'border-sky-100 bg-sky-50 text-sky-700'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-700';
                    const isPendingThisRole = latestRequest?.status === 'pending';
                    const isDisabled = Boolean(hasPendingRequest || submittingRole);
                    const buttonLabel = isPendingThisRole
                      ? 'Pending review'
                      : latestRequest?.status === 'rejected'
                        ? 'Request again'
                        : `Request ${option.title}`;

                    return (
                      <div key={roleKey} className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClasses}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">{option.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>

                        {latestRequest && (
                          <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[latestRequest.status] || STATUS_STYLES.pending}`}>
                            {React.createElement(getStatusIcon(latestRequest.status), { className: 'h-4 w-4' })}
                            {formatRoleLabel(latestRequest.status)}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRoleRequest(roleKey)}
                          disabled={isDisabled}
                          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {submittingRole === roleKey ? 'Submitting...' : buttonLabel}
                        </button>

                        {hasPendingRequest && !isPendingThisRole && (
                          <p className="mt-3 text-xs text-amber-700">
                            Another request is already pending review.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-semibold text-slate-900">Request History</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A quick timeline of your previous access requests and their review status.
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-sm text-slate-500">Loading history...</div>
              ) : sortedRoleRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  You have not submitted any role requests yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedRoleRequests.map((request) => {
                    const StatusIcon = getStatusIcon(request.status);
                    return (
                      <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatRoleLabel(request.requestedRole)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Submitted {formatDateTime(request.createdAt)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[request.status] || STATUS_STYLES.pending}`}>
                            <StatusIcon className="h-4 w-4" />
                            {formatRoleLabel(request.status)}
                          </span>
                        </div>

                        {request.note && (
                          <p className="mt-3 text-sm leading-6 text-slate-600">{request.note}</p>
                        )}

                        {request.reviewedAt && (
                          <p className="mt-3 text-xs text-slate-500">
                            Reviewed {formatDateTime(request.reviewedAt)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <LockClosedIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Security</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep your account protected and review the actions that affect sign-in.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Password</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Change your password any time if you shared a device, reused an old password,
                or just want a stronger one.
              </p>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setPasswordError('');
                  setIsPasswordModalOpen(true);
                }}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Change Password
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Current account role</p>
                <p className="mt-1 text-sm text-slate-600">{formatRoleLabel(user?.role)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Last settings review</p>
                <p className="mt-1 text-sm text-slate-600">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <BellAlertIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Quick Links</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Shortcut actions people usually look for while managing their account.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {quickLinks.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <UserCircleIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">What belongs here?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Usually: security, notifications, app preferences, support, and role or permission requests.
                  That structure is what this page now follows.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Change Password</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Enter your current password and choose a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close change password form"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5 px-6 py-6">
              {passwordError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {passwordError}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFormChange}
                    className={`${passwordInputClass} pr-11`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword.current ? 'Hide current password' : 'Show current password'}
                  >
                    {showPassword.current ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword.next ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFormChange}
                    className={`${passwordInputClass} pr-11`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('next')}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword.next ? 'Hide new password' : 'Show new password'}
                  >
                    {showPassword.next ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFormChange}
                    className={`${passwordInputClass} pr-11`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword.confirm ? 'Hide password confirmation' : 'Show password confirmation'}
                  >
                    {showPassword.confirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                  className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {changingPassword ? 'Changing...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
