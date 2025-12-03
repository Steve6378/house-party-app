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
  Image as ImageIcon,
  Save,
  Loader2,
  Scan,
  MapPin,
  Navigation,
  X,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../utils/api.ts';
import { API_URL } from '../config/api';
import ImageCropper from '../components/ImageCropper';
import { isNative, takePicture, pickPhoto } from '../utils/native';

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
  const [showFaceModal, setShowFaceModal] = useState(null); // 'enable' or 'disable' or null
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);

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
      if (user.profile_photo && token) {
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
      if (file.size > 10 * 1024 * 1024) { // Allow larger for cropping, will compress
        toast.error('Photo must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Show cropper instead of uploading directly
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false);
    setCropperImage(null);
    setProfilePhoto(croppedFile);

    // Show local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(croppedFile);

    // Upload to backend
    setPhotoUploading(true);
    try {
      const updatedUser = await authAPI.uploadProfilePhoto(croppedFile);
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
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropperImage(null);
  };

  // Handle image selection for mobile
  const handleImageSourceSelect = async (source) => {
    setShowImageSourcePicker(false);
    try {
      const imageUrl = source === 'camera' ? await takePicture() : await pickPhoto();
      if (imageUrl) {
        setCropperImage(imageUrl);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      toast.error('Failed to access camera/gallery');
    }
  };

  const handlePhotoButtonClick = () => {
    if (isNative) {
      setShowImageSourcePicker(true);
    } else {
      fileInputRef.current?.click();
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

  const handleEnableFaceRecognition = () => {
    if (!user?.profile_photo) {
      toast.error('Please upload a profile photo first');
      return;
    }
    setShowFaceModal('enable');
  };

  const handleDisableFaceRecognition = () => {
    setShowFaceModal('disable');
  };

  const confirmFaceRecognitionAction = async () => {
    const action = showFaceModal;
    setShowFaceModal(null);
    setFaceEncodingLoading(true);

    try {
      if (action === 'enable') {
        const result = await authAPI.refreshFaceEncoding();
        const updatedUser = await authAPI.getProfile();
        updateUser(updatedUser);
        toast.success(result.message || 'Face recognition enabled! You can now use #photos to find yourself in event photos.');
      } else {
        const result = await authAPI.disableFaceRecognition();
        const updatedUser = await authAPI.getProfile();
        updateUser(updatedUser);
        toast.success(result.message || 'Face recognition disabled.');
      }
    } catch (error) {
      console.error(`Failed to ${action} face recognition:`, error);
      const errorMessage = error.response?.data?.detail ||
        (action === 'enable'
          ? 'Failed to enable face recognition. Make sure your profile photo has a clear, visible face.'
          : 'Failed to disable face recognition.');
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
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 items-center justify-center text-white font-bold text-2xl border-4 border-primary-500/30 ${photoPreview ? 'hidden' : 'flex'}`}
                >
                  {getInitials(formData.name)}
                </div>
                <button
                  type="button"
                  onClick={handlePhotoButtonClick}
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
                      {user?.has_face_encoding && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          Enabled
                        </span>
                      )}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {user?.has_face_encoding
                        ? 'You can find yourself in event photos using #photos'
                        : 'Enable to find yourself in event photos using #photos'
                      }
                    </p>
                  </div>
                  {user?.has_face_encoding ? (
                    <button
                      type="button"
                      onClick={handleDisableFaceRecognition}
                      disabled={faceEncodingLoading}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {faceEncodingLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Scan className="w-4 h-4" />
                          Disable
                        </>
                      )}
                    </button>
                  ) : (
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
                          Enable
                        </>
                      )}
                    </button>
                  )}
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

      {/* Profile Photo Cropper */}
      {showCropper && cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          cropShape="round"
          title="Crop Profile Photo"
        />
      )}

      {/* Face Recognition Confirmation Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-primary-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {showFaceModal === 'enable' ? (
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <ShieldOff className="w-6 h-6 text-red-400" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">
                  {showFaceModal === 'enable' ? 'Enable Face Recognition' : 'Disable Face Recognition'}
                </h3>
              </div>
              <button
                onClick={() => setShowFaceModal(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showFaceModal === 'enable' ? (
              <div className="space-y-4 mb-6">
                <p className="text-gray-300">
                  By enabling face recognition, you agree to the following:
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>We will create a facial encoding from your profile photo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>This encoding is used <strong className="text-gray-300">only</strong> to find photos of you at events you attend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>Your face data is stored securely and never shared with third parties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>You can disable this feature anytime and we will delete your face data</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <p className="text-gray-300">
                  Are you sure you want to disable face recognition?
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>Your facial encoding will be <strong className="text-gray-300">permanently deleted</strong> from our servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>You will no longer be able to use <strong className="text-gray-300">#photos</strong> to find yourself in event photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-500 mt-0.5">•</span>
                    <span>You can re-enable this feature anytime by uploading a new profile photo</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowFaceModal(null)}
                className="flex-1 px-4 py-3 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmFaceRecognitionAction}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                  showFaceModal === 'enable'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {showFaceModal === 'enable' ? 'Yes, Enable' : 'Yes, Disable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Source Picker (Mobile) */}
      {showImageSourcePicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-dark-800 border border-primary-500/30 rounded-2xl w-full max-w-sm p-4 mb-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Choose Photo Source</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleImageSourceSelect('camera')}
                className="w-full flex items-center gap-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-xl transition"
              >
                <Camera className="w-6 h-6 text-primary-400" />
                <span className="text-white font-medium">Take Photo</span>
              </button>
              <button
                onClick={() => handleImageSourceSelect('gallery')}
                className="w-full flex items-center gap-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-xl transition"
              >
                <ImageIcon className="w-6 h-6 text-secondary-400" />
                <span className="text-white font-medium">Choose from Gallery</span>
              </button>
            </div>
            <button
              onClick={() => setShowImageSourcePicker(false)}
              className="w-full mt-4 p-3 text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
