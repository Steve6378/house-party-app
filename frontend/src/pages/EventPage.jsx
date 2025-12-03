import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Send,
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckSquare,
  Square,
  UserPlus,
  MessageCircle,
  Bot,
  Download,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI, messagesAPI, groundTruthAPI, aiAPI } from '../utils/api.ts';
import { shareEvent, isNative } from '../utils/native';

function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [hostRequest, setHostRequest] = useState('');
  const [hostAiType, setHostAiType] = useState('general');
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [groundTruthFacts, setGroundTruthFacts] = useState([]);
  const [newGroundTruth, setNewGroundTruth] = useState({ category: '', content: '', keywords: '' });
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const isHost = event?.main_host_id === user?.id;
  const hasHostAccess = isHost; // Can extend for co-hosts later

  useEffect(() => {
    fetchEvent();
    fetchMessages();
    fetchGroundTruth();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const fetchMessages = async () => {
    try {
      const data = await messagesAPI.list(id, { limit: 100 });
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchGroundTruth = async () => {
    try {
      const data = await groundTruthAPI.list(id);
      setGroundTruthFacts(data.facts || []);
    } catch (error) {
      console.error('Failed to fetch ground truth:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      await messagesAPI.send(id, {
        content: chatMessage,
        message_type: 'user'
      });

      setChatMessage('');
      fetchMessages();
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleGuestAiQuery = async () => {
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    try {
      const response = await aiAPI.guestQuery(id, aiQuestion);
      setAiResponse(response.answer || response.response || 'No response received');
      setAiQuestion('');
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setAiLoading(false);
    }
  };

  const handleHostAiRequest = async () => {
    if (!hostRequest.trim()) return;

    setAiLoading(true);
    try {
      const response = await aiAPI.hostAssist(id, hostAiType, { request: hostRequest });
      setAiResponse(response.response || response.answer || 'No response received');
      setHostRequest('');
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddGroundTruth = async () => {
    if (!newGroundTruth.content.trim() || !newGroundTruth.category.trim()) {
      toast.error('Please fill in category and content');
      return;
    }

    try {
      const keywords = newGroundTruth.keywords.split(',').map(k => k.trim()).filter(k => k);
      await groundTruthAPI.create(id, {
        category: newGroundTruth.category,
        content: newGroundTruth.content,
        keywords: keywords.length > 0 ? keywords : undefined
      });

      setNewGroundTruth({ category: '', content: '', keywords: '' });
      fetchGroundTruth();
      toast.success('Ground truth added!');
    } catch (error) {
      toast.error('Failed to add ground truth');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('uploadedBy', user.id);
    formData.append('uploaderName', user.name);

    try {
      await axios.post(`http://localhost:3000/api/events/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Photo uploaded!');
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('uploadedBy', user.id);
    formData.append('uploaderName', user.name);

    try {
      await axios.post(`http://localhost:3000/api/events/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Document uploaded!');
      fetchEvent();
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleAddTodo = async (text = newTodo) => {
    if (!text.trim()) return;

    try {
      await axios.post(`http://localhost:3000/api/events/${id}/todos`, {
        text,
        createdBy: user.id
      });

      setNewTodo('');
      fetchEvent();
      toast.success('Todo added!');
    } catch (error) {
      toast.error('Failed to add todo');
    }
  };

  const handleToggleTodo = async (todoId, completed) => {
    try {
      await axios.patch(`http://localhost:3000/api/events/${id}/todos/${todoId}`, {
        completed: !completed
      });

      fetchEvent();
    } catch (error) {
      toast.error('Failed to update todo');
    }
  };

  const handleAddCoHost = async () => {
    const email = prompt('Enter email of co-host:');
    if (!email) return;

    try {
      await axios.post(`http://localhost:3000/api/events/${id}/cohost`, {
        userId: 'temp-id',
        userEmail: email,
        userName: email
      });

      toast.success('Co-host added!');
      fetchEvent();
    } catch (error) {
      toast.error('Failed to add co-host');
    }
  };

  const handleShare = async () => {
    if (event) {
      const shared = await shareEvent({ name: event.name, id: event.id });
      if (shared) {
        toast.success('Event shared!');
      } else if (!isNative) {
        // Fallback for web: copy link
        const url = `${window.location.origin}/event/${event.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Event link copied to clipboard!');
      }
    }
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
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-300 hover:text-white transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">{event.name}</h1>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent-400" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent-400" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent-400" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-400" />
                  <span>{event.attendees?.length || 0} attendees</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {isHost && (
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-semibold">
                  Host
                </span>
              )}
              {isCoHost && (
                <span className="bg-gradient-to-r from-accent-600 to-primary-600 text-white px-4 py-2 rounded-lg font-semibold">
                  Co-Host
                </span>
              )}
              <button
                onClick={handleShare}
                className="p-2 bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white rounded-lg transition"
                title="Share Event"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {event.description && (
            <p className="text-gray-300 mb-6">{event.description}</p>
          )}

          <div className="flex gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                  : 'bg-dark-700/50 text-gray-300 hover:text-white'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              Group Chat
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                  : 'bg-dark-700/50 text-gray-300 hover:text-white'
              }`}
            >
              <Bot className="w-5 h-5" />
              AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'photos'
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                  : 'bg-dark-700/50 text-gray-300 hover:text-white'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              Photos ({photos.length})
            </button>
            {hasHostAccess && (
              <>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'documents'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                      : 'bg-dark-700/50 text-gray-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  Documents ({documents.length})
                </button>
                <button
                  onClick={() => setActiveTab('todos')}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'todos'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                      : 'bg-dark-700/50 text-gray-300 hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-5 h-5" />
                  To-Do List ({todos.filter(t => !t.completed).length})
                </button>
              </>
            )}
          </div>
        </div>

        {activeTab === 'chat' && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-accent-400" />
              Group Chat
            </h2>

            <div className="h-[500px] overflow-y-auto mb-4 space-y-4">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex ${chat.userId === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-xl ${
                      chat.userId === user.id
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                        : 'bg-dark-700/50 text-gray-200 border border-primary-500/20'
                    }`}
                  >
                    <div className="text-xs mb-1 opacity-75">{chat.userName}</div>
                    <p>{chat.message}</p>
                    <div className="text-xs mt-1 opacity-75">
                      {new Date(chat.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              <button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent-400" />
              {hasHostAccess ? 'Host AI Assistant' : 'Guest AI Assistant'}
            </h2>

            {hasHostAccess ? (
              <div className="space-y-6">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setHostAiType('general')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      hostAiType === 'general'
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700/50 text-gray-300'
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setHostAiType('todo')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      hostAiType === 'todo'
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700/50 text-gray-300'
                    }`}
                  >
                    To-Do List
                  </button>
                  <button
                    onClick={() => setHostAiType('invitation')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      hostAiType === 'invitation'
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700/50 text-gray-300'
                    }`}
                  >
                    Invitation
                  </button>
                  <button
                    onClick={() => setHostAiType('update')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      hostAiType === 'update'
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-700/50 text-gray-300'
                    }`}
                  >
                    Updates
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hostRequest}
                    onChange={(e) => setHostRequest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleHostAiRequest()}
                    placeholder={`Ask AI for ${hostAiType} help...`}
                    className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                  <button
                    onClick={handleHostAiRequest}
                    disabled={aiLoading}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {aiResponse && (
                  <div className="bg-dark-700/50 border border-primary-500/20 p-6 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-accent-400" />
                      <span className="font-semibold text-accent-400">AI Response</span>
                    </div>
                    <p className="text-gray-200 whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={handleAddCoHost}
                    className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add Co-Host
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGuestAiQuery()}
                    placeholder="Ask about the event (when, where, weather, etc.)..."
                    className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                  <button
                    onClick={handleGuestAiQuery}
                    disabled={aiLoading}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {aiResponse && (
                  <div className="bg-dark-700/50 border border-primary-500/20 p-6 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-accent-400" />
                      <span className="font-semibold text-accent-400">AI Response</span>
                    </div>
                    <p className="text-gray-200 whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-accent-400" />
                Event Photos
              </h2>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Photo
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="bg-dark-700/50 border border-primary-500/20 rounded-xl overflow-hidden"
                  >
                    <div className="aspect-square bg-dark-700 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-500" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-300 truncate">{photo.filename}</p>
                      <p className="text-xs text-gray-500">By {photo.uploaderName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No photos yet. Upload the first one!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && hasHostAccess && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-accent-400" />
                Event Documents
              </h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Document
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleDocumentUpload}
                className="hidden"
              />
            </div>

            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-dark-700/50 border border-primary-500/20 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary-400" />
                      <div>
                        <p className="text-white font-semibold">{doc.filename}</p>
                        <p className="text-sm text-gray-400">
                          Uploaded by {doc.uploaderName} on {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button className="text-accent-400 hover:text-accent-300">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No documents yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'todos' && hasHostAccess && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-accent-400" />
              To-Do List
            </h2>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              <button
                onClick={() => handleAddTodo()}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition"
              >
                Add
              </button>
            </div>

            {todos.length > 0 ? (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="bg-dark-700/50 border border-primary-500/20 rounded-xl p-4 flex items-center gap-3"
                  >
                    <button
                      onClick={() => handleToggleTodo(todo.id, todo.completed)}
                      className="flex-shrink-0"
                    >
                      {todo.completed ? (
                        <CheckSquare className="w-6 h-6 text-accent-400" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    <span
                      className={`flex-1 ${
                        todo.completed ? 'text-gray-500 line-through' : 'text-white'
                      }`}
                    >
                      {todo.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No tasks yet. Add one to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventPage;
