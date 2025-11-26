import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, Search, MapPin, Calendar, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI, attendanceAPI } from '../utils/api.ts';

function JoinEventPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNearbyEvents();
    fetchPendingInvites();
  }, []);

  const fetchNearbyEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.list();
      // Only show PUBLIC events that user is not hosting
      const filtered = (response.events || response || []).filter(
        e => e.main_host_id !== user.id && e.visibility === 'public'
      );
      setNearbyEvents(filtered);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      // Fetch pending invitations from the backend
      const invitations = await attendanceAPI.getMyInvitations();
      setPendingInvites(invitations);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await attendanceAPI.updateAttendance(eventId, { rsvp_status: 'yes' });
      toast.success('Joined event successfully!');
      // Navigate to guest interface
      navigate(`/event/${eventId}/guest`);
    } catch (error) {
      console.error('Join event error:', error);
      toast.error('Failed to join event');
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

  const EventCard = ({ event, isPending }) => {
    // Handle both invitation format and event format
    const displayName = isPending ? event.event_name : event.name;
    const displayDate = isPending ? event.event_date : event.date;
    const displayTime = isPending ? event.event_time : event.time;
    const displayLocation = isPending ? event.event_address : event.address;
    const eventId = isPending ? event.event_id : event.id;

    return (
      <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">{displayName}</h3>

        {isPending && event.host_name && (
          <p className="text-accent-400 text-sm mb-4">Invited by: {event.host_name}</p>
        )}

        <div className="space-y-2 text-gray-300 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-400" />
            <span className="text-sm">{displayDate}</span>
          </div>
          {displayTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-400" />
              <span className="text-sm">{displayTime}</span>
            </div>
          )}
          {displayLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-400" />
              <span className="text-sm">{displayLocation}</span>
            </div>
          )}
          {!isPending && event.expected_guests && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-400" />
              <span className="text-sm">~{event.expected_guests} expected</span>
            </div>
          )}
        </div>

        {!isPending && event.description && (
          <p className="text-gray-400 text-sm mb-6">{event.description}</p>
        )}

        {isPending ? (
          <div className="flex gap-3">
            <button
              onClick={() => handleJoinEvent(eventId)}
              className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Accept Invite
            </button>
            <button
              onClick={() => handleDeclineInvite(eventId)}
              className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 py-3 rounded-lg font-semibold transition"
            >
              Decline
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleJoinEvent(eventId)}
            className="w-full bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Join Event
          </button>
        )}
      </div>
    );
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join an Event</h1>
          <p className="text-primary-200">Discover and join exciting events near you</p>
        </div>

        {/* Search Bar */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by name, location, or host..."
                className="w-full pl-12 pr-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>
            <button className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-8 py-3 rounded-lg font-semibold transition">
              Search
            </button>
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Pending Invitations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingInvites.map((event) => (
                <EventCard key={event._id} event={event} isPending={true} />
              ))}
            </div>
          </div>
        )}

        {/* Events Nearby */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Events Near You</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-400 mx-auto"></div>
              <p className="mt-4 text-primary-200">Loading events...</p>
            </div>
          ) : nearbyEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyEvents
                .filter(e =>
                  e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  e.hostName.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((event) => (
                  <EventCard key={event._id} event={event} isPending={false} />
                ))}
            </div>
          ) : (
            <div className="bg-dark-800/30 backdrop-blur-xl border border-primary-500/20 rounded-xl p-12 text-center">
              <MapPin className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No events found nearby</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinEventPage;
