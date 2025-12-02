import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  Globe,
  Lock,
  Video,
  DollarSign,
  Ticket,
  FileText,
  Sparkles,
  Tag,
  X,
  Search,
  Image,
  Upload,
  Wand2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI, aiAPI } from '../utils/api.ts';
import { initGoogleMaps } from '../utils/googleMaps';
import AddressAutocomplete from '../components/AddressAutocomplete';

function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [eventData, setEventData] = useState({
    name: '',
    event_type: 'custom',
    date: '',
    time: '',
    address: '',
    expected_guests: '',
    is_online: false,
    online_link: '',
    is_paid: false,
    ticket_price: '',
    visibility: 'private',
    latitude: null,
    longitude: null,
    description: '',
    topics: []
  });
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [topicSearch, setTopicSearch] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [createdEventId, setCreatedEventId] = useState(null);

  // Available topics based on the topics.png reference
  const availableTopics = [
    'Technology', 'Networking', 'Travel', 'Photography', 'Art',
    'Book Club', 'Creative Writing', 'Music', 'Food & Dining',
    'Fitness', 'Gaming', 'Outdoor Activities', 'Film & Movies',
    'Fashion', 'Dance', 'Comedy', 'Sports', 'Wellness',
    'Business', 'Entrepreneurship', 'Social Causes', 'Science',
    'DIY & Crafts', 'Pets', 'Family', 'Education', 'Career',
    'Performing Arts', 'Board Games', 'Roleplaying Games',
    'Communication Skills', 'Intellectual Discussions', 'Painting',
    'Computer Programming', 'Creativity', 'Technology Startups'
  ];

  const filteredTopics = availableTopics.filter(topic =>
    topic.toLowerCase().includes(topicSearch.toLowerCase()) &&
    !eventData.topics.includes(topic)
  );

  const handleAddTopic = (topic) => {
    if (!eventData.topics.includes(topic)) {
      setEventData(prev => ({
        ...prev,
        topics: [...prev.topics, topic]
      }));
    }
    setTopicSearch('');
  };

  const handleRemoveTopic = (topic) => {
    setEventData(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const handleCoverImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  const handleGenerateDescription = async () => {
    if (!eventData.name) {
      toast.error('Please enter an event name first');
      return;
    }

    setGeneratingDescription(true);
    try {
      const response = await aiAPI.generateDescription({
        name: eventData.name,
        event_type: eventData.event_type,
        topics: eventData.topics.length > 0 ? eventData.topics : undefined,
        date: eventData.date || undefined,
        address: eventData.address || undefined,
        expected_guests: eventData.expected_guests ? parseInt(eventData.expected_guests) : undefined,
        is_online: eventData.is_online
      });

      setEventData(prev => ({
        ...prev,
        description: response.description
      }));
      toast.success('Description generated!');
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  useEffect(() => {
    if (!mapInitialized) {
      initializeGoogleMapsHandler();
    }
  }, []);

  const initializeGoogleMapsHandler = async () => {
    try {
      // Use centralized Google Maps initialization
      await initGoogleMaps();
      setMapInitialized(true);
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
    }
  };

  const searchLocation = async (address, eventName) => {
    if (!window.google) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ address });

      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        setSelectedLocation({
          lat: location.lat(),
          lng: location.lng(),
          address: result.results[0].formatted_address
        });

        setTimeout(() => {
          const mapDiv = document.getElementById('event-map');
          if (mapDiv) {
            const newMap = new window.google.maps.Map(mapDiv, {
              center: location,
              zoom: 15,
              styles: [
                {
                  "featureType": "all",
                  "elementType": "geometry",
                  "stylers": [{ "color": "#242f3e" }]
                },
                {
                  "featureType": "all",
                  "elementType": "labels.text.stroke",
                  "stylers": [{ "lightness": -80 }]
                },
                {
                  "featureType": "administrative",
                  "elementType": "labels.text.fill",
                  "stylers": [{ "color": "#746855" }]
                }
              ]
            });

            new window.google.maps.Marker({
              position: location,
              map: newMap,
              title: eventName || 'Event Location'
            });

            setMap(newMap);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Could not find that location. Please try a different address.');
    }
  };

  const handleLocationSearch = async () => {
    if (!eventData.address || !mapInitialized) return;
    searchLocation(eventData.address, eventData.name);
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (location) => {
    setEventData(prev => ({
      ...prev,
      address: location.address,
      latitude: location.lat,
      longitude: location.lng
    }));

    setSelectedLocation({
      lat: location.lat,
      lng: location.lng,
      address: location.address
    });

    // Show map with the selected location
    if (location.lat && location.lng) {
      setTimeout(() => {
        const mapDiv = document.getElementById('event-map');
        if (mapDiv && window.google) {
          const position = { lat: location.lat, lng: location.lng };
          const newMap = new window.google.maps.Map(mapDiv, {
            center: position,
            zoom: 15,
            styles: [
              {
                "featureType": "all",
                "elementType": "geometry",
                "stylers": [{ "color": "#242f3e" }]
              },
              {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{ "lightness": -80 }]
              },
              {
                "featureType": "administrative",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#746855" }]
              }
            ]
          });

          new window.google.maps.Marker({
            position: position,
            map: newMap,
            title: eventData.name || 'Event Location'
          });

          setMap(newMap);
        }
      }, 100);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventData.name || !eventData.date) {
      toast.error('Please provide at least an event name and date');
      return;
    }

    setLoading(true);
    let payload = null;

    try {
      const finalAddress = selectedLocation?.address || eventData.address;

      payload = {
        name: eventData.name,
        event_type: eventData.event_type || 'custom',
        date: eventData.date,
        is_online: eventData.is_online,
        is_paid: eventData.is_paid,
        visibility: eventData.visibility || 'private'
      };

      // Add description if provided
      if (eventData.description && eventData.description.trim() !== '') {
        payload.description = eventData.description;
      }

      // Add topics if any selected
      if (eventData.topics && eventData.topics.length > 0) {
        payload.topics = eventData.topics;
      }

      if (eventData.time && eventData.time.trim() !== '') {
        payload.time = eventData.time;
      }

      if (finalAddress && finalAddress.trim() !== '') {
        payload.address = finalAddress;
      }

      if (eventData.is_online && eventData.online_link && eventData.online_link.trim() !== '') {
        payload.online_link = eventData.online_link;
      }

      if (eventData.is_paid && eventData.ticket_price) {
        const price = parseFloat(eventData.ticket_price);
        if (!isNaN(price) && price >= 0) {
          payload.ticket_price = price;
        }
      }

      if (selectedLocation?.lat && selectedLocation?.lng) {
        payload.latitude = selectedLocation.lat;
        payload.longitude = selectedLocation.lng;
      }

      if (eventData.expected_guests) {
        const guests = parseInt(eventData.expected_guests);
        if (!isNaN(guests) && guests > 0) {
          payload.expected_guests = guests;
        }
      }

      const response = await eventsAPI.create(payload);
      const eventId = response.id;

      // Upload cover image if selected
      if (coverImage) {
        setUploadingCover(true);
        try {
          await eventsAPI.uploadCoverImage(eventId, coverImage);
        } catch (err) {
          console.error('Failed to upload cover image:', err);
          toast.error('Event created but cover image upload failed');
        } finally {
          setUploadingCover(false);
        }
      }

      toast.success('Event created successfully!');
      navigate(`/event/${eventId}/host`);
    } catch (error) {
      console.error('Create event error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Payload sent:', payload);

      let errorMessage = 'Failed to create event';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(e => `${e.loc?.join('.') || 'field'}: ${e.msg}`)
            .join('; ');
          console.error('Validation errors:', error.response.data.detail);
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900">
      <nav className="bg-dark-800/50 backdrop-blur-xl border-b border-primary-500/20 px-6 py-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-300 hover:text-white transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Event</h1>
          <p className="text-primary-200">Fill in the details for your event</p>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event Name *
              </label>
              <input
                type="text"
                value={eventData.name}
                onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="e.g., Summer BBQ Party"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Cover Image
              </label>

              {coverImagePreview ? (
                <div className="relative">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-48 object-cover rounded-lg border border-primary-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCoverImage}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-primary-500/30 rounded-lg p-6 text-center hover:border-primary-500/50 transition">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-dark-700/50 rounded-full">
                      <Upload className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Upload a cover image for your event</p>
                      <p className="text-gray-500 text-xs mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <label className="px-4 py-2 bg-primary-600/50 hover:bg-primary-600 text-white text-sm rounded-lg cursor-pointer transition flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Or leave empty - AI will generate one based on your event details
                  </p>
                </div>
              )}
            </div>

            {/* Description with AI Assist */}
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </label>
              <div className="relative">
                <textarea
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                  placeholder="Describe your event..."
                />
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generatingDescription || !eventData.name}
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {generatingDescription ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      AI Assist
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Click "AI Assist" to generate a description based on your event details
              </p>
            </div>

            {/* Topics Selector */}
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Topics
              </label>

              {/* Selected Topics */}
              {eventData.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {eventData.topics.map(topic => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600/50 border border-primary-500 text-white text-sm rounded-full"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="hover:bg-primary-500/50 rounded-full p-0.5 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Topic Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Search topics..."
                />
              </div>

              {/* Available Topics */}
              <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {(topicSearch ? filteredTopics : availableTopics.filter(t => !eventData.topics.includes(t)).slice(0, 12)).map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleAddTopic(topic)}
                    className="px-3 py-1.5 bg-dark-700/50 border border-primary-500/30 text-gray-300 text-sm rounded-full hover:border-primary-500 hover:text-white transition"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Format: Online/In-Person */}
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Event Format *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setEventData({ ...eventData, is_online: false })}
                  className={`p-4 rounded-lg border transition flex items-center justify-center gap-2 ${
                    !eventData.is_online
                      ? 'bg-primary-600/50 border-primary-500 text-white'
                      : 'bg-dark-700/50 border-primary-500/30 text-gray-300 hover:border-primary-500/50'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  In-Person
                </button>
                <button
                  type="button"
                  onClick={() => setEventData({ ...eventData, is_online: true })}
                  className={`p-4 rounded-lg border transition flex items-center justify-center gap-2 ${
                    eventData.is_online
                      ? 'bg-primary-600/50 border-primary-500 text-white'
                      : 'bg-dark-700/50 border-primary-500/30 text-gray-300 hover:border-primary-500/50'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  Online
                </button>
              </div>
            </div>

            {/* Location for in-person OR Online link for online events */}
            {!eventData.is_online ? (
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <AddressAutocomplete
                  value={eventData.address}
                  onChange={(value) => setEventData({ ...eventData, address: value })}
                  onSelect={handleAddressSelect}
                  placeholder="Start typing an address..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={eventData.online_link}
                  onChange={(e) => setEventData({ ...eventData, online_link: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="e.g., https://zoom.us/j/123456789"
                />
              </div>
            )}

            {selectedLocation && !eventData.is_online && (
              <div>
                <div className="h-64 rounded-lg overflow-hidden border border-primary-500/30 mb-2">
                  <div id="event-map" className="w-full h-full"></div>
                </div>
                <p className="text-sm text-gray-300">{selectedLocation.address}</p>
              </div>
            )}

            {/* Ticket Type: Free/Paid */}
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Ticket Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setEventData({ ...eventData, is_paid: false, ticket_price: '' })}
                  className={`p-4 rounded-lg border transition flex items-center justify-center gap-2 ${
                    !eventData.is_paid
                      ? 'bg-green-600/50 border-green-500 text-white'
                      : 'bg-dark-700/50 border-primary-500/30 text-gray-300 hover:border-primary-500/50'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setEventData({ ...eventData, is_paid: true })}
                  className={`p-4 rounded-lg border transition flex items-center justify-center gap-2 ${
                    eventData.is_paid
                      ? 'bg-yellow-600/50 border-yellow-500 text-white'
                      : 'bg-dark-700/50 border-primary-500/30 text-gray-300 hover:border-primary-500/50'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  Paid
                </button>
              </div>
            </div>

            {/* Ticket Price - only show if paid */}
            {eventData.is_paid && (
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Ticket Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventData.ticket_price}
                    onChange={(e) => setEventData({ ...eventData, ticket_price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="25.00"
                  />
                </div>
              </div>
            )}

            {/* Visibility: Private/Public */}
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Event Visibility *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setEventData({ ...eventData, visibility: 'private' })}
                  className={`p-4 rounded-lg border transition flex flex-col items-center justify-center gap-1 ${
                    eventData.visibility === 'private'
                      ? 'bg-primary-600/50 border-primary-500 text-white'
                      : 'bg-dark-700/50 border-primary-500/30 text-gray-300 hover:border-primary-500/50'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>Private</span>
                  <span className="text-xs text-gray-400">Invite only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEventData({ ...eventData, visibility: 'public' })}
                  className={`p-4 rounded-lg border transition flex flex-col items-center justify-center gap-1 ${
                    eventData.visibility === 'public'
                      ? 'bg-primary-600/50 border-primary-500 text-white'
                      : 'bg-dark-700/50 border-primary-500/30 text-gray-300 hover:border-primary-500/50'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span>Public</span>
                  <span className="text-xs text-gray-400">Anyone can discover</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date *
                </label>
                <input
                  type="date"
                  value={eventData.date}
                  onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time
                </label>
                <input
                  type="time"
                  value={eventData.time}
                  onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Expected Attendees
              </label>
              <input
                type="number"
                value={eventData.expected_guests}
                onChange={(e) => setEventData({ ...eventData, expected_guests: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="e.g., 50"
              />
            </div>

            <button
              onClick={handleCreateEvent}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-4 px-6 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Event...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateEventPage;
