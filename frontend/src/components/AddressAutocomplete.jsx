import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { initGoogleMaps } from '../utils/googleMaps';

/**
 * AddressAutocomplete component with Google Places API
 * Provides autocomplete suggestions as user types an address
 */
function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter address...',
  className = '',
  disabled = false
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const wrapperRef = useRef(null);

  // Initialize Google Places API
  useEffect(() => {
    const initPlaces = async () => {
      try {
        // Use centralized Google Maps initialization
        await initGoogleMaps();

        // Create services
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();

        // Create a dummy div for PlacesService (required)
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);

        // Create session token for billing efficiency
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Google Places:', error);
      }
    };

    initPlaces();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when value changes
  useEffect(() => {
    if (!initialized || !value || value.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const request = {
          input: value,
          sessionToken: sessionTokenRef.current,
          types: ['address', 'establishment', 'geocode']
        };

        autocompleteServiceRef.current.getPlacePredictions(
          request,
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions);
              setIsOpen(true);
            } else {
              setSuggestions([]);
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, initialized]);

  // Handle suggestion selection
  const handleSelect = async (suggestion) => {
    setIsOpen(false);
    setSuggestions([]);

    // Get place details including lat/lng
    const request = {
      placeId: suggestion.place_id,
      fields: ['formatted_address', 'geometry', 'name'],
      sessionToken: sessionTokenRef.current
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const location = {
          address: place.formatted_address || suggestion.description,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
          name: place.name
        };

        // Update the input value
        onChange(location.address);

        // Call onSelect with full location data
        if (onSelect) {
          onSelect(location);
        }

        // Create new session token for next search
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }
    });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 pl-10 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${className}`}
        />
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400 animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-primary-500/30 rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-primary-600/30 transition flex items-start gap-3 ${
                index !== suggestions.length - 1 ? 'border-b border-primary-500/20' : ''
              }`}
            >
              <MapPin className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">
                  {suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0]}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {suggestion.structured_formatting?.secondary_text || suggestion.description}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 bg-dark-900/50 border-t border-primary-500/20">
            <img
              src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_non_white.png"
              alt="Powered by Google"
              className="h-4 opacity-70"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
