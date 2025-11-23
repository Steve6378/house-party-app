import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, UsersIcon, MessageCircleIcon, ClockIcon, InfoIcon, UserIcon, Users2Icon } from 'lucide-react';
const EventDetail: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  // Mock event data
  const event = {
    id: '1',
    title: 'Thanksgiving Potluck',
    date: 'Nov 24, 2023',
    time: '4:00 PM',
    location: '456 West 28th St, Apt 201, LA',
    locationDetails: 'Guest parking code 2811',
    attendees: [{
      id: '1',
      name: 'Amane',
      role: 'Host'
    }, {
      id: '2',
      name: 'Mahiru',
      role: 'Co-host'
    }, {
      id: '3',
      name: 'Jake',
      dietary: 'Vegetarian'
    }, {
      id: '4',
      name: 'Nirali',
      dietary: 'Vegan'
    }, {
      id: '5',
      name: 'Maya'
    }, {
      id: '6',
      name: 'Tanya'
    }],
    description: 'Join us for a Thanksgiving potluck! Amane is cooking turkey. Sign up in chat for what you want to bring.',
    groundTruthFacts: [{
      id: '1',
      type: 'address',
      value: '456 West 28th St, Apt 201, LA'
    }, {
      id: '2',
      type: 'parking',
      value: 'Guest parking code 2811'
    }, {
      id: '3',
      type: 'food',
      value: 'Potluck! Amane cooking turkey. Sign up in chat.'
    }, {
      id: '4',
      type: 'dietary',
      value: 'Jake vegetarian, Nirali vegan'
    }],
    budget: '$25/person',
    type: 'Social',
    status: 'upcoming'
  };
  return <div className="container mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/events" className="hover:text-indigo-600">
            Events
          </Link>
          <span>/</span>
          <span>{event.title}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <div className="mt-2 md:mt-0 flex space-x-2">
            <Link to={`/host/${id}`} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <UserIcon className="h-4 w-4 mr-2" />
              Host Chat
            </Link>
            <Link to={`/group/${id}`} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Users2Icon className="h-4 w-4 mr-2" />
              Group Chat
            </Link>
            <Link to={`/guest/${id}`} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <MessageCircleIcon className="h-4 w-4 mr-2" />
              Guest Chat
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Event Details
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Description
                </h3>
                <p className="text-gray-900">{event.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Date & Time
                  </h3>
                  <div className="flex items-center text-gray-900">
                    <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span>
                      {event.date} at {event.time}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Location
                  </h3>
                  <div className="flex items-start text-gray-900">
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <div>{event.location}</div>
                      {event.locationDetails && <div className="text-sm text-gray-500 mt-1">
                          {event.locationDetails}
                        </div>}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Budget
                  </h3>
                  <div className="flex items-center text-gray-900">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span>{event.budget}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Type
                  </h3>
                  <div className="flex items-center text-gray-900">
                    <InfoIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span>{event.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Ground Truth Facts
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.groundTruthFacts.map(fact => <div key={fact.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 capitalize">
                      {fact.type}
                    </h3>
                    <p className="text-gray-900">{fact.value}</p>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Attendees</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {event.attendees.map(attendee => <div key={attendee.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800 font-medium">
                        {attendee.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {attendee.name}
                      </p>
                      <div className="flex items-center">
                        {attendee.role && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            {attendee.role}
                          </span>}
                        {attendee.dietary && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {attendee.dietary}
                          </span>}
                      </div>
                    </div>
                  </div>)}
              </div>
              <div className="mt-4">
                <button className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Invite More People
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Quick Actions
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <Link to={`/chat/${id}`} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <MessageCircleIcon className="h-5 w-5 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Open Chat
                    </p>
                    <p className="text-xs text-gray-500">
                      Ask questions or chat with attendees
                    </p>
                  </div>
                </Link>
                <button className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <CalendarIcon className="h-5 w-5 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Add to Calendar
                    </p>
                    <p className="text-xs text-gray-500">
                      Sync with your calendar app
                    </p>
                  </div>
                </button>
                <button className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <MapPinIcon className="h-5 w-5 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Get Directions
                    </p>
                    <p className="text-xs text-gray-500">
                      Open location in maps
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default EventDetail;