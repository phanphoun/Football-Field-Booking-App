import React, { useCallback, useEffect, useState } from 'react';
import {
  ClockIcon,
  ShieldCheckIcon,
  StarIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const ROLE_OPTIONS = {
  captain: {
    title: 'Captain Access',
    description: 'Create teams, manage members, approve join requests, and organize open matches.',
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
  return role.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString();
};

const passwordInputClass =
  'mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200';

const SettingsPage = () => {
  const { user } = useAuth();
  const [roleRequests, setRoleRequests] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingRole, setSubmittingRole] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  const latestRequestByRole = roleRequests.reduce((accumulator, request) => {
    if (!accumulator[request.requestedRole]) {
      accumulator[request.requestedRole] = request;
    }
    return accumulator;
  }, {});

  const handleRoleRequest = async (requestedRole) => {
    const option = ROLE_OPTIONS[requestedRole];
    if (!option) return;

    const confirmed = window.confirm(`Send a request for ${option.title.toLowerCase()}?`);
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage account preferences and request additional access for your account.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            Current role: {formatRoleLabel(user?.role)}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
                Role Upgrade Requests
              </h2>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading settings...</div>
              ) : availableRoles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
                  <p className="text-base font-semibold text-gray-900">No role upgrades available</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Your current account does not have any additional role requests to submit right now.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRoles.map((roleKey) => {
                    const option = ROLE_OPTIONS[roleKey];
                    const latestRequest = latestRequestByRole[roleKey];
                    const Icon = option.icon;
                    const accentClasses =
                      option.accent === 'sky'
                        ? 'bg-sky-50 text-sky-700 border-sky-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    const isPendingThisRole = latestRequest?.status === 'pending';
                    const isDisabled = Boolean(hasPendingRequest || submittingRole);
                    const buttonLabel = isPendingThisRole
                      ? 'Pending review'
                      : latestRequest?.status === 'rejected'
                        ? 'Request again'
                        : `Request ${option.title}`;

                    return (
                      <div key={roleKey} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClasses}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">{option.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{option.description}</p>

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
                          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {submittingRole === roleKey ? 'Submitting...' : buttonLabel}
                        </button>

                        {hasPendingRequest && !isPendingThisRole && (
                          <p className="mt-3 text-xs text-amber-700">
                            You already have another role request pending review.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                <LockClosedIcon className="h-5 w-5 text-emerald-600" />
                Security
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm leading-6 text-gray-600">
                Change your password from here whenever you need to secure your account.
              </p>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMessage('');
                  setPasswordError('');
                  setIsPasswordModalOpen(true);
                }}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Request History</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-sm text-gray-500">Loading history...</div>
              ) : roleRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                  You have not submitted any role requests yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {roleRequests.map((request) => {
                    const StatusIcon = getStatusIcon(request.status);
                    return (
                      <div key={request.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatRoleLabel(request.requestedRole)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Submitted {formatDateTime(request.createdAt)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[request.status] || STATUS_STYLES.pending}`}>
                            <StatusIcon className="h-4 w-4" />
                            {formatRoleLabel(request.status)}
                          </span>
                        </div>

                        {request.note && (
                          <p className="mt-3 text-sm text-gray-600">{request.note}</p>
                        )}

                        {request.reviewedAt && (
                          <p className="mt-3 text-xs text-gray-500">
                            Reviewed {formatDateTime(request.reviewedAt)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/55 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Enter your current password and choose a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close change password form"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5 px-6 py-6">
              {passwordError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {passwordError}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
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
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword.current ? 'Hide current password' : 'Show current password'}
                  >
                    {showPassword.current ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
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
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword.next ? 'Hide new password' : 'Show new password'}
                  >
                    {showPassword.next ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
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
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword.confirm ? 'Hide password confirmation' : 'Show password confirmation'}
                  >
                    {showPassword.confirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={changingPassword}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
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
