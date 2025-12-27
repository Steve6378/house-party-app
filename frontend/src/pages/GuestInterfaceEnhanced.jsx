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
  Info,
  Hash,
  MessagesSquare,
  Image,
  X,
  ZoomIn,
  Upload,
  Camera,
  FileText,
  HelpCircle,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI, aiAPI, photosAPI, documentsAPI } from '../utils/api.ts';
import { API_URL } from '../config/api';

function GuestInterfaceEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiQuestion, setAiQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [lastUsedMode, setLastUsedMode] = useState(null); // Track last used mode for follow-up questions
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [faqs, setFaqs] = useState([]);

  const messagesEndRef = useRef(null);
  const photoInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // AI Mode options for guests (no #broadcast or #create)
  const aiModes = [
    { id: 'general', label: '#general', icon: Hash, description: 'General AI chat', color: 'from-gray-500 to-gray-600' },
    { id: 'event', label: '#event', icon: Calendar, description: 'Event-specific info', color: 'from-blue-500 to-blue-600' },
    { id: 'recommendation', label: '#recommendation', icon: MapPin, description: 'Find nearby places', color: 'from-green-500 to-green-600' },
    { id: 'groupchat', label: '#groupchat', icon: MessagesSquare, description: 'Search chat history', color: 'from-purple-500 to-purple-600' },
    { id: 'photos', label: '#photos', icon: Camera, description: 'Find photos of me', color: 'from-cyan-500 to-cyan-600' },
  ];

  const quickQuestions = [
    { icon: Calendar, label: 'When is it?', query: 'When is the event?' },
    { icon: MapPin, label: 'Where is it?', query: 'Where is the event located?' },
    { icon: Users, label: 'Who\'s coming?', query: 'Who is attending?' },
    { icon: Info, label: 'What to bring?', query: 'What should I bring?' },
  ];

  useEffect(() => {
    fetchEvent();
    fetchPhotos();
    fetchFaqs();
    initializeConversation();
  }, [id]);

  const fetchFaqs = async () => {
    try {
      const data = await aiAPI.getFAQs(id);
      setFaqs(data.faqs || []);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      const data = await photosAPI.list(id);
      setPhotos(data.photos || data || []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo must be less than 10MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      await photosAPI.upload(id, file);
      toast.success('Photo uploaded!');
      fetchPhotos();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('PDF must be less than 10MB');
        return;
      }
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedPdf(file);
    }
  };

  const clearSelectedPdf = () => {
    setSelectedPdf(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const handlePdfUpload = async () => {
    if (!selectedPdf) return;

    setUploadingPdf(true);
    try {
      await documentsAPI.upload(id, selectedPdf);
      toast.success('PDF uploaded! You can now ask questions about it.');
      clearSelectedPdf();
      // Add a message to the conversation
      setConversation(prev => [
        ...prev,
        {
          role: 'system',
          content: `Document uploaded: ${selectedPdf.name}. You can now ask questions about this document!`
        }
      ]);
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

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

    // Check if message has a hashtag (to determine if it's an explicit mode switch)
    const messageHasHashtag = question.trim().startsWith('#');

    // Check if this is a #photos request
    // Also check if lastUsedMode was photos and no new hashtag was specified (for follow-up questions)
    const isPhotosRequest = selectedMode === 'photos' ||
      question.toLowerCase().startsWith('#photos') ||
      (!messageHasHashtag && lastUsedMode === 'photos');

    if (isPhotosRequest) {
      // Handle face recognition photo search
      const userMessage = {
        role: 'user',
        content: question || 'Find photos of me',
        timestamp: new Date()
      };
      setConversation(prev => [...prev, userMessage]);
      setAiQuestion('');
      setAiLoading(true);

      try {
        const response = await aiAPI.findMyPhotos(id);

        let content = response.message;
        if (response.photos && response.photos.length > 0) {
          content += '\n\nHere are the photos I found:';
        }

        const aiMessage = {
          role: 'assistant',
          content: content,
          timestamp: new Date(),
          photos: response.photos || []  // Include matched photos in message
        };
        setConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('photos'); // Remember this mode for follow-up questions
      } catch (error) {
        console.error('Face search error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble searching for your photos. Make sure you have uploaded a profile photo with a clear face in Settings.',
          timestamp: new Date()
        };
        setConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    // Check if this is a #general request (ChatGPT-like general AI)
    // Also check if lastUsedMode was general and no new hashtag was specified (for follow-up questions)
    const isGeneralRequest = selectedMode === 'general' ||
      question.toLowerCase().startsWith('#general') ||
      (!messageHasHashtag && lastUsedMode === 'general');

    if (isGeneralRequest) {
      const userMessage = {
        role: 'user',
        content: question,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, userMessage]);

      // Extract the actual question (remove #general prefix)
      const cleanQuestion = question.replace(/^#general\s*/i, '').trim();
      setAiQuestion('');
      setAiLoading(true);

      try {
        const response = await aiAPI.generalQuery(cleanQuestion || 'Hello', undefined, id);
        const answerText = response.answer || 'I couldn\'t generate a response.';
        const aiMessage = {
          role: 'assistant',
          content: answerText,
          timestamp: new Date()
        };
        setConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('general'); // Remember this mode for follow-up questions

        // Record this question to FAQ (only if it's a real question)
        if (cleanQuestion && cleanQuestion.length > 5) {
          try {
            await aiAPI.recordFAQ(id, cleanQuestion, answerText);
            // Refresh FAQs in background
            fetchFaqs();
          } catch (faqError) {
            console.error('Failed to record FAQ:', faqError);
          }
        }
      } catch (error) {
        console.error('General query error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble processing that request. Please try again.',
          timestamp: new Date()
        };
        setConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    // Check if this is a #groupchat request (search chat history using RAG)
    // Also check if lastUsedMode was groupchat and no new hashtag was specified (for follow-up questions)
    const isGroupchatRequest = selectedMode === 'groupchat' ||
      question.toLowerCase().startsWith('#groupchat') ||
      (!messageHasHashtag && lastUsedMode === 'groupchat');

    if (isGroupchatRequest) {
      const userMessage = {
        role: 'user',
        content: question,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, userMessage]);

      // Extract the actual question (remove #groupchat prefix)
      const cleanQuestion = question.replace(/^#groupchat\s*/i, '').trim();
      setAiQuestion('');
      setAiLoading(true);

      try {
        // Use guestQuery which uses RAG to search chat history
        const response = await aiAPI.guestQuery(id, cleanQuestion || 'What has everyone been talking about?');
        const aiMessage = {
          role: 'assistant',
          content: response.answer || 'I couldn\'t find any relevant information in the chat.',
          timestamp: new Date()
        };
        setConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('groupchat'); // Remember this mode for follow-up questions
      } catch (error) {
        console.error('Groupchat query error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble searching the chat history. Please try again.',
          timestamp: new Date()
        };
        setConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    // Default: event-specific queries using guestQuery RAG
    const userMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    // Build conversation history for API (exclude system messages, limit to last 10)
    const historyForAPI = conversation
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map(msg => ({ role: msg.role, content: msg.content }));

    setConversation(prev => [...prev, userMessage]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      // Pass conversation history to maintain context
      const response = await aiAPI.guestQuery(id, question, historyForAPI);
      const aiMessage = {
        role: 'assistant',
        content: response.answer || response.response || 'Sorry, I couldn\'t find an answer to that question.',
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiMessage]);
      setLastUsedMode('event'); // Remember this mode for follow-up questions
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

        {/* Frequently Asked Questions - Auto-generated from guest queries */}
        {faqs && faqs.length > 0 && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-accent-400" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => {
                    // Add the question and answer to conversation
                    setConversation(prev => [
                      ...prev,
                      { role: 'user', content: faq.question },
                      { role: 'assistant', content: faq.answer }
                    ]);
                  }}
                  className="w-full text-left p-4 bg-dark-700/50 border border-primary-500/20 rounded-lg hover:bg-dark-700 hover:border-primary-500/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-gray-200 font-medium">{faq.question}</p>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{faq.answer}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      Asked {faq.frequency}x
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Event Photos Gallery */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Image className="w-5 h-5 text-accent-400" />
              Event Photos ({photos.length})
            </h3>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Add Photo
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
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-primary-500/20 cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url || `${API_URL}/api/events/photos/${photo.id}/file`}
                    alt={photo.caption || 'Event photo'}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Image className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No photos yet</p>
              <p className="text-gray-500 text-xs mt-1">Be the first to share a photo!</p>
            </div>
          )}
        </div>

        {/* Photo Lightbox Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedPhoto.url || `${API_URL}/api/events/photos/${selectedPhoto.id}/file`}
              alt={selectedPhoto.caption || 'Event photo'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedPhoto.caption && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-lg">
                <p className="text-white">{selectedPhoto.caption}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Mode Selection */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-accent-400" />
            Select AI Mode
          </h3>
          <div className="flex flex-wrap gap-2">
            {aiModes.map((mode) => {
              const IconComponent = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedMode(null);
                      setAiQuestion(aiQuestion.replace(new RegExp(`^#${mode.id}\\s*`, 'i'), ''));
                    } else {
                      setSelectedMode(mode.id);
                      const cleanedQuestion = aiQuestion.replace(/^#\w+\s*/i, '');
                      setAiQuestion(`#${mode.id} ${cleanedQuestion}`);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${mode.color} text-white shadow-lg scale-105`
                      : 'bg-dark-600/50 text-gray-300 hover:bg-dark-600 hover:text-white border border-dark-500'
                  }`}
                  title={mode.description}
                >
                  <IconComponent className="w-4 h-4" />
                  {mode.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {selectedMode ? (
              <span className="text-accent-400">
                {aiModes.find(m => m.id === selectedMode)?.description}
              </span>
            ) : (
              'Click a mode or type a hashtag to activate it'
            )}
          </p>
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
                    {/* Render photos from face search results */}
                    {msg.photos && msg.photos.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {msg.photos.map((photo, photoIndex) => (
                          <div
                            key={photoIndex}
                            className="relative cursor-pointer group"
                            onClick={() => {
                              // Open photo in modal or lightbox
                              const photoUrl = `${API_URL}${photo.file_path}`;
                              window.open(photoUrl, '_blank');
                            }}
                          >
                            <img
                              src={`${API_URL}${photo.file_path}`}
                              alt={photo.description || 'Event photo'}
                              className="w-full h-24 object-cover rounded-lg border border-primary-500/20 hover:border-accent-400 transition"
                            />
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                              {Math.round(photo.confidence * 100)}%
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
            {/* PDF Preview */}
            {selectedPdf && (
              <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg">
                <FileText className="w-5 h-5 text-primary-400" />
                <span className="text-sm text-gray-300 flex-1">{selectedPdf.name}</span>
                <button
                  type="button"
                  onClick={clearSelectedPdf}
                  className="p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handlePdfUpload}
                  disabled={uploadingPdf}
                  className="px-3 py-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 transition"
                >
                  {uploadingPdf ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            )}

            {/* Hidden PDF input */}
            <input
              type="file"
              ref={pdfInputRef}
              onChange={handlePdfSelect}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            <div className="flex gap-2">
              {/* PDF upload button */}
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={uploadingPdf}
                className="p-3 rounded-lg bg-dark-700/50 border border-primary-500/30 text-gray-300 hover:text-white hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Upload PDF for AI context"
              >
                <FileText className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => {
                  setAiQuestion(e.target.value);
                  // Auto-detect mode from typed hashtag
                  const hashtagMatch = e.target.value.match(/^#(\w+)/i);
                  if (hashtagMatch) {
                    const typedMode = hashtagMatch[1].toLowerCase();
                    const matchedMode = aiModes.find(m => m.id === typedMode);
                    if (matchedMode) {
                      setSelectedMode(typedMode);
                    }
                  } else if (!e.target.value.startsWith('#')) {
                    setSelectedMode(null);
                  }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskQuestion(); } }}
                placeholder={selectedMode ? `Ask about ${selectedMode}...` : "Ask a question (e.g., '#recommendation find pizza nearby')..."}
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
