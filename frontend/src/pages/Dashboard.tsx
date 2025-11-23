import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, UserIcon, MessageCircleIcon, PlusIcon } from 'lucide-react';
const Dashboard: React.FC = () => {
  // Mock data for upcoming events
  const upcomingEvents = [{
    id: '1',
    title: 'Thanksgiving Potluck',
    date: 'Nov 24, 2023',
    time: '4:00 PM',
    attendees: 6,
    location: '456 West 28th St, Apt 201, LA'
  }, {
    id: '2',
    title: 'Team Building Workshop',
    date: 'Dec 10, 2023',
    time: '9:00 AM',
    attendees: 12,
    location: 'Conference Room A'
  }, {
    id: '3',
    title: 'Holiday Party',
    date: 'Dec 22, 2023',
    time: '7:00 PM',
    attendees: 25,
    location: 'Downtown Venue'
  }];
  // Mock data for recent messages
  const recentMessages = [{
    id: '1',
    sender: 'Jake',
    message: "I can bring vegetarian lasagna. Just a reminder I'm vegetarian, btw.",
    time: '2 hours ago',
    eventId: '1'
  }, {
    id: '2',
    sender: 'Maya',
    message: "What's the budget? I'm tight on cash",
    time: '3 hours ago',
    eventId: '1'
  }, {
    id: '3',
    sender: 'Tanya',
    message: 'Can I bring my roommate?',
    time: '5 hours ago',
    eventId: '1'
  }];
  // Mock data for stats
  const stats = [{
    label: 'Total Events',
    value: 16
  }, {
    label: 'Active Groups',
    value: 4
  }, {
    label: 'Upcoming Events',
    value: 3
  }];
  return <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to Yorru, your AI-powered event planning assistant
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-indigo-600">
              {stat.value}
            </div>
            <div className="text-gray-500">{stat.label}</div>
          </div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Upcoming Events
            </h2>
            <Link to="/events" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View all
            </Link>
          </div>
          <div className="p-4">
            {upcomingEvents.map(event => <Link key={event.id} to={`/events/${event.id}`} className="block p-4 hover:bg-gray-50 rounded-lg transition-colors mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>
                        {event.date} at {event.time}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <UserIcon className="h-4 w-4 mr-1" />
                      <span>{event.attendees} attendees</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Upcoming
                  </span>
                </div>
              </Link>)}
            <div className="mt-4">
              <Link to="/events/new" className="flex items-center justify-center w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Event
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Messages
            </h2>
            <Link to="/chat/1" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View all
            </Link>
          </div>
          <div className="p-4">
            {recentMessages.map(message => <Link key={message.id} to={`/chat/${message.eventId}`} className="block p-4 hover:bg-gray-50 rounded-lg transition-colors mb-2">
                <div className="flex justify-between">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800 font-medium">
                        {message.sender.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {message.sender}
                      </p>
                      <p className="text-sm text-gray-500">{message.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{message.time}</span>
                </div>
              </Link>)}
            <div className="mt-4">
              <Link to="/chat/1" className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <MessageCircleIcon className="h-4 w-4 mr-2" />
                Open Chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Dashboard;