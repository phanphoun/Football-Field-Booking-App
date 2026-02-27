import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, CardBody, CardHeader } from '../../components/ui';

const LoginPage = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const fromState = location.state?.from;
  const from =
    typeof fromState === 'string'
      ? fromState
      : fromState?.pathname
        ? `${fromState.pathname}${fromState.search || ''}`
        : null;

  const inputClassName = useMemo(
    () =>
      'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ' +
      'placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
    []
  );

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
      navigate(from || defaultPath, { replace: true });
    }
  };

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
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="mt-3 text-white/90">Sign in to manage bookings, teams, and fields based on your role.</p>
          <ul className="mt-6 space-y-3 text-sm text-white/90">
            <li className="flex gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-white/70" />
              Players can book fields and join teams.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-white/70" />
              Captains can manage teams and approve requests.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-white/70" />
              Owners can manage fields and confirm bookings.
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-1 text-sm text-gray-600">
              New here?{' '}
              <Link to="/register" className="font-medium text-green-700 hover:text-green-800">
                Create an account
              </Link>
            </p>
          </CardHeader>
          <CardBody>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-green-700 hover:text-green-800"
                  onClick={() => alert('Forgot password is not implemented yet.')}
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Want to browse first?{' '}
                <Link to="/" className="font-medium text-gray-900 hover:text-gray-700">
                  Continue as guest
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

