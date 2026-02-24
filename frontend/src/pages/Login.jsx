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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="card p-8">
          {successMessage && (
            <div className="mb-4 p-4 bg-success-50 border border border-success-200 rounded-md">
              <div className="flex items-center">
                <Check className="text-success-600 mr-2" size={18} />
                <span className="text-success-800">{successMessage}</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border border-danger-200 rounded-md">
              <div className="flex items-center">
                <span className="text-danger-800">{error}</span>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username or Email
              </label>
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="input pl-10"
                  placeholder="Enter your username or email"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-gray-400" />
                  ) : (
                    <Eye size={18} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : null}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Demo Accounts</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">Player Demo</div>
              <button
                onClick={() => {
                  setFormData({ username: 'player1', password: 'password123' });
                  setError('');
                }}
                className="btn btn-secondary w-full text-sm"
                disabled={loading}
              >
                Use Player Account
              </button>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">Field Owner Demo</div>
              <button
                onClick={() => {
                  setFormData({ username: 'fieldowner1', password: 'password123' });
                  setError('');
                }}
                className="btn btn-secondary w-full text-sm"
                disabled={loading}
              >
                Use Field Owner Account
              </button>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">Captain Demo</div>
              <button
                onClick={() => {
                  setFormData({ username: 'captain1', password: 'password123' });
                  setError('');
                }}
                className="btn btn-secondary w-full text-sm"
                disabled={loading}
              >
                Use Captain Account
              </button>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">Admin Demo</div>
              <button
                onClick={() => {
                  setFormData({ username: 'admin1', password: 'password123' });
                  setError('');
                }}
                className="btn btn-secondary w-full text-sm"
                disabled={loading}
              >
                Use Admin Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
