import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, CalendarIcon, UsersIcon, MapPinIcon } from 'lucide-react';
import { useEvents } from '../context/EventContext';
const Events: React.FC = () => {
  const {
    events
  } = useEvents();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.status === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  return <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Manage all your events in one place</p>
        </div>
        <Link to="/events/new" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Event
        </Link>
      </div>
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-2">
              <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                All
              </button>
              <button onClick={() => setFilter('upcoming')} className={`px-3 py-1 text-sm rounded-md ${filter === 'upcoming' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                Upcoming
              </button>
              <button onClick={() => setFilter('past')} className={`px-3 py-1 text-sm rounded-md ${filter === 'past' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                Past
              </button>
            </div>
            <div className="relative">
              <input type="text" placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.length > 0 ? filteredEvents.map(event => <Link key={event.id} to={`/events/${event.id}`} className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">
                        {event.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'upcoming' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {event.description}
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>
                        {event.date} at {event.time}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      <span>{event.attendees} attendees</span>
                    </div>
                  </div>
                </Link>) : <div className="col-span-3 text-center py-8">
                <p className="text-gray-500">
                  No events found. Try a different search or filter.
                </p>
              </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default Events;