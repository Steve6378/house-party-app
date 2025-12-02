import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Save,
  Loader2,
  Scan,
  MapPin,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../utils/api.ts';
import { API_URL } from '../config/api';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, updateUser } = useAuthStore();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    bio: '',
    address: '',
    latitude: null,
    longitude: null
  });
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [faceEncodingLoading, setFaceEncodingLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Initialize form with user data
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age || '',
        bio: user.bio || '',
        address: user.address || '',
        latitude: user.latitude || null,
        longitude: user.longitude || null
      });
      // Set photo preview from user's profile_photo if it exists
      if (user.profile_photo) {
        setPhotoPreview(`${API_URL}/api/auth/me/photo?token=${token}&t=${Date.now()}`);
      }
    }
  }, [isAuthenticated, user, token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setProfilePhoto(file);
      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to backend
      setPhotoUploading(true);
      try {
        const updatedUser = await authAPI.uploadProfilePhoto(file);
        updateUser(updatedUser);
        toast.success('Profile photo updated!');
      } catch (error) {
        console.error('Failed to upload photo:', error);
        toast.error('Failed to upload photo');
        // Revert preview on error
        if (user?.profile_photo) {
          setPhotoPreview(`${API_URL}/api/auth/me/photo?token=${token}&t=${Date.now()}`);
        } else {
          setPhotoPreview(null);
        }
      } finally {
        setPhotoUploading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedUser = await authAPI.updateProfile({
        name: formData.name,
        phone: formData.phone,
        age: formData.age,
        bio: formData.bio,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude
      });

      // Update local user state
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleEnableFaceRecognition = async () => {
    if (!user?.profile_photo) {
      toast.error('Please upload a profile photo first');
      return;
    }
    setFaceEncodingLoading(true);
    try {
      const result = await authAPI.refreshFaceEncoding();
      toast.success(result.message || 'Face recognition enabled! You can now use #photos to find yourself in event photos.');
    } catch (error) {
      console.error('Failed to enable face recognition:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to enable face recognition. Make sure your profile photo has a clear, visible face.';
      toast.error(errorMessage);
    } finally {
      setFaceEncodingLoading(false);
    }
  };

  const handleAutoLocate = async () => {
    setLocationLoading(true);
    try {
      const locationData = await authAPI.autoLocate();
      setFormData(prev => ({
        ...prev,
        address: locationData.address || '',
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }));
      toast.success(`Location detected: ${locationData.address}`);
    } catch (error) {
      console.error('Failed to auto-detect location:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to detect location. Please enter your address manually.';
      toast.error(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900">
      <nav className="bg-dark-800/50 backdrop-blur-xl border-b border-primary-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-300 hover:text-white transition flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-bold text-white">Profile</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Photo Section */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-500/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-primary-500/30">
                    {getInitials(formData.name)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {photoUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-white font-medium">Upload a new photo</p>
                <p className="text-gray-400 text-sm">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>

            {/* Face Recognition Section */}
            {user?.profile_photo && (
              <div className="mt-6 pt-6 border-t border-primary-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Scan className="w-4 h-4" />
                      Face Recognition
                    </p>
                    <p className="text-gray-400 text-sm">Enable to find yourself in event photos using #photos</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnableFaceRecognition}
                    disabled={faceEncodingLoading}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {faceEncodingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        Enable Face Recognition
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Enter your email"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Enter your age"
                  min="13"
                  max="120"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Location</h2>
            <p className="text-gray-400 text-sm mb-4">
              Your location is used to provide directions to events. You can enter your address manually or auto-detect using your IP.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Your Address
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="Enter your address (city, state, country)"
                  />
                  <button
                    type="button"
                    onClick={handleAutoLocate}
                    disabled={locationLoading}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-3 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Auto-Detect
                      </>
                    )}
                  </button>
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-gray-500 mt-2">
                    Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
