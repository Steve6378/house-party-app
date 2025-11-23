import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SendIcon, InfoIcon, PaperclipIcon, SmileIcon } from 'lucide-react';
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
}
const Chat: React.FC = () => {
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
  // Mock event data
  const event = {
    id: '1',
    title: 'Thanksgiving Potluck',
    date: 'Nov 24, 2023'
  };
  // Mock initial messages
  useEffect(() => {
    // Simulate loading messages from an API
    setTimeout(() => {
      setMessages([{
        id: '1',
        content: "Welcome to the Thanksgiving Potluck chat! I'm Yorru, your AI assistant. You can ask me questions about the event, and I'll do my best to help.",
        sender: {
          id: 'ai',
          name: 'Yorru AI',
          isAI: true
        },
        timestamp: new Date(2023, 10, 20, 9, 0, 0)
      }, {
        id: '2',
        content: "Hi everyone! I'm excited for the potluck. I can bring vegetarian lasagna! Just a reminder I'm vegetarian btw",
        sender: {
          id: 'user2',
          name: 'Jake'
        },
        timestamp: new Date(2023, 10, 20, 9, 5, 0)
      }, {
        id: '3',
        content: "What's the budget? I'm tight on cash",
        sender: {
          id: 'user3',
          name: 'Maya'
        },
        timestamp: new Date(2023, 10, 20, 9, 10, 0)
      }, {
        id: '4',
        content: 'The budget is $25 per person for this event.',
        sender: {
          id: 'ai',
          name: 'Yorru AI',
          isAI: true
        },
        timestamp: new Date(2023, 10, 20, 9, 11, 0)
      }, {
        id: '5',
        content: 'Can I bring my roommate?',
        sender: {
          id: 'user4',
          name: 'Tanya'
        },
        timestamp: new Date(2023, 10, 20, 9, 15, 0)
      }, {
        id: '6',
        content: "I don't have that information. I've escalated this question to the host, and they'll respond when they can.",
        sender: {
          id: 'ai',
          name: 'Yorru AI',
          isAI: true
        },
        timestamp: new Date(2023, 10, 20, 9, 16, 0)
      }, {
        id: '7',
        content: 'Sure Tanya, your roommate is welcome to join! Please let me know their dietary restrictions if any.',
        sender: {
          id: 'user1',
          name: 'Amane'
        },
        timestamp: new Date(2023, 10, 20, 9, 30, 0)
      }]);
    }, 1000);
  }, []);
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;
    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: {
        id: user?.id || 'current-user',
        name: user?.name || 'You'
      },
      timestamp: new Date()
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setMessage('');
    // Simulate AI response
    setTimeout(() => {
      let aiResponse = '';
      // Simple keyword matching for demo
      if (message.toLowerCase().includes('address') || message.toLowerCase().includes('where')) {
        aiResponse = 'The event is at 456 West 28th St, Apt 201, LA.';
      } else if (message.toLowerCase().includes('time') || message.toLowerCase().includes('when')) {
        aiResponse = 'The Thanksgiving Potluck starts at 4:00 PM on November 24, 2023.';
      } else if (message.toLowerCase().includes('park') || message.toLowerCase().includes('parking')) {
        aiResponse = 'You can use guest parking with code 2811.';
      } else if (message.toLowerCase().includes('bring') || message.toLowerCase().includes('food')) {
        aiResponse = 'This is a potluck event. Amane is cooking the turkey. Please let everyone know what you plan to bring!';
      } else {
        aiResponse = "I'm not sure about that. Would you like me to ask the host?";
      }
      const newAiMessage: Message = {
        id: Date.now().toString(),
        content: aiResponse,
        sender: {
          id: 'ai',
          name: 'Yorru AI',
          isAI: true
        },
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, newAiMessage]);
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
      <div className="bg-white shadow rounded-lg flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {event.title} - Chat
            </h2>
            <p className="text-sm text-gray-500">{event.date}</p>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <InfoIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map(msg => <div key={msg.id} className="flex flex-col">
                <div className={`flex items-start gap-3 ${msg.sender.id === (user?.id || 'current-user') ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender.id !== (user?.id || 'current-user') && <div className={`flex-shrink-0 w-8 h-8 rounded-full ${msg.sender.isAI ? 'bg-indigo-600' : 'bg-gray-700'} flex items-center justify-center text-white font-semibold text-sm`}>
                      {msg.sender.isAI ? 'Y' : getInitials(msg.sender.name)}
                    </div>}
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.sender.isAI ? 'bg-indigo-100 text-gray-800' : msg.sender.id === (user?.id || 'current-user') ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    {msg.sender.id !== (user?.id || 'current-user') && <div className="font-medium text-xs mb-1">
                        {msg.sender.name}
                      </div>}
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.sender.id === (user?.id || 'current-user') && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-xs">
                      {getInitials(user?.name || 'You')}
                    </div>}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${msg.sender.id === (user?.id || 'current-user') ? 'text-right mr-11' : 'text-left ml-11'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>)}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <button type="button" className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <PaperclipIcon className="h-5 w-5" />
            </button>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask a question or send a message..." className="flex-1 py-2 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <button type="button" className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <SmileIcon className="h-5 w-5" />
            </button>
            <button type="submit" className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
          <div className="mt-2 text-xs text-gray-500 text-center">
            You can ask the AI about event details like address, time, parking,
            etc.
          </div>
        </div>
      </div>
    </div>;
};
export default Chat;