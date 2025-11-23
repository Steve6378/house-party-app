import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserIcon, Users2Icon, MessageCircleIcon, ArrowLeftIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
const ChatOptions: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  // Mock: In a real app, you'd check if the user is the host of this event
  const isHost = user?.name === 'Amane' || user?.id === '1';
  const event = {
    id: '1',
    title: 'Thanksgiving Potluck',
    date: 'Nov 24, 2023'
  };
  return <div className="container mx-auto max-w-2xl">
      <button onClick={() => navigate('/chat')} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Events
      </button>
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {event.title}
          </h1>
          <p className="text-gray-600">{event.date}</p>
        </div>
        <div className="space-y-4">
          <Link to={`/group/${id}`} className="block p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users2Icon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Group Chat
                </h3>
                <p className="text-sm text-gray-600">
                  Chat with all event attendees
                </p>
              </div>
              <ArrowLeftIcon className="h-5 w-5 text-gray-400 transform rotate-180" />
            </div>
          </Link>
          {isHost ? <Link to={`/host/${id}`} className="block p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Host Mode
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage your event with AI assistance
                  </p>
                </div>
                <ArrowLeftIcon className="h-5 w-5 text-gray-400 transform rotate-180" />
              </div>
            </Link> : <Link to={`/guest/${id}`} className="block p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Guest Chat
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ask questions about the event
                  </p>
                </div>
                <ArrowLeftIcon className="h-5 w-5 text-gray-400 transform rotate-180" />
              </div>
            </Link>}
        </div>
      </div>
    </div>;
};
export default ChatOptions;