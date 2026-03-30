import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import AuthModalShell from '../../components/ui/AuthModalShell';
import { getPreferredStartPath } from '../../utils/navigationPreferences';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
<<<<<<< HEAD
  const { login, loading, error, clearError } = useAuth();
=======
  const { login, googleAuth, loading, error } = useAuth();
>>>>>>> 1595f01f20c945d9b8e0c065094b81756ef0e4cb
  const navigate = useNavigate();
  const location = useLocation();
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) {
      clearError();
    }
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

    if (!formData.email.trim()) nextErrors.email = 'Please enter your email address.';
    else if (!EMAIL_REGEX.test(formData.email.trim())) nextErrors.email = 'Please enter a valid email address.';

    if (!formData.password.trim()) nextErrors.password = 'Please enter your password.';

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    if (error) {
      clearError();
    }

    const result = await login(formData);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = getPreferredStartPath(role === 'field_owner' ? 'owner' : 'app');
      navigate(from || defaultPath, { replace: true });
      return;
    }

    if (result.field) {
      setValidationErrors({ [result.field]: result.error });
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setValidationErrors({});
    const result = await googleAuth(credential);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = getPreferredStartPath(role === 'field_owner' ? 'owner' : 'app');
      navigate(from || defaultPath, { replace: true });
      return;
    }

    if (result.error) {
      setValidationErrors({
        email: result.error,
        password: result.error
      });
    }
  };

  const handleGoogleError = (message) => {
    if (!message) return;
    setValidationErrors({
      email: message,
      password: message
    });
  };

  return (
    <AuthModalShell
      title="Sign In"
      description=""
      maxWidth={520}
      homeLinkState={authRouteState}
    >
      <p className="mb-4 text-sm text-slate-600 sm:mb-6 sm:text-base">
        Don&apos;t have an account?{' '}
        <Link to="/register" state={authRouteState} className="font-semibold text-green-700 hover:text-green-800">
          Create one here
        </Link>
      </p>

<<<<<<< HEAD
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
=======
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mb-6">
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
          {validationErrors.password && (
            <p className="mt-2 text-sm font-medium text-red-600">{validationErrors.password}</p>
          )}
        </div>
      )}

      <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2 sm:space-y-3">
          <GoogleAuthButton
            disabled={loading}
            onCredential={handleGoogleSuccess}
            onError={handleGoogleError}
            text="continue_with"
          />
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>

>>>>>>> 1595f01f20c945d9b8e0c065094b81756ef0e4cb
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700 sm:mb-2">
            Email Address
          </label>
          {validationErrors.email && (
            <p className="mb-2 text-sm font-semibold text-red-500">{validationErrors.email}</p>
          )}
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={Boolean(validationErrors.email)}
            className={`block w-full rounded-2xl bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 shadow-sm transition focus:outline-none focus:ring-2 sm:py-3 ${
              validationErrors.email
                ? 'border border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border border-slate-200 focus:border-green-500 focus:ring-green-500/20'
            }`}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700 sm:mb-2">
            Password
          </label>
          {validationErrors.password && (
            <p className="mb-2 text-sm font-semibold text-red-500">{validationErrors.password}</p>
          )}
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(validationErrors.password)}
              className={`block w-full rounded-2xl bg-white px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-500 shadow-sm transition focus:outline-none focus:ring-2 sm:py-3 ${
                validationErrors.password
                  ? 'border border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border border-slate-200 focus:border-green-500 focus:ring-green-500/20'
              }`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-700"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            Remember me
          </label>

          <button
            type="button"
            className="text-sm font-medium text-green-700 hover:text-green-800"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot password?
          </button>
        </div>

<<<<<<< HEAD
        {error && !validationErrors.email && !validationErrors.password && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2 text-sm text-rose-700">
            <svg className="h-4 w-4 flex-none" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.993.883L9 8v3a1 1 0 001.993.117L11 11V8a1 1 0 00-1-1zm.002 7a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z"
                clipRule="evenodd"
              />
            </svg>
            <p>We couldn&apos;t sign you in with those details.</p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full rounded-2xl bg-green-600 py-3 text-base font-semibold text-white hover:bg-green-700">
=======
        <Button type="submit" disabled={loading} className="w-full rounded-2xl bg-green-600 py-2.5 text-base font-semibold text-white hover:bg-green-700 sm:py-3">
>>>>>>> 1595f01f20c945d9b8e0c065094b81756ef0e4cb
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </Button>

        <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-center text-sm text-slate-600 sm:py-3">
          Want to browse first?{' '}
          <Link to="/" state={authRouteState} className="font-medium text-slate-900 hover:text-slate-700">
            Continue as guest
          </Link>
        </div>
      </form>
    </AuthModalShell>
  );
};

export default LoginPage;