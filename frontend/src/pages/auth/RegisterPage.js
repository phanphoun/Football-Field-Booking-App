import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button } from '../../components/ui';
import AuthModalShell from '../../components/ui/AuthModalShell';
import { useLanguage } from '../../context/LanguageContext';

const RegisterPage = () => {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const backgroundLocation = location.state?.backgroundLocation;
  const authRouteState = backgroundLocation ? { backgroundLocation } : undefined;

  const inputClassName = useMemo(
    () =>
      'block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 ' +
      'placeholder-slate-500 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20',
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientError(null);
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

  const passwordsMatch =
    !formData.confirmPassword || formData.password === formData.confirmPassword;
  const passwordMeetsServerRules =
    formData.password.length >= 8 &&
    /[a-z]/.test(formData.password) &&
    /[A-Z]/.test(formData.password) &&
    /\d/.test(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError(null);
    const nextErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = t('register_validation_first_name', 'Please enter your first name.');
    if (!formData.lastName.trim()) nextErrors.lastName = t('register_validation_last_name', 'Please enter your last name.');
    if (!formData.username.trim()) nextErrors.username = t('register_validation_username', 'Please enter your username.');
    if (!formData.email.trim()) nextErrors.email = t('register_validation_email', 'Please enter your email address.');
    if (!formData.password.trim()) nextErrors.password = t('register_validation_password', 'Please enter your password.');
    if (!formData.confirmPassword.trim()) {
      nextErrors.confirmPassword = t('register_validation_confirm_password', 'Please confirm your password.');
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setClientError(t('register_passwords_no_match', 'Passwords do not match.'));
      return;
    }

    if (!passwordMeetsServerRules) {
      setClientError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    const cleanedData = {
      ...registerData,
      phone: registerData.phone || undefined,
      role: 'player'
    };

    const result = await register(cleanedData);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
      navigate(defaultPath);
    }
  };

  return (
    <AuthModalShell
      badgeLabel={t('register_badge', 'New Account')}
      title={t('register_title', 'Create Account')}
      description={t(
        'register_description',
        'Create your account to start booking fields, joining teams, or managing your venue with a clean and simple setup.'
      )}
      maxWidth={760}
      homeLinkState={authRouteState}
    >
      <p className="mb-6 text-sm text-slate-600 sm:text-base">
        {t('register_already_have_account', 'Already have an account?')}{' '}
        <Link to="/login" state={authRouteState} className="font-semibold text-green-700 hover:text-green-800">
          {t('register_sign_in', 'Sign in')}
        </Link>
      </p>

      {(error || clientError) && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center">
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {clientError || error}
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
              <label htmlFor="firstName" className="mb-2 block text-sm font-semibold text-slate-700">
              {t('register_first_name', 'First name')}
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              aria-invalid={Boolean(validationErrors.firstName)}
              className={`${inputClassName} ${
                validationErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
              }`}
<<<<<<< HEAD
=======
              placeholder={t('register_first_name_placeholder', 'John')}
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
            />
            {validationErrors.firstName && (
              <p className="mt-2 text-sm font-medium text-red-600">{validationErrors.firstName}</p>
            )}
          </div>
          <div>
              <label htmlFor="lastName" className="mb-2 block text-sm font-semibold text-slate-700">
              {t('register_last_name', 'Last name')}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              aria-invalid={Boolean(validationErrors.lastName)}
              className={`${inputClassName} ${
                validationErrors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
              }`}
<<<<<<< HEAD
=======
              placeholder={t('register_last_name_placeholder', 'Doe')}
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
            />
            {validationErrors.lastName && (
              <p className="mt-2 text-sm font-medium text-red-600">{validationErrors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
              {t('register_username', 'Username')}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              aria-invalid={Boolean(validationErrors.username)}
              className={`${inputClassName} ${
                validationErrors.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
              }`}
<<<<<<< HEAD
=======
              placeholder={t('register_username_placeholder', 'yourname')}
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
            />
            {validationErrors.username && (
              <p className="mt-2 text-sm font-medium text-red-600">{validationErrors.username}</p>
            )}
          </div>
          <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">
              {t('register_phone', 'Phone')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={inputClassName}
<<<<<<< HEAD
=======
              placeholder={t('register_phone_placeholder', '+1234567890')}
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
            {t('register_email', 'Email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={Boolean(validationErrors.email)}
            className={`${inputClassName} ${
              validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
<<<<<<< HEAD
=======
            placeholder={t('register_email_placeholder', 'you@example.com')}
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
          />
          {validationErrors.email && (
            <p className="mt-2 text-sm font-medium text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
              {t('register_password', 'Password')}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                aria-invalid={Boolean(validationErrors.password)}
                className={`${inputClassName} pr-11 ${
                  validationErrors.password || !passwordsMatch ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
<<<<<<< HEAD
=======
                placeholder={t('register_password_placeholder', 'Password')}
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
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
<<<<<<< HEAD
            <p className="mt-2 text-xs text-slate-500">Use at least 8 characters with uppercase, lowercase, and a number.</p>
=======
            <p className="mt-2 text-xs text-slate-500">{t('register_password_hint', 'Use at least 8 characters.')}</p>
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
              {t('register_confirm_password', 'Confirm password')}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(validationErrors.confirmPassword) || !passwordsMatch}
                className={`${inputClassName} pr-11 ${
                  validationErrors.confirmPassword || !passwordsMatch
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : ''
                }`}
<<<<<<< HEAD
=======
                placeholder={t('register_confirm_password_placeholder', 'Confirm password')}
>>>>>>> 295927653451b883e4b5e944422c9129dd512ccc
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-700"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? t('login_hide_password', 'Hide password') : t('login_show_password', 'Show password')}
              >
                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="mt-2 text-sm font-medium text-red-600">{validationErrors.confirmPassword}</p>
            )}
            {!passwordsMatch && (
              <p className="mt-2 text-xs text-red-600">{t('register_passwords_no_match', 'Passwords do not match.')}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Badge tone="gray" className="w-fit">
            {t('register_update_later', 'You can update your profile later')}
          </Badge>
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-green-600 py-3 text-base font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('register_creating', 'Creating...')}
              </span>
            ) : (
              t('register_title', 'Create Account')
            )}
          </Button>
        </div>
      </form>
    </AuthModalShell>
  );
};

export default RegisterPage;
