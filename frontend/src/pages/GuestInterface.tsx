import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SendIcon, UsersIcon, GiftIcon, MapPinIcon, CalendarIcon } from 'lucide-react';
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
  isEscalated?: boolean;
}
const GuestInterface: React.FC = () => {
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
    title: 'Thanksgiving Potluck'
  };
  const suggestions = [{
    icon: CalendarIcon,
    label: 'Event Details',
    query: 'When is the event?'
  }, {
    icon: MapPinIcon,
    label: 'Location',
    query: 'Where is the event?'
  }, {
    icon: UsersIcon,
    label: 'Guest List',
    query: 'Show me the guest list'
  }, {
    icon: GiftIcon,
    label: 'Registry',
    query: 'Is there a registry?'
  }];
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  useEffect(() => {
    setMessages([{
      id: '1',
      content: "Hi! I'm Yorru, your AI assistant for this event. I can answer questions about the event details, location, guest list, and more. How can I help you?",
      sender: {
        id: 'ai',
        name: 'Yorru AI',
        isAI: true
      },
      timestamp: new Date(2023, 10, 20, 9, 0, 0)
    }]);
  }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  const handleSendMessage = (e: React.FormEvent, customMessage?: string) => {
    e.preventDefault();
    const messageToSend = customMessage || message;
    if (messageToSend.trim() === '') return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      sender: {
        id: user?.id || 'guest',
        name: user?.name || 'You'
      },
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setTimeout(() => {
      let aiResponse = '';
      const lowerMessage = messageToSend.toLowerCase();
      if (lowerMessage.includes('when') || lowerMessage.includes('time')) {
        aiResponse = 'The Thanksgiving Potluck is on November 24, 2023 at 4:00 PM.';
      } else if (lowerMessage.includes('where') || lowerMessage.includes('location')) {
        aiResponse = 'The event is at 456 West 28th St, Apt 201, LA. Guest parking code is 2811.';
      } else if (lowerMessage.includes('guest list')) {
        aiResponse = 'The guest list includes: Amane (Host), Mahiru (Co-host), Jake, Nirali, Maya, and Tanya.';
      } else if (lowerMessage.includes('registry')) {
        aiResponse = 'This is a potluck event. Please coordinate what you will bring in the group chat!';
      } else {
        aiResponse = "I'm not sure about that. Would you like me to ask the host for you?";
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          sender: {
            id: 'ai',
            name: 'Yorru AI',
            isAI: true
          },
          timestamp: new Date(),
          isEscalated: true
        }]);
        return;
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: {
          id: 'ai',
          name: 'Yorru AI',
          isAI: true
        },
        timestamp: new Date()
      }]);
    }, 1000);
  };
  const handleSuggestionClick = (query: string) => {
    const fakeEvent = {
      preventDefault: () => {}
    } as React.FormEvent;
    handleSendMessage(fakeEvent, query);
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className="container mx-auto h-full flex flex-col">
      <div className="bg-white/95 backdrop-blur-sm shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            Guest Assistant
          </h2>
          <p className="text-sm text-gray-600">
            Ask me anything about {event.title}
          </p>
        </div>
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {suggestions.map((suggestion, index) => <button key={index} onClick={() => handleSuggestionClick(suggestion.query)} className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors">
                <suggestion.icon className="h-5 w-5 text-indigo-600 mb-1" />
                <span className="text-xs text-gray-700 text-center">
                  {suggestion.label}
                </span>
              </button>)}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-4">
            {messages.map(msg => <div key={msg.id} className="flex flex-col">
                <div className={`flex items-start gap-3 ${msg.sender.id === (user?.id || 'guest') ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender.id !== (user?.id || 'guest') && <div className={`flex-shrink-0 w-8 h-8 rounded-full ${msg.sender.isAI ? 'bg-indigo-600' : 'bg-gray-700'} flex items-center justify-center text-white font-semibold text-sm`}>
                      {msg.sender.isAI ? 'Y' : getInitials(msg.sender.name)}
                    </div>}
                  <div className={`max-w-lg px-4 py-3 rounded-lg ${msg.isEscalated ? 'bg-amber-100 border-2 border-amber-400 text-gray-900' : msg.sender.isAI ? 'bg-indigo-100 text-gray-900' : 'bg-indigo-600 text-white'}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.sender.id === (user?.id || 'guest') && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-xs">
                      {getInitials(user?.name || 'You')}
                    </div>}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${msg.sender.id === (user?.id || 'guest') ? 'text-right mr-11' : 'text-left ml-11'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>)}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={e => handleSendMessage(e)} className="flex items-center space-x-2">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask a question about the event..." className="flex-1 py-3 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
            <button type="submit" className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>;
};
export default GuestInterface;