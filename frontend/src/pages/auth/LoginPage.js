import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Button, useDialog } from '../../components/ui';
import AuthModalShell from '../../components/ui/AuthModalShell';
import { useLanguage } from '../../context/LanguageContext';
import { getPreferredStartPath } from '../../utils/navigationPreferences';

const LoginPage = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useDialog();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({});

  const fromState = location.state?.from;
  const from =
    typeof fromState === 'string'
      ? fromState
      : fromState?.pathname
        ? `${fromState.pathname}${fromState.search || ''}`
        : null;
  const backgroundLocation = location.state?.backgroundLocation;
  const authRouteState = backgroundLocation ? { backgroundLocation } : undefined;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      if (value.trim()) {
        delete next[name];
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!formData.email.trim()) nextErrors.email = t('login_validation_email', 'Please enter your email address.');
    if (!formData.password.trim()) nextErrors.password = t('login_validation_password', 'Please enter your password.');

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    const result = await login(formData);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = getPreferredStartPath(role === 'field_owner' ? 'owner' : 'app');
      navigate(from || defaultPath, { replace: true });
    }
  };

  return (
    <AuthModalShell
      badgeLabel={t('login_badge', 'Account Access')}
      title={t('login_title', 'Sign In')}
      description={t(
        'login_description',
        'Welcome back. Sign in to continue managing your bookings, teams, and football activity.'
      )}
      maxWidth={520}
      homeLinkState={authRouteState}
    >
      <p className="mb-6 text-sm text-slate-600 sm:text-base">
        {t('login_no_account', "Don't have an account?")}{' '}
        <Link to="/register" state={authRouteState} className="font-semibold text-green-700 hover:text-green-800">
          {t('login_create_one', 'Create one here')}
        </Link>
      </p>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center">
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
            {t('login_email_label', 'Email Address')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={Boolean(validationErrors.email)}
            className={`block w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ${
              validationErrors.email
                ? 'border border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border border-slate-200 focus:border-green-500 focus:ring-green-500/20'
            }`}
            placeholder={t('login_email_placeholder', 'you@example.com')}
          />
          {validationErrors.email && (
            <p className="mt-2 text-sm font-medium text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
            {t('login_password_label', 'Password')}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(validationErrors.password)}
              className={`block w-full rounded-2xl bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ${
                validationErrors.password
                  ? 'border border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border border-slate-200 focus:border-green-500 focus:ring-green-500/20'
              }`}
              placeholder={t('login_password_placeholder', 'Password')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-700"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('login_hide_password', 'Hide password') : t('login_show_password', 'Show password')}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {validationErrors.password && (
            <p className="mt-2 text-sm font-medium text-red-600">{validationErrors.password}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            {t('login_remember_me', 'Remember me')}
          </label>

          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-800"
            onClick={() =>
              showAlert(t('login_forgot_not_ready', 'Forgot password is not implemented yet.'), {
                title: t('login_not_available_title', 'Not Available Yet')
              })
            }
          >
            {t('login_forgot_password', 'Forgot password?')}
          </button>
        </div>

        <Button type="submit" disabled={loading} className="w-full rounded-2xl bg-green-600 py-3 text-base font-semibold text-white hover:bg-green-700">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {t('login_signing_in', 'Signing in...')}
            </span>
          ) : (
            t('login_title', 'Sign In')
          )}
        </Button>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
          {t('login_browse_first', 'Want to browse first?')}{' '}
          <Link to="/" state={authRouteState} className="font-medium text-slate-900 hover:text-slate-700">
            {t('login_continue_guest', 'Continue as guest')}
          </Link>
        </div>
      </form>
    </AuthModalShell>
  );
};

export default LoginPage;
