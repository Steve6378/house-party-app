import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  Video,
  DollarSign,
  Globe,
  Filter,
  Loader,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI, attendanceAPI } from '../utils/api.ts';

function JoinEventPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [publicEvents, setPublicEvents] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    is_online: null,
    is_free: null,
    radius_km: 50
  });

  useEffect(() => {
    fetchPendingInvites();

    // Get user's location for nearby discovery
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          // Load events without location filtering
          fetchPublicEvents();
        }
      );
    } else {
      fetchPublicEvents();
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchPublicEvents();
    }
  }, [userLocation, filters]);

  const fetchPublicEvents = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        ...(userLocation && {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        })
      };

      // Remove null values
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await eventsAPI.discoverPublic(params);
      setPublicEvents(response.events || []);
    } catch (error) {
      console.error('Failed to fetch public events:', error);
      toast.error('Failed to load public events');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const invitations = await attendanceAPI.getMyInvitations();
      setPendingInvites(invitations || []);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  const handleAcceptInvite = async (eventId) => {
    try {
      await attendanceAPI.updateAttendance(eventId, { rsvp_status: 'yes' });
      toast.success('Joined event successfully!');
      navigate(`/event/${eventId}/guest`);
    } catch (error) {
      console.error('Accept invite error:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleDeclineInvite = async (eventId) => {
    try {
      await attendanceAPI.updateAttendance(eventId, { rsvp_status: 'no' });
      toast.success('Invitation declined');
      fetchPendingInvites();
    } catch (error) {
      toast.error('Failed to decline invitation');
    }
  };

  const handleJoinPublicEvent = async (eventId) => {
    setJoining(eventId);
    try {
      const response = await eventsAPI.join(eventId);
      toast.success(response.message);
      navigate(`/event/${eventId}/guest`);
    } catch (error) {
      console.error('Join event error:', error);
      toast.error(error.response?.data?.detail || 'Failed to join event');
    } finally {
      setJoining(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    // If already has AM/PM, return as-is
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    // Otherwise convert from 24-hour format
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hour = parseInt(parts[0]);
    const minutes = parts[1];
    if (isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Invitation Card Component
  const InvitationCard = ({ invite }) => {
    const eventId = invite.event_id;
    return (
      <div className="bg-dark-800/50 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
            Invitation
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{invite.event_name}</h3>
        {invite.host_name && (
          <p className="text-accent-400 text-sm mb-4">Invited by: {invite.host_name}</p>
        )}

        <div className="space-y-2 text-gray-300 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-400" />
            <span className="text-sm">{formatDate(invite.event_date)}</span>
          </div>
          {invite.event_time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-400" />
              <span className="text-sm">{formatTime(invite.event_time)}</span>
            </div>
          )}
          {invite.event_address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-400" />
              <span className="text-sm">{invite.event_address}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleAcceptInvite(eventId)}
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Accept
          </button>
          <button
            onClick={() => handleDeclineInvite(eventId)}
            className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 py-3 rounded-lg font-semibold transition"
          >
            Decline
          </button>
        </div>
      </div>
    );
  };

  // Public Event Card Component
  const PublicEventCard = ({ event }) => {
    return (
      <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-xl p-6 hover:border-primary-500/40 transition">
        {/* Event Type Badges */}
        <div className="flex gap-2 mb-3">
          {event.is_online ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
              <Video className="w-3 h-3" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
              <MapPin className="w-3 h-3" />
              In-Person
            </span>
          )}
          {event.is_paid ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
              <DollarSign className="w-3 h-3" />
              ${event.ticket_price}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
              Free
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
        <p className="text-primary-300 text-sm mb-4">{event.event_type}</p>

        <div className="space-y-2 text-gray-300 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-400" />
            <span className="text-sm">{formatDate(event.date)}</span>
          </div>
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-400" />
              <span className="text-sm">{formatTime(event.time)}</span>
            </div>
          )}
          {event.address && !event.is_online && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-400" />
              <span className="text-sm truncate">{event.address}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => handleJoinPublicEvent(event.id)}
          disabled={joining === event.id}
          className="w-full bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {joining === event.id ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              Join Event
            </>
          )}
        </button>
      </div>
    );
  };

  // Filter public events by search query
  const filteredPublicEvents = publicEvents.filter(event => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.name?.toLowerCase().includes(query) ||
      event.address?.toLowerCase().includes(query) ||
      event.event_type?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900">
      <nav className="bg-dark-800/50 backdrop-blur-xl border-b border-primary-500/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-300 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-gray-300 hover:text-white transition"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join an Event</h1>
          <p className="text-primary-200">Accept invitations or discover public events near you</p>
        </div>

        {/* Search Bar */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by name, location, or type..."
                className="w-full pl-12 pr-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Filter Public Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event Type */}
              <div>
                <label className="block text-sm text-primary-200 mb-2">Event Type</label>
                <select
                  value={filters.is_online === null ? '' : filters.is_online ? 'online' : 'offline'}
                  onChange={(e) => setFilters({
                    ...filters,
                    is_online: e.target.value === '' ? null : e.target.value === 'online'
                  })}
                  className="w-full px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Events</option>
                  <option value="offline">In-Person Only</option>
                  <option value="online">Online Only</option>
                </select>
              </div>

              {/* Ticket Type */}
              <div>
                <label className="block text-sm text-primary-200 mb-2">Ticket Type</label>
                <select
                  value={filters.is_free === null ? '' : filters.is_free ? 'free' : 'paid'}
                  onChange={(e) => setFilters({
                    ...filters,
                    is_free: e.target.value === '' ? null : e.target.value === 'free'
                  })}
                  className="w-full px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All</option>
                  <option value="free">Free Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm text-primary-200 mb-2">
                  Distance: {filters.radius_km} km {!userLocation && '(Enable location)'}
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={filters.radius_km}
                  onChange={(e) => setFilters({ ...filters, radius_km: parseInt(e.target.value) })}
                  className="w-full"
                  disabled={!userLocation}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setFilters({ is_online: null, is_free: null, radius_km: 50 })}
                className="px-4 py-2 text-primary-300 hover:text-white transition"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchPublicEvents}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="bg-yellow-500/20 text-yellow-300 text-sm px-3 py-1 rounded-full">
                {pendingInvites.length}
              </span>
              Pending Invitations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingInvites.map((invite) => (
                <InvitationCard key={invite.event_id || invite.id} invite={invite} />
              ))}
            </div>
          </div>
        )}

        {/* Public Events */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary-400" />
            Public Events Near You
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-8 h-8 text-primary-400 animate-spin mb-4" />
              <p className="text-gray-400">Loading public events...</p>
            </div>
          ) : filteredPublicEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublicEvents.map((event) => (
                <PublicEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-dark-800/30 backdrop-blur-xl border border-primary-500/20 rounded-xl p-12 text-center">
              <Globe className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No public events found</p>
              <p className="text-gray-500 text-sm">
                {userLocation
                  ? 'Try adjusting your filters or expanding the search radius'
                  : 'Enable location to find events near you'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinEventPage;
