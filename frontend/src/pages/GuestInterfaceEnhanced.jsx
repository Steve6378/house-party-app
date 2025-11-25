import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Send,
  Calendar,
  MapPin,
  Clock,
  Users,
  MessageSquare,
  Bot,
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI, aiAPI } from '../utils/api.ts';

function GuestInterfaceEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiQuestion, setAiQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const quickQuestions = [
    { icon: Calendar, label: 'When is it?', query: 'When is the event?' },
    { icon: MapPin, label: 'Where is it?', query: 'Where is the event located?' },
    { icon: Users, label: 'Who\'s coming?', query: 'Who is attending?' },
    { icon: Info, label: 'What to bring?', query: 'What should I bring?' },
  ];

  useEffect(() => {
    fetchEvent();
    initializeConversation();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const fetchEvent = async () => {
    try {
      const data = await eventsAPI.get(id);
      setEvent(data);
    } catch (error) {
      toast.error('Failed to load event');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const initializeConversation = () => {
    setConversation([
      {
        role: 'assistant',
        content: "Hi! I'm your AI assistant for this event. I can answer questions about the event details, location, what to bring, and more. How can I help you?",
        timestamp: new Date()
      }
    ]);
  };

  const handleAskQuestion = async (question = aiQuestion) => {
    if (!question.trim()) return;

    const userMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      const response = await aiAPI.guestQuery(id, question);
      const aiMessage = {
        role: 'assistant',
        content: response.answer || response.response || 'Sorry, I couldn\'t find an answer to that question.',
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble answering that right now. You can ask the host directly in the group chat!',
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuickQuestion = (query) => {
    setAiQuestion(query);
    handleAskQuestion(query);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-400 mx-auto"></div>
          <p className="mt-4 text-primary-200">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900">
      <nav className="bg-dark-800/50 backdrop-blur-xl border-b border-primary-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-300 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate(`/event/${id}/chat`)}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Group Chat
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-white mb-6">{event.name}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600/20 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p className="font-semibold text-white">{event.date || 'TBD'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary-600/20 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Time</p>
                <p className="font-semibold text-white">{event.time || 'TBD'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary-600/20 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-semibold text-white">{event.address || 'TBD'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary-600/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Expected Guests</p>
                <p className="font-semibold text-white">{event.expected_guests || 'Open invite'}</p>
              </div>
            </div>
          </div>

          {event.description && (
            <div className="mt-6 pt-6 border-t border-primary-500/20">
              <p className="text-gray-300">{event.description}</p>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Quick Questions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(q.query)}
                className="flex flex-col items-center p-4 bg-dark-700/50 border border-primary-500/20 rounded-lg hover:bg-dark-700 hover:border-primary-500/40 transition"
              >
                <q.icon className="w-6 h-6 text-accent-400 mb-2" />
                <span className="text-sm text-gray-300 text-center">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Chat Interface */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-primary-500/20 bg-dark-800/80">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-accent-400" />
              AI Assistant
            </h2>
            <p className="text-sm text-gray-400 mt-1">Ask me anything about the event</p>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 bg-dark-900/20">
            <div className="space-y-4">
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                        : 'bg-dark-700/50 border border-primary-500/20 text-gray-200'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-accent-400" />
                        <span className="text-xs font-semibold text-accent-400">AI Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-dark-700/50 border border-primary-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-400"></div>
                      <span className="text-gray-300 text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-primary-500/20 bg-dark-800/80">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="Ask a question about the event..."
                className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              <button
                onClick={() => handleAskQuestion()}
                disabled={aiLoading || !aiQuestion.trim()}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {aiLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestInterfaceEnhanced;
