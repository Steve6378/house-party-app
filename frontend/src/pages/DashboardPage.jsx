import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Plus,
  Users,
  Calendar,
  MapPin,
  Clock,
  LogOut,
  Sparkles,
  CalendarDays,
  History,
  ChevronDown,
  Home,
  User,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI } from '../utils/api.ts';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchEvents();
  }, [isAuthenticated, navigate, user]);

  const fetchEvents = async () => {
    try {
      // Fetch all active events from FastAPI
      const response = await eventsAPI.list({ status: 'active', limit: 100 });
      setAllEvents(response.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Categorize events based on user's role
  const hostingEvents = allEvents.filter(event => event.main_host_id === user?.id);
  const attendingEvents = allEvents.filter(event =>
    event.main_host_id !== user?.id &&
    event.attendees?.some(a =>
      a.user_id === user?.id &&
      (a.rsvp_status === 'yes' || a.rsvp_status === 'going' || a.rsvp_status === 'maybe')
    )
  );
  const pastEvents = []; // We'll handle this when we add archived/past events filter

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const EventCard = ({ event, isHost }) => {
    // Format date nicely
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div
        onClick={() => navigate(`/event/${event.id}/${isHost ? 'host' : 'guest'}`)}
        className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-xl p-6 hover:border-primary-500/40 transition cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{event.name}</h3>
            {event.event_type && (
              <span className="text-xs text-primary-300 mt-1 inline-block">{event.event_type}</span>
            )}
          </div>
          {isHost && (
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
              Host
            </span>
          )}
        </div>

        <div className="space-y-2 text-gray-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-400" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-400" />
              <span className="text-sm">{event.time}</span>
            </div>
          )}
          {event.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-400" />
              <span className="text-sm">{event.address}</span>
            </div>
          )}
          {event.expected_guests && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent-400" />
              <span className="text-sm">{event.expected_guests} expected guests</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-400 mx-auto"></div>
          <p className="mt-4 text-primary-200">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900">
      <nav className="bg-dark-800/50 backdrop-blur-xl border-b border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Yorru Events</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/calendar')}
                className="text-gray-300 hover:text-white transition flex items-center gap-2"
              >
                <CalendarDays className="w-5 h-5" />
                Calendar
              </button>

              {/* User Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-dark-700/50 hover:bg-dark-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block">{user?.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-dark-800 border border-primary-500/20 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-primary-500/20">
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-dark-700 hover:text-white transition flex items-center gap-3"
                      >
                        <Home className="w-4 h-4" />
                        Home
                      </button>
                      <button
                        onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-dark-700 hover:text-white transition flex items-center gap-3"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-dark-700 hover:text-white transition flex items-center gap-3"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-primary-500/20 py-2">
                      <button
                        onClick={() => { handleLogout(); setDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-primary-200">Let's plan something amazing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/create-event')}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white p-8 rounded-2xl transition flex items-center justify-between group"
          >
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-2">Create Event</h3>
              <p className="text-primary-100">Host an amazing event with AI help</p>
            </div>
            <Plus className="w-12 h-12 group-hover:scale-110 transition" />
          </button>

          <button
            onClick={() => navigate('/join-event')}
            className="bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700 text-white p-8 rounded-2xl transition flex items-center justify-between group"
          >
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-2">Join Event</h3>
              <p className="text-accent-100">Find and join exciting events</p>
            </div>
            <Users className="w-12 h-12 group-hover:scale-110 transition" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-secondary-400" />
              <h3 className="text-2xl font-bold text-white">Your Events (Host)</h3>
            </div>
            {hostingEvents.length > 0 ? (
              <div className="space-y-4">
                {hostingEvents.map((event) => (
                  <EventCard key={event.id} event={event} isHost={true} />
                ))}
              </div>
            ) : (
              <div className="bg-dark-800/30 backdrop-blur-xl border border-primary-500/20 rounded-xl p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No events hosted yet</p>
                <button
                  onClick={() => navigate('/create-event')}
                  className="mt-4 text-primary-400 hover:text-primary-300 font-semibold"
                >
                  Create your first event
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-accent-400" />
              <h3 className="text-2xl font-bold text-white">Attending Events</h3>
            </div>
            {attendingEvents.length > 0 ? (
              <div className="space-y-4">
                {attendingEvents.map((event) => (
                  <EventCard key={event.id} event={event} isHost={false} />
                ))}
              </div>
            ) : (
              <div className="bg-dark-800/30 backdrop-blur-xl border border-primary-500/20 rounded-xl p-8 text-center">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No events joined yet</p>
                <button
                  onClick={() => navigate('/join-event')}
                  className="mt-4 text-accent-400 hover:text-accent-300 font-semibold"
                >
                  Join an event
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-6 h-6 text-primary-400" />
            <h3 className="text-2xl font-bold text-white">Past Events</h3>
          </div>
          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} isHost={event.main_host_id === user?.id} />
              ))}
            </div>
          ) : (
            <div className="bg-dark-800/30 backdrop-blur-xl border border-primary-500/20 rounded-xl p-8 text-center">
              <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No past events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
