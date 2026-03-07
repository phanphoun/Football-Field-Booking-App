import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, CardBody, CardHeader } from '../../components/ui';

const LoginPage = () => {
  const { login, googleLogin, facebookLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const googleButtonRef = useRef(null);
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const facebookAppId = process.env.REACT_APP_FACEBOOK_APP_ID;

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
      const defaultPath = role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
      navigate(from || defaultPath, { replace: true });
    }
  };

  const handleGoogleCredential = useCallback(async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      return;
    }

    const result = await googleLogin(credentialResponse.credential);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
      navigate(from || defaultPath, { replace: true });
    }
  }, [googleLogin, navigate, from]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return undefined;
    }

    let isMounted = true;

    const initializeGoogleButton = () => {
      if (!isMounted || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'continue_with',
        size: 'large',
        width: 320
      });
    };

    const scriptId = 'google-identity-services';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      initializeGoogleButton();
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleButton;
      document.body.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    if (!facebookAppId) {
      return undefined;
    }

    const initializeFacebook = () => {
      if (window.FB?.init) {
        window.FB.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: false,
          version: 'v23.0'
        });
      }
    };

    const scriptId = 'facebook-jssdk';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      initializeFacebook();
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = initializeFacebook;
      document.body.appendChild(script);
    }

    return undefined;
  }, [facebookAppId]);

  const handleFacebookLogin = async () => {
    if (!window.FB?.login) {
      return;
    }

    window.FB.login(
      async (response) => {
        const authResponse = response?.authResponse;
        if (!authResponse?.accessToken || !authResponse?.userID) {
          return;
        }

        const result = await facebookLogin({
          accessToken: authResponse.accessToken,
          userId: authResponse.userID
        });

        if (result.success) {
          const role = result.data?.user?.role;
          const defaultPath = role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
          navigate(from || defaultPath, { replace: true });
        }
      },
      { scope: 'public_profile,email' }
    );
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">or</span>
                  </div>
                </div>

                {googleClientId ? (
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 shadow-sm">
                    <div className="flex justify-center">
                      <div ref={googleButtonRef} />
                    </div>
                    {facebookAppId && (
                      <button
                        type="button"
                        onClick={handleFacebookLogin}
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
                      >
                        <span className="text-base leading-none">f</span>
                        Continue with Facebook
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    Google login is not configured. Set `REACT_APP_GOOGLE_CLIENT_ID` in frontend env.
                  </p>
                )}

                {googleClientId && !facebookAppId && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    Facebook login is not configured. Set `REACT_APP_FACEBOOK_APP_ID` in frontend env.
                  </p>
                )}

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

