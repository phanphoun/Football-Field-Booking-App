import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, CardBody, CardHeader } from '../../components/ui';
import { getPreferredStartPath } from '../../utils/navigationPreferences';

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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = getPreferredStartPath(role === 'field_owner' ? 'owner' : 'app');
      navigate(from || defaultPath, { replace: true });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Background Image Side */}
      <div className="img hidden lg:block relative">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center text-white bg-black bg-opacity-40 rounded-lg backdrop-blur-sm p-12 max-w-md">
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg animate-fade-in">Welcome Back</h1>
            <p className="text-xl mb-8 drop-shadow-md animate-slide-up">Sign in to your account and continue your football journey</p>
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-lg font-medium">Access your bookings</p>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-lg font-medium">Manage your teams</p>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-lg font-medium">Book premium fields</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-xl mx-auto animate-slide-up">
          <Card className="shadow-2xl border-0 border-gray-200 hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Sign In</h2>
              <p className="mt-2 text-green-100">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-white hover:text-green-200 transition-colors duration-200">
                  Create one here
                </Link>
              </p>
            </CardHeader>
            <CardBody className="p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-shake">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="block w-full rounded-md border border-gray-300 bg-white px-4 py-3 pr-10 text-sm placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
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
                    className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors duration-200"
                    onClick={() => alert('Forgot password is not implemented yet.')}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Want to browse first?{' '}
                  <Link to="/" className="font-medium text-gray-900 hover:text-gray-700 transition-colors duration-200">
                    Continue as guest
                  </Link>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

