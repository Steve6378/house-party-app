import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Calendar,
  Clock,
  MapPin,
  Users,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI } from '../utils/api.ts';
import { GOOGLE_MAPS_API_KEY } from '../config/api';

function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState('chat');
  const [conversationStep, setConversationStep] = useState('name'); // name, date, time, location
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI event planning assistant. Let's create an amazing event together! 🎉\n\nFirst, what would you like to call your event?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState({
    name: '',
    event_type: 'custom',
    date: '',
    time: '',
    address: '',
    expected_guests: ''
  });
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    // Only initialize if not already initialized
    if (!mapInitialized) {
      initializeGoogleMaps();
    }
  }, []);

  const initializeGoogleMaps = async () => {
    try {
      // Set options only once
      if (!window.google) {
        setOptions({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly'
        });
      }

      await importLibrary('places');
      setMapInitialized(true);
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);

    try {
      // Process based on current conversation step
      let nextStep = conversationStep;
      let aiResponse = '';
      const updatedEventData = { ...eventData };

      if (conversationStep === 'name') {
        updatedEventData.name = userMessage;
        aiResponse = `Great! "${userMessage}" sounds like a wonderful event! 🎊\n\nWhen is this event happening? Please provide the date.`;
        nextStep = 'date';
      } else if (conversationStep === 'date') {
        updatedEventData.date = parseDateInput(userMessage);
        aiResponse = `Perfect! I've got the date. ⏰\n\nWhat time will the event start?`;
        nextStep = 'time';
      } else if (conversationStep === 'time') {
        const parsedTime = parseTimeInput(userMessage);
        // Only store if successfully parsed, otherwise store empty to skip time
        updatedEventData.time = parsedTime || '';
        aiResponse = `Excellent! 📍\n\nNow, where will this event take place? Please provide the address or location.`;
        nextStep = 'location';
      } else if (conversationStep === 'location') {
        updatedEventData.address = userMessage;
        aiResponse = `Wonderful! I have all the key details:\n\n✅ Event: ${updatedEventData.name}\n✅ Date: ${updatedEventData.date}\n✅ Time: ${updatedEventData.time}\n✅ Location: ${updatedEventData.address}\n\nWould you like to create this event now? You can click "Create Event" below or continue to add more details!`;
        nextStep = 'complete';

        // Auto-search location on map
        if (mapInitialized) {
          searchLocation(userMessage, updatedEventData.name);
        }
      }

      setEventData(updatedEventData);
      setConversationStep(nextStep);
      setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('AI error:', error);
      toast.error('Something went wrong. Please try again.');
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you please try again?'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const parseTimeInput = (input) => {
    if (!input || input.trim() === '') return null;

    const normalized = input.toLowerCase().trim();

    // Already in HH:MM or HH:MM:SS format
    const timePattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    const timeMatch = normalized.match(timePattern);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2];
      const seconds = timeMatch[3] || '00';
      return `${hours}:${minutes}:${seconds}`;
    }

    // 12-hour format with am/pm (7pm, 7:30pm, 7:30 PM, 7 pm, 7:30 pm, etc.)
    // \s* allows optional space between number/time and am/pm
    const twelveHourPattern = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/;
    const twelveHourMatch = normalized.match(twelveHourPattern);
    if (twelveHourMatch) {
      let hours = parseInt(twelveHourMatch[1]);
      const minutes = twelveHourMatch[2] || '00';
      const period = twelveHourMatch[3];

      // Convert to 24-hour format
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }

    // Just a number (assume PM if >= 7, AM otherwise)
    const numberPattern = /^(\d{1,2})$/;
    const numberMatch = normalized.match(numberPattern);
    if (numberMatch) {
      let hours = parseInt(numberMatch[1]);
      // Assume PM for common evening hours (7-11), AM for others
      if (hours >= 7 && hours <= 11) {
        hours += 12;
      }
      return `${hours.toString().padStart(2, '0')}:00:00`;
    }

    return null; // Return null if no pattern matches
  };

  const parseDateInput = (input) => {
    const normalized = input.toLowerCase().trim();

    // Already in YYYY-MM-DD format
    const isoPattern = /(\d{4}-\d{2}-\d{2})/;
    const isoMatch = normalized.match(isoPattern);
    if (isoMatch) return isoMatch[0];

    // MM/DD/YYYY or M/D/YYYY
    const slashPattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const slashMatch = normalized.match(slashPattern);
    if (slashMatch) {
      const [, month, day, year] = slashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Month names (Nov 6, November 6, Dec 25th, etc.)
    const monthNames = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', sept: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12'
    };

    // Match "Nov 6", "November 6th", "Dec 25", etc.
    for (const [monthName, monthNum] of Object.entries(monthNames)) {
      const pattern = new RegExp(`${monthName}\\s+(\\d{1,2})(st|nd|rd|th)?`, 'i');
      const match = normalized.match(pattern);
      if (match) {
        const day = match[1].padStart(2, '0');
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;

        // If month has passed this year, use next year
        const currentMonth = new Date().getMonth() + 1;
        const year = parseInt(monthNum) < currentMonth ? nextYear : currentYear;

        return `${year}-${monthNum}-${day}`;
      }
    }

    // Just a number (assume day in current/next month)
    const dayOnlyPattern = /^(\d{1,2})(st|nd|rd|th)?$/;
    const dayMatch = normalized.match(dayOnlyPattern);
    if (dayMatch) {
      const day = dayMatch[1].padStart(2, '0');
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      return `${year}-${month}-${day}`;
    }

    // If nothing matches, try JavaScript's Date parser as last resort
    try {
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // Ignore parse errors
    }

    return input; // Return as-is if no pattern matches
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

        // Try both map div IDs (one for chat mode, one for manual mode)
        setTimeout(() => {
          const mapDiv = document.getElementById('event-map') || document.getElementById('event-map-manual');
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
        }, 100); // Small delay to ensure DOM is ready
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Could not find that location. Please try a different address.');
    }
  };

  const handleManualInput = async () => {
    setStep('manual');
  };

  const handleLocationSearch = async () => {
    if (!eventData.address || !mapInitialized) return;

    searchLocation(eventData.address, eventData.name);
  };

  const handleCreateEvent = async () => {
    if (!eventData.name || !eventData.date) {
      toast.error('Please provide at least an event name and date');
      return;
    }

    setLoading(true);

    // Declare payload outside try block so it's accessible in catch
    let payload = null;

    try {
      // Use the formatted address from geocoding if available
      const finalAddress = selectedLocation?.address || eventData.address;

      // Build the request payload, only including non-empty fields
      payload = {
        name: eventData.name,
        event_type: eventData.event_type || 'custom',
        date: parseDateInput(eventData.date) || eventData.date
      };

      // Only add time if it's actually provided, not empty, and can be parsed
      if (eventData.time && eventData.time.trim() !== '') {
        // Check if already in HH:MM format (from manual form's time input)
        if (eventData.time.match(/^\d{2}:\d{2}$/)) {
          payload.time = eventData.time;
        } else {
          // Parse natural language time (from AI chat)
          const parsedTime = parseTimeInput(eventData.time);
          if (parsedTime) {
            // Convert HH:MM:SS to HH:MM format for Pydantic
            payload.time = parsedTime.substring(0, 5);
          }
        }
        // If parsing fails, don't send time at all (backend expects None/null)
      }

      // Only add address if provided
      if (finalAddress && finalAddress.trim() !== '') {
        payload.address = finalAddress;
      }

      // Only add expected_guests if provided
      if (eventData.expected_guests) {
        const guests = parseInt(eventData.expected_guests);
        if (!isNaN(guests) && guests > 0) {
          payload.expected_guests = guests;
        }
      }

      const response = await eventsAPI.create(payload);

      toast.success('Event created successfully!');
      // Navigate to host interface since user created the event
      navigate(`/event/${response.id}/host`);
    } catch (error) {
      console.error('Create event error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Payload sent:', payload);

      // Handle validation errors (422) which return an array
      let errorMessage = 'Failed to create event';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Map validation errors to readable messages
          errorMessage = error.response.data.detail
            .map(e => `${e.loc?.join('.') || 'field'}: ${e.msg}`)
            .join('; ');
          console.error('Validation errors:', error.response.data.detail);
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          // Handle object detail
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'chat') {
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
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 p-3 rounded-2xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Event with AI</h1>
            <p className="text-primary-200">Let our AI assistant help you plan the perfect event</p>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 mb-6 h-[500px] overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                        : 'bg-dark-700/50 text-gray-200 border border-primary-500/20'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-accent-400" />
                        <span className="text-sm font-semibold text-accent-400">AI Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-dark-700/50 border border-primary-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-400"></div>
                      <span className="text-gray-300">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !userInput.trim()}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Show map if location has been set */}
          {selectedLocation && (
            <div className="mt-6 bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-3">📍 Event Location</h3>
              <div className="h-64 rounded-lg overflow-hidden border border-primary-500/30">
                <div id="event-map" className="w-full h-full"></div>
              </div>
              <p className="text-gray-300 text-sm mt-2">{selectedLocation.address}</p>
            </div>
          )}

          {/* Create Event button - shows when conversation is complete */}
          {conversationStep === 'complete' && (
            <div className="mt-6">
              <button
                onClick={handleCreateEvent}
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700 text-white py-4 px-6 rounded-2xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Creating Event...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleManualInput}
              className="text-primary-400 hover:text-primary-300 font-semibold transition"
            >
              Or enter event details manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900">
      <nav className="bg-dark-800/50 backdrop-blur-xl border-b border-primary-500/20 px-6 py-4">
        <button
          onClick={() => setStep('chat')}
          className="text-gray-300 hover:text-white transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to AI Chat
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Event Details</h1>
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
                  Time *
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
                <MapPin className="w-4 h-4" />
                Location *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventData.address}
                  onChange={(e) => setEventData({ ...eventData, address: e.target.value })}
                  className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="e.g., Central Park, New York"
                />
                <button
                  onClick={handleLocationSearch}
                  className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-lg transition"
                >
                  Find
                </button>
              </div>
            </div>

            {selectedLocation && (
              <div>
                <div className="h-64 rounded-lg overflow-hidden border border-primary-500/30 mb-2">
                  <div id="event-map-manual" className="w-full h-full"></div>
                </div>
                <p className="text-sm text-gray-300">{selectedLocation.address}</p>
              </div>
            )}

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
