import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SendIcon, InfoIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    isAI?: boolean;
  };
  timestamp: Date;
  isAnnouncement?: boolean;
}
const GroupChat: React.FC = () => {
  const {
    id: eventId
  } = useParams<{
    id: string;
  }>();
  const {
    user
  } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const event = {
    id: '1',
    title: 'Thanksgiving Potluck',
    date: 'Nov 24, 2023'
  };
  useEffect(() => {
    setMessages([{
      id: '1',
      content: '📢 Welcome to the Thanksgiving Potluck group chat! The event is on Nov 24, 2023 at 4:00 PM.',
      sender: {
        id: 'ai',
        name: 'Yorru AI',
        isAI: true
      },
      timestamp: new Date(2023, 10, 20, 9, 0, 0),
      isAnnouncement: true
    }, {
      id: '2',
      content: "Hi everyone! I'm excited for the potluck. I can bring vegetarian lasagna!",
      sender: {
        id: 'user2',
        name: 'Jake'
      },
      timestamp: new Date(2023, 10, 20, 9, 5, 0)
    }, {
      id: '3',
      content: "Sounds great Jake! I'll bring dessert.",
      sender: {
        id: 'user3',
        name: 'Maya'
      },
      timestamp: new Date(2023, 10, 20, 9, 10, 0)
    }, {
      id: '4',
      content: '📢 Reminder: Guest parking code is 2811',
      sender: {
        id: 'ai',
        name: 'Yorru AI',
        isAI: true
      },
      timestamp: new Date(2023, 10, 20, 10, 0, 0),
      isAnnouncement: true
    }]);
  }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: {
        id: user?.id || 'current-user',
        name: user?.name || 'You'
      },
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  return <div className="container mx-auto h-full flex flex-col">
      <div className="bg-white/95 backdrop-blur-sm shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {event.title}
            </h2>
            <p className="text-sm text-gray-600">Group Chat • {event.date}</p>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <InfoIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-4">
            {messages.map(msg => <div key={msg.id} className="flex flex-col">
                {msg.isAnnouncement ? <div className="flex justify-center">
                    <div className="max-w-md px-4 py-2 rounded-lg bg-blue-100 border border-blue-300 text-blue-900 text-sm text-center">
                      {msg.content}
                    </div>
                  </div> : <>
                    <div className={`flex items-start gap-3 ${msg.sender.id === (user?.id || 'current-user') ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender.id !== (user?.id || 'current-user') && <div className={`flex-shrink-0 w-8 h-8 rounded-full ${msg.sender.isAI ? 'bg-indigo-600' : 'bg-gray-700'} flex items-center justify-center text-white font-semibold text-sm`}>
                          {msg.sender.isAI ? 'Y' : getInitials(msg.sender.name)}
                        </div>}
                      <div className={`max-w-lg px-4 py-3 rounded-lg ${msg.sender.id === (user?.id || 'current-user') ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      {msg.sender.id === (user?.id || 'current-user') && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-xs">
                          {getInitials(user?.name || 'You')}
                        </div>}
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${msg.sender.id === (user?.id || 'current-user') ? 'text-right mr-11' : 'text-left ml-11'}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </>}
              </div>)}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Send a message to the group..." className="flex-1 py-3 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
            <button type="submit" className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>;
};
export default GroupChat;