import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SendIcon, ListTodoIcon, UsersIcon, GiftIcon, MessageSquareIcon } from 'lucide-react';
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
  isEscalation?: boolean;
}
const HostInterface: React.FC = () => {
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
  const [showCoHostChat, setShowCoHostChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const event = {
    id: '1',
    title: 'Thanksgiving Potluck',
    hasCoHosts: true
  };
  useEffect(() => {
    setMessages([{
      id: '1',
      content: "Hi Amane! I'm here to help you manage your Thanksgiving Potluck. You can ask me to update the to-do list, manage guests, or handle the registry.",
      sender: {
        id: 'ai',
        name: 'Yorru AI',
        isAI: true
      },
      timestamp: new Date(2023, 10, 20, 9, 0, 0)
    }, {
      id: '2',
      content: "Tanya asked: 'Can I bring my roommate?' - I don't have this information. Would you like to respond?",
      sender: {
        id: 'ai',
        name: 'Yorru AI',
        isAI: true
      },
      timestamp: new Date(2023, 10, 20, 9, 16, 0),
      isEscalation: true
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
        id: user?.id || 'host',
        name: user?.name || 'Host'
      },
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Got it! I'll take care of that for you.",
        sender: {
          id: 'ai',
          name: 'Yorru AI',
          isAI: true
        },
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
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
      <div className="bg-white/95 backdrop-blur-sm shadow rounded-lg flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-gray-200 p-4 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-4">Event Management</h3>
          <div className="space-y-2 flex-1">
            <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <ListTodoIcon className="h-5 w-5 mr-3 text-indigo-600" />
              To-Do List
            </button>
            <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <UsersIcon className="h-5 w-5 mr-3 text-indigo-600" />
              Guest List
            </button>
            <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <GiftIcon className="h-5 w-5 mr-3 text-indigo-600" />
              Registry
            </button>
          </div>
          {event.hasCoHosts && <button onClick={() => setShowCoHostChat(!showCoHostChat)} className="w-full flex items-center px-4 py-3 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors mt-4">
              <MessageSquareIcon className="h-5 w-5 mr-3" />
              Co-Host Chat
            </button>}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
              Host Assistant
            </h2>
            <p className="text-sm text-gray-600">
              Chat with AI to manage your event
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="space-y-4">
              {messages.map(msg => <div key={msg.id} className="flex flex-col">
                  <div className={`flex items-start gap-3 ${msg.sender.id === (user?.id || 'host') ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender.id !== (user?.id || 'host') && <div className={`flex-shrink-0 w-8 h-8 rounded-full ${msg.sender.isAI ? 'bg-indigo-600' : 'bg-gray-700'} flex items-center justify-center text-white font-semibold text-sm`}>
                        {msg.sender.isAI ? 'Y' : getInitials(msg.sender.name)}
                      </div>}
                    <div className={`max-w-lg px-4 py-3 rounded-lg ${msg.isEscalation ? 'bg-amber-100 border-2 border-amber-400 text-gray-900' : msg.sender.isAI ? 'bg-indigo-100 text-gray-900' : 'bg-indigo-600 text-white'}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    {msg.sender.id === (user?.id || 'host') && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-xs">
                        {getInitials(user?.name || 'Host')}
                      </div>}
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${msg.sender.id === (user?.id || 'host') ? 'text-right mr-11' : 'text-left ml-11'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>)}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask AI to help manage your event..." className="flex-1 py-3 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
              <button type="submit" className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <SendIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>;
};
export default HostInterface;