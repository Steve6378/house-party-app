import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SendIcon, CheckCircleIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { toast } from 'sonner';
interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    isAI?: boolean;
  };
  timestamp: Date;
}
const CreateEvent: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    addEvent
  } = useEvents();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    location: '',
    attendees: 0,
    budget: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages([{
      id: '1',
      content: "Hi! I'm excited to help you create your event. Let's start with the basics. What's the name of your event?",
      sender: {
        id: 'ai',
        name: 'Yorru AI',
        isAI: true
      },
      timestamp: new Date()
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
      id: crypto.randomUUID(),
      content: message,
      sender: {
        id: user?.id || 'host',
        name: user?.name || 'You'
      },
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    // Store event data based on conversation step
    const currentStep = messages.filter(m => m.sender.id === (user?.id || 'host')).length;
    if (currentStep === 0) setEventData(prev => ({
      ...prev,
      title: message
    }));else if (currentStep === 1) setEventData(prev => ({
      ...prev,
      date: message
    }));else if (currentStep === 2) setEventData(prev => ({
      ...prev,
      location: message
    }));else if (currentStep === 3) setEventData(prev => ({
      ...prev,
      attendees: parseInt(message) || 0
    }));else if (currentStep === 4) setEventData(prev => ({
      ...prev,
      budget: message
    }));
    setMessage('');
    setTimeout(() => {
      const aiResponses = ['Great! When would you like to have this event?', 'Perfect! Where will the event take place?', 'Excellent! How many people are you expecting?', "Got it! What's the budget per person?", 'Wonderful! Is there anything specific about dietary restrictions or preferences I should know?', 'Perfect! I think I have all the key information. Would you like to add any additional details, or shall we create your event?'];
      const responseIndex = Math.min(messages.length, aiResponses.length - 1);
      const aiContent = aiResponses[responseIndex];
      if (responseIndex === aiResponses.length - 1) {
        setIsComplete(true);
      }
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        content: aiContent,
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
  const handleCreateEvent = () => {
    const newEvent = {
      id: crypto.randomUUID(),
      title: eventData.title,
      date: eventData.date,
      time: '4:00 PM',
      location: eventData.location,
      attendees: eventData.attendees,
      description: additionalInfo || `Join us for ${eventData.title}!`,
      status: 'upcoming' as const
    };
    addEvent(newEvent);
    toast.success('Event created successfully!');
    navigate('/events');
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
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            Create New Event
          </h2>
          <p className="text-sm text-gray-600">
            Chat with AI to set up your event details
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-4">
            {messages.map(msg => <div key={msg.id} className="flex flex-col">
                <div className={`flex items-start gap-3 ${msg.sender.id === (user?.id || 'host') ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender.id !== (user?.id || 'host') && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                      Y
                    </div>}
                  <div className={`max-w-lg px-4 py-3 rounded-lg ${msg.sender.isAI ? 'bg-indigo-100 text-gray-900' : 'bg-indigo-600 text-white'}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.sender.id === (user?.id || 'host') && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-xs">
                      {getInitials(user?.name || 'You')}
                    </div>}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${msg.sender.id === (user?.id || 'host') ? 'text-right mr-11' : 'text-left ml-11'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>)}
            <div ref={messagesEndRef} />
          </div>
          {isComplete && <div className="mt-6 p-6 bg-white border-2 border-indigo-200 rounded-lg">
              <div className="flex items-center mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Almost Done!
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Would you like to add any additional information?
              </p>
              <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="Add any extra details, special instructions, or notes..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 resize-none" rows={4} />
              <div className="flex justify-end space-x-3 mt-4">
                <button onClick={() => navigate('/events')} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleCreateEvent} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                  Create Event
                </button>
              </div>
            </div>}
        </div>
        {!isComplete && <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your response..." className="flex-1 py-3 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
              <button type="submit" className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <SendIcon className="h-5 w-5" />
              </button>
            </form>
          </div>}
      </div>
    </div>;
};
export default CreateEvent;