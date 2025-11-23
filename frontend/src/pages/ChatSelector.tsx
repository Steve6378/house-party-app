import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, UsersIcon, ArrowRightIcon } from 'lucide-react';
import { useEvents } from '../context/EventContext';
const ChatSelector: React.FC = () => {
  const {
    events
  } = useEvents();
  const upcomingEvents = events.filter(event => event.status === 'upcoming');
  return <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Select an Event</h1>
        <p className="text-gray-600">Choose an event to start chatting</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingEvents.map(event => <Link key={event.id} to={`/chat/${event.id}/options`} className="block bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {event.title}
                </h3>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>
                    {event.date} at {event.time}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  <span>{event.attendees} attendees</span>
                </div>
              </div>
            </div>
          </Link>)}
      </div>
      {upcomingEvents.length === 0 && <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No upcoming events found.</p>
          <Link to="/events/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Create Your First Event
          </Link>
        </div>}
    </div>;
};
export default ChatSelector;