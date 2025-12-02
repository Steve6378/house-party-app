import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Calendar as CalendarComponent, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI } from '../utils/api.ts';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

function CalendarPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchAllEvents();
  }, [isAuthenticated, navigate, user]);

  const fetchAllEvents = async () => {
    try {
      // Get all events the user has access to
      const data = await eventsAPI.list();
      const allEvents = data.events || data || [];
      setEvents(allEvents);

      // Convert to calendar events format
      const formattedEvents = allEvents.map(event => {
        const timeStr = event.time || '18:00';
        const startDate = moment(`${event.date} ${timeStr}`, 'YYYY-MM-DD HH:mm').toDate();
        const endDate = moment(startDate).add(2, 'hours').toDate(); // Default 2 hour duration

        return {
          id: event.id,
          title: event.name,
          start: startDate,
          end: endDate,
          resource: event,
          isHost: event.main_host_id === user?.id
        };
      });

      setCalendarEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    navigate(`/event/${event.id}`);
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.isHost
        ? 'linear-gradient(to right, #6366f1, #9333ea)'
        : 'linear-gradient(to right, #06b6d4, #6366f1)',
      borderRadius: '8px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      fontWeight: 'bold',
      padding: '4px'
    };

    return {
      style
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-400 mx-auto"></div>
          <p className="mt-4 text-primary-200">Loading calendar...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 p-3 rounded-2xl">
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Event Calendar</h1>
          </div>
          <p className="text-primary-200">View all your events in one place</p>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8">
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-primary-600 to-secondary-600"></div>
              <span className="text-gray-300 text-sm">Hosting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-accent-600 to-primary-600"></div>
              <span className="text-gray-300 text-sm">Attending</span>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden" style={{ height: '700px' }}>
            <CalendarComponent
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              style={{ height: '100%' }}
              popup
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-800/30 backdrop-blur-xl border border-primary-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{events.filter(e => e.main_host_id === user?.id).length}</div>
            <p className="text-gray-300">Events Hosting</p>
          </div>
          <div className="bg-dark-800/30 backdrop-blur-xl border border-accent-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{events.filter(e => e.main_host_id !== user?.id).length}</div>
            <p className="text-gray-300">Events Attending</p>
          </div>
          <div className="bg-dark-800/30 backdrop-blur-xl border border-secondary-500/20 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{events.length}</div>
            <p className="text-gray-300">Total Events</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
