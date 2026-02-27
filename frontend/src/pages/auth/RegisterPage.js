import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Card, CardBody, CardHeader } from '../../components/ui';

const RegisterPage = () => {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    role: 'player',
    password: '',
    confirmPassword: ''
  });

  const inputClassName = useMemo(
    () =>
      'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ' +
      'placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
    []
  );

  const selectClassName = useMemo(
    () =>
      'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm ' +
      'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
    []
  );

  const handleChange = (e) => {
    setClientError(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const passwordsMatch =
    !formData.confirmPassword || formData.password === formData.confirmPassword;

  const isFormValid =
    formData.firstName &&
    formData.lastName &&
    formData.username &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError(null);

    if (formData.password !== formData.confirmPassword) {
      setClientError('Passwords do not match.');
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    const cleanedData = {
      ...registerData,
      phone: registerData.phone || undefined,
      role: registerData.role || 'player'
    };

    const result = await register(cleanedData);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
      navigate(defaultPath);
    }
  };

  const roleHint = useMemo(() => {
    const map = {
      player: 'Browse and book fields, request to join teams.',
      captain: 'Everything a player can do, plus create/manage teams and approve requests.',
      field_owner: 'Create/manage fields and confirm/complete booking requests.'
    };
    return map[formData.role] || map.player;
  }, [formData.role]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="hidden lg:block">
        <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 text-white p-10 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center font-extrabold">
              FB
            </div>
            <div className="font-semibold">Football Booking</div>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Create your account</h1>
          <p className="mt-3 text-white/90">
            Choose an account type and get started in minutes.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 text-sm">
            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-4">
              <div className="font-semibold">Player</div>
              <div className="mt-1 text-white/85">Book fields, join teams, manage your bookings.</div>
            </div>
            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-4">
              <div className="font-semibold">Captain</div>
              <div className="mt-1 text-white/85">Create teams, approve join requests, organize matches.</div>
            </div>
            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-4">
              <div className="font-semibold">Field owner</div>
              <div className="mt-1 text-white/85">Manage fields, confirm bookings, track upcoming requests.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Register</h2>
            <p className="mt-1 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-green-700 hover:text-green-800">
                Sign in
              </Link>
            </p>
          </CardHeader>
          <CardBody>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {(error || clientError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {clientError || error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="yourname"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Account type
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={selectClassName}
                >
                  <option value="player">Player</option>
                  <option value="captain">Team Captain</option>
                  <option value="field_owner">Field Owner</option>
                </select>
                <p className="mt-2 text-xs text-gray-600">{roleHint}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`${inputClassName} pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Use at least 8 characters.</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`${inputClassName} pr-10 ${passwordsMatch ? '' : 'border-red-300 focus:ring-red-500 focus:border-red-500'}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p className="mt-2 text-xs text-red-600">Passwords do not match.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Badge tone="gray" className="hidden sm:inline-flex">
                  You can change your profile later
                </Badge>
                <Button type="submit" disabled={loading || !isFormValid} className="w-full sm:w-auto">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      Creating...
                    </span>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;

