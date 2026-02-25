import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, Check } from 'lucide-react';
import { authService } from '../services/api';

const Register = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    role: 'player'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.full_name) newErrors.full_name = 'Full name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Split full_name into first_name and last_name
      const nameParts = formData.full_name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      
      const registrationData = {
        ...formData,
        first_name,
        last_name
      };
      
      // Remove full_name as backend doesn't expect it
      delete registrationData.full_name;
      delete registrationData.confirmPassword;
      
      const response = await authService.register(registrationData);
      
      // Registration successful - redirect to login with success message
      if (response.data?.message) {
        // Store registration success in session storage to show on login page
        sessionStorage.setItem('registrationSuccess', 'Registration successful! Please login with your credentials.');
        
        // Redirect to login page
        navigate('/login');
      }
    } catch (err) {
      setErrors({ general: err.response?.data?.error || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear specific error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
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
        <div className="mt-8 space-y-3">
          <p className="text-lg opacity-90 font-medium">🚀 Join Our Community</p>
          <p className="text-sm opacity-80">Create your account and start booking</p>
          <p className="text-sm opacity-80">Cambodia's best football fields</p>
        </div>
      </div>
    </div>

    {/* Right Register Section */}
    <div className="flex w-full md:w-1/2 items-center justify-center p-6 relative">
      <img
        src="https://www.scorefc.com/wp-content/uploads/2023/09/Book-A-Football-Pitch.png"
        alt="Football Field"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80"></div>

      {/* Glass Card */}
      <div className="relative w-full max-w-lg backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl p-6 border border-white/20 transform transition-all duration-500 hover:scale-[1.01] animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
            <User className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Create Account 🚀
          </h2>
          <p className="text-gray-600">
            Join Cambodia's Football Community
          </p>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 animate-shake">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">!</span>
              </div>
              <span className="font-medium text-sm">{errors.general}</span>
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Username & Email Grid */}
          <div className="grid grid-cols-1 gap-4">

            {/* Username */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={16} />
                </div>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Choose username"
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm ${errors.username && 'border-red-400'}`}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-500 mt-1 font-medium animate-shake">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={16} />
                </div>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="your@email.com"
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm ${errors.email && 'border-red-400'}`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 font-medium animate-shake">{errors.email}</p>
              )}
            </div>

          </div>

          {/* Full Name */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={16} />
              </div>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter your full name"
                className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm ${errors.full_name && 'border-red-400'}`}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-red-500 mt-1 font-medium animate-shake">{errors.full_name}</p>
            )}
          </div>

          {/* Phone & Role Grid */}
          <div className="grid grid-cols-1 gap-4">
            
            {/* Phone */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Phone (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={16} />
                </div>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="+855 12 345 678"
                  className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Role */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Register As
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={16} />
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full pl-9 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-sm text-gray-900 bg-white/50 backdrop-blur-sm appearance-none cursor-pointer"
                >
                  <option value="player">⚽ Player</option>
                  <option value="team_captain">👥 Team Captain</option>
                  <option value="field_owner">🏟️ Field Owner</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          {/* Password Grid */}
          <div className="grid grid-cols-1 gap-4">

            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Create password"
                  className={`w-full pl-9 pr-9 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm ${errors.password && 'border-red-400'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-yellow-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 font-medium animate-shake">{errors.password}</p>
              )}
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Confirm password"
                  className={`w-full pl-9 pr-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all duration-200 text-sm text-gray-900 placeholder-gray-400 bg-white/50 backdrop-blur-sm ${errors.confirmPassword && 'border-red-400'}`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 font-medium animate-shake">{errors.confirmPassword}</p>
              )}
            </div>

          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 text-xs text-gray-600 p-3 bg-gray-50 rounded-lg">
            <input 
              type="checkbox" 
              required 
              className="mt-0.5 w-3 h-3 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2 cursor-pointer" 
            />
            <span className="leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-yellow-600 hover:text-yellow-700 font-semibold hover:underline transition-colors">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-yellow-600 hover:text-yellow-700 font-semibold hover:underline transition-colors">
                Privacy
              </Link>
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-black rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex justify-center items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-2 text-sm">Already have an account?</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-yellow-600 hover:text-yellow-700 font-black text-sm hover:underline transition-all duration-200"
          >
            Sign In
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  </div>
);
};

export default Register;
