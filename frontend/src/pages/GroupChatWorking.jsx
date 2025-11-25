import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { messagesAPI, eventsAPI } from '../utils/api.ts';
import { toast } from 'sonner';

function GroupChatWorking() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchEvent = async () => {
    try {
      const data = await eventsAPI.get(eventId);
      setEvent(data);
    } catch (error) {
      console.error('Failed to fetch event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await messagesAPI.list(eventId, { limit: 100 });
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    const messageContent = message;
    setMessage(''); // Clear input immediately for better UX

    try {
      await messagesAPI.send(eventId, {
        content: messageContent,
        message_type: 'user'
      });

      // Immediately fetch new messages to show the sent message
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setMessage(messageContent); // Restore message if send failed
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-400 mx-auto"></div>
          <p className="mt-4 text-primary-200">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900">
      {/* Header */}
      <nav className="bg-dark-800/50 backdrop-blur-xl border-b border-primary-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">
              {event?.name || 'Event Chat'}
            </h2>
            <p className="text-sm text-gray-400">Group Chat</p>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </nav>

      {/* Chat Container */}
      <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-120px)] flex flex-col">
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-dark-900/20">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.sender_id === user?.id;
                  const isAnnouncement = msg.message_type === 'announcement';

                  if (isAnnouncement) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="max-w-md px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-200 text-sm text-center">
                          📢 {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex flex-col">
                      <div
                        className={`flex items-start gap-3 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-semibold text-xs">
                            {getInitials(msg.sender_name || 'User')}
                          </div>
                        )}
                        <div
                          className={`max-w-lg px-4 py-3 rounded-xl ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                              : 'bg-dark-700/50 border border-primary-500/20 text-gray-200'
                          }`}
                        >
                          {!isOwnMessage && (
                            <div className="text-xs mb-1 font-semibold text-primary-300">
                              {msg.sender_name || 'Unknown'}
                            </div>
                          )}
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        {isOwnMessage && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-600 to-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                            {getInitials(user?.name || 'You')}
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-xs text-gray-500 mt-1 ${
                          isOwnMessage ? 'text-right mr-11' : 'text-left ml-11'
                        }`}
                      >
                        {formatTime(msg.created_at || msg.timestamp)}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-primary-500/20 bg-dark-800/80">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 py-3 px-4 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-3 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupChatWorking;
