import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Check } from 'lucide-react';
import { authService } from '../services/api';

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Check for registration success message on component mount
  useEffect(() => {
    const registrationSuccess = sessionStorage.getItem('registrationSuccess');
    if (registrationSuccess) {
      setSuccessMessage(registrationSuccess);
      sessionStorage.removeItem('registrationSuccess');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);

      // Store token and user data
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLogin(response.data.user, response.data.token);

        // Redirect based on user role
        switch (response.data.user.role) {
          case 'field_owner':
            navigate('/field-owner-dashboard');
            break;
          case 'team_captain':
            navigate('/captain-dashboard');
            break;
          default:
            navigate('/dashboard');
            break;
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

 return (
  <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 overflow-hidden">
    
    {/* Left Hero Section */}
    <div className="hidden md:flex w-1/2 relative items-center justify-center">
      <img
        src="https://www.scorefc.com/wp-content/uploads/2023/09/Book-A-Football-Pitch.png"
        alt="Football Field"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80"></div>

      <div className="relative z-10 text-center text-white px-10 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-7xl font-black tracking-wider text-yellow-400 drop-shadow-2xl transform hover:scale-105 transition-transform duration-300">
            COPA
          </h1>
          <div className="w-24 h-1 bg-yellow-400 mx-auto mt-4 rounded-full"></div>
        </div>
        <p className="text-2xl mt-4 tracking-widest font-light">
          SOCCER TRAINING CENTER
        </p>
        <div className="mt-8 space-y-2">
          <p className="text-sm opacity-90">🏆 Professional Facilities</p>
          <p className="text-sm opacity-90">⚽ Easy Booking System</p>
          <p className="text-sm opacity-90">🌟 Cambodia's Premier Destination</p>
        </div>
      </div>
    </div>

    {/* Right Login Section */}
    <div className="flex w-full md:w-1/2 items-center justify-center p-6 relative">
      <img
        src="https://www.scorefc.com/wp-content/uploads/2023/09/Book-A-Football-Pitch.png"
        alt="Football Field"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80"></div>

      {/* Glass Card */}
      <div className="relative w-full max-w-md backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all duration-500 hover:scale-[1.02] animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
            <User className="text-white" size={36} />
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-2">
            Welcome Back 👋
          </h2>
          <p className="text-gray-600 text-lg">
            Sign in to access your account
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 flex items-center gap-3 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 animate-shake">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">!</span>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Username */}
          <div className="group">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
              </div>
              <input
                type="text"
                name="username"
                required
                placeholder="Enter username or email"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="group">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="Enter password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-yellow-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-3 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2" 
              />
              <span className="font-medium">Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-yellow-600 hover:text-yellow-700 font-semibold hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-black rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex justify-center items-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Don't have an account?</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-bold text-lg hover:underline transition-all duration-200"
          >
            Create Account
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8l-8 8-8-8" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  </div>
);
};

export default Login;
