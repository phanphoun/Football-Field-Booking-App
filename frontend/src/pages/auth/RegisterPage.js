import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Card, CardBody, CardHeader } from '../../components/ui';
import '../../App.css';

const RegisterPage = () => {
  const { register, googleLogin, facebookLogin, loading, error } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError] = useState(null);
  const googleButtonRef = useRef(null);
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const facebookAppId = process.env.REACT_APP_FACEBOOK_APP_ID;

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

  const handleGoogleCredential = useCallback(async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      return;
    }

    const result = await googleLogin(credentialResponse.credential);
    if (result.success) {
      const role = result.data?.user?.role;
      const defaultPath = role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
      navigate(defaultPath, { replace: true });
    }
  }, [googleLogin, navigate]);

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
          navigate(defaultPath, { replace: true });
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <div className="img shadow-2xl">
        <div className="absolute  flex items-center justify-center bg-black bg-opacity-30  border-r border-gray-200 ">
          <div className="text-start text-white bg-black bg-opacity-60 rounded-lg backdrop-blur-sm p-12 max-w-md flex-start">
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg animate-fade-in">Welcome to Football Field Booking</h1>
            <p className="text-xl mb-8 drop-shadow-md animate-slide-up">Join our community and book the best football fields in your area</p>
            <div className="space-y-4 animate-fade-in text-start">
              <div className="flex items-center justify-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-lg font-medium">Easy online booking</p>
              </div>
              <div className="flex items-center justify-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-lg font-medium">Find nearby fields</p>
              </div>
              <div className="flex items-center justify-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-lg font-medium">Join teams and tournaments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-xl mx-auto animate-slide-up">
          <Card className="shadow-2xl border-0 border-gray-200 hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="mt-2 text-green-100">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-white hover:text-green-200 transition-colors duration-200">
                  Sign in
                </Link>
              </p>
            </CardHeader>
            <CardBody>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {(error || clientError) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-shake">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {clientError || error}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
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
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <Button type="submit" disabled={loading || !isFormValid} className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                        Creating...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>

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
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
