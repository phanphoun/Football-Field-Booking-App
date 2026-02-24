import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save } from 'lucide-react';
import { userService } from '../services/api';

const Profile = ({ user }) => {
  const [profileData, setProfileData] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setProfileData(user || {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    try {
      await userService.updateProfile(profileData);
      setSuccess('Profile updated successfully!');
      // Update user in localStorage
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfileData(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle avatar upload
      console.log('Uploading avatar:', file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">Manage your personal information</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-success-50 border border border-success-200 rounded-md">
            <div className="flex items-center">
              <span className="text-success-800">{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {profileData.profile_image ? (
                    <img
                      src={profileData.profile_image}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="text-gray-400" size={48} />
                  )}
                </div>
                <label className="btn btn-secondary btn-sm">
                  <Camera size={16} className="mr-2" />
                  Change Avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      className="input"
                      value={profileData.full_name || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      name="username"
                      className="input"
                      value={profileData.username || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="input"
                      value={profileData.email || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="input"
                      value={profileData.phone || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      className="input"
                      value={profileData.date_of_birth || ''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Gender</label>
                    <select
                      name="gender"
                      className="input"
                      value={profileData.gender || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    rows="3"
                    className="input"
                    value={profileData.address || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : null}
                    {loading ? 'Saving...' : 'Save Changes'}
                    <Save size={16} className="ml-2" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
