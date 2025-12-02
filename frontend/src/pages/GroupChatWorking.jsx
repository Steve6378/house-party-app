import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Users, Image, X, Trash2, FileText, Paperclip } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { messagesAPI, eventsAPI, photosAPI, documentsAPI, aiAPI } from '../utils/api.ts';
import { toast } from 'sonner';

function GroupChatWorking() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchMessages();
      fetchPhotos();
      fetchDocuments();
      // Poll for new messages and photos every 3 seconds
      const interval = setInterval(() => {
        fetchMessages();
        fetchPhotos();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, photos]);

  // Combine messages and photos into a unified timeline
  const getCombinedTimeline = () => {
    const timeline = [];

    // Add messages
    messages.forEach(msg => {
      timeline.push({
        type: 'message',
        data: msg,
        timestamp: new Date(msg.created_at || msg.timestamp).getTime()
      });
    });

    // Add photos
    photos.forEach(photo => {
      timeline.push({
        type: 'photo',
        data: photo,
        timestamp: new Date(photo.created_at).getTime()
      });
    });

    // Sort by timestamp (oldest first)
    timeline.sort((a, b) => a.timestamp - b.timestamp);

    return timeline;
  };

  const timeline = getCombinedTimeline();

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
      // API returns array directly, not {messages: [...]}
      setMessages(Array.isArray(data) ? data : (data.messages || []));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      const data = await photosAPI.list(eventId);
      setPhotos(data || []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await documentsAPI.list(eventId);
      setDocuments(data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('PDF must be less than 10MB');
        return;
      }

      // Check file type
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

  const handleUploadPdf = async () => {
    if (!selectedPdf) return;

    setUploadingPdf(true);
    try {
      await documentsAPI.upload(eventId, selectedPdf);
      toast.success('PDF uploaded! You can now ask questions about it.');
      clearSelectedPdf();
      fetchDocuments();
      // Post a system message about the upload
      await messagesAPI.send(eventId, {
        content: `Uploaded document: ${selectedPdf.name}`,
        message_type: 'system'
      });
      fetchMessages();
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    try {
      await photosAPI.upload(eventId, selectedImage, message.trim() || undefined);
      toast.success('Photo uploaded!');
      clearSelectedImage();
      setMessage('');
      fetchPhotos();
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    const messageContent = message;
    setMessage(''); // Clear input immediately for better UX

    // Check if this is a general AI query (ChatGPT-like, no event context)
    const generalMatch = messageContent.trim().match(/^#general\s+(.+)/i);

    if (generalMatch) {
      const question = generalMatch[1];

      // First save the user's question to chat
      try {
        await messagesAPI.send(eventId, {
          content: messageContent,
          message_type: 'user'
        });
        await fetchMessages();
      } catch (error) {
        console.error('Failed to send message:', error);
      }

      // Get general AI response (no event context)
      setAiLoading(true);
      try {
        const response = await aiAPI.generalQuery(question);

        // Post AI response to chat
        await messagesAPI.send(eventId, {
          content: `🤖 **AI:** ${response.answer}`,
          message_type: 'ai'
        });
        await fetchMessages();
      } catch (error) {
        console.error('General AI query failed:', error);
        await messagesAPI.send(eventId, {
          content: '🤖 **AI:** Sorry, I had trouble answering that. Please try again.',
          message_type: 'ai'
        });
        await fetchMessages();
      } finally {
        setAiLoading(false);
      }
      return;
    }

    // Check if this is an AI query about the chat (starts with @ai, #ai, or #groupchat)
    const aiMatch = messageContent.trim().match(/^(@ai|#ai|#groupchat)\s+(.+)/i);

    if (aiMatch) {
      const question = aiMatch[2];

      // First save the user's question to chat
      try {
        await messagesAPI.send(eventId, {
          content: messageContent,
          message_type: 'user'
        });
        await fetchMessages();
      } catch (error) {
        console.error('Failed to send message:', error);
      }

      // Get AI response using RAG (searches chat history + documents)
      setAiLoading(true);
      try {
        const response = await aiAPI.guestQuery(eventId, question);

        // Post AI response to chat
        await messagesAPI.send(eventId, {
          content: `🤖 **AI:** ${response.answer}`,
          message_type: 'ai'
        });
        await fetchMessages();
      } catch (error) {
        console.error('AI query failed:', error);
        await messagesAPI.send(eventId, {
          content: '🤖 **AI:** Sorry, I had trouble answering that. Please try again.',
          message_type: 'ai'
        });
        await fetchMessages();
      } finally {
        setAiLoading(false);
      }
      return;
    }

    // Regular message
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
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-gray-400 hover:text-red-400 transition p-2 rounded-lg hover:bg-red-500/10"
            title="Clear chat history"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-120px)] flex flex-col">
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl flex-1 flex flex-col overflow-hidden">
          {/* Messages and Photos Timeline */}
          <div className="flex-1 overflow-y-auto p-6 bg-dark-900/20">
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                timeline.map((item, index) => {
                  if (item.type === 'message') {
                    const msg = item.data;
                    const isOwnMessage = msg.sender_id === user?.id;
                    const isSystemMessage = msg.message_type === 'announcement' || msg.message_type === 'system';

                    if (isSystemMessage) {
                      return (
                        <div key={`msg-${msg.id}`} className="flex justify-center">
                          <div className="max-w-md px-4 py-3 rounded-lg bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border border-primary-500/30 text-primary-200 text-sm text-center">
                            {msg.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={`msg-${msg.id}`} className="flex flex-col">
                        <div
                          className={`flex items-start gap-3 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {!isOwnMessage && (
                            msg.sender_profile_photo ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${msg.sender_profile_photo}?token=${token}`}
                                alt={msg.sender_name || 'User'}
                                className="flex-shrink-0 w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null
                          )}
                          {!isOwnMessage && (
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-semibold text-xs"
                              style={{ display: msg.sender_profile_photo ? 'none' : 'flex' }}
                            >
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
                            user?.profile_photo ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/me/photo?token=${token}`}
                                alt={user?.name || 'You'}
                                className="flex-shrink-0 w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null
                          )}
                          {isOwnMessage && (
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-600 to-primary-600 flex items-center justify-center text-white font-semibold text-xs"
                              style={{ display: user?.profile_photo ? 'none' : 'flex' }}
                            >
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
                  }

                  if (item.type === 'photo') {
                    const photo = item.data;
                    const isOwnPhoto = photo.uploaded_by === user?.id;

                    return (
                      <div key={`photo-${photo.id}`} className="flex flex-col">
                        <div
                          className={`flex items-start gap-3 ${
                            isOwnPhoto ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {!isOwnPhoto && (
                            photo.uploaded_by_profile_photo ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${photo.uploaded_by_profile_photo}?token=${token}`}
                                alt={photo.uploaded_by_name || 'User'}
                                className="flex-shrink-0 w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null
                          )}
                          {!isOwnPhoto && (
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-semibold text-xs"
                              style={{ display: photo.uploaded_by_profile_photo ? 'none' : 'flex' }}
                            >
                              {getInitials(photo.uploaded_by_name || 'User')}
                            </div>
                          )}
                          <div
                            className={`max-w-lg rounded-xl overflow-hidden ${
                              isOwnPhoto
                                ? 'bg-gradient-to-r from-primary-600 to-secondary-600'
                                : 'bg-dark-700/50 border border-primary-500/20'
                            }`}
                          >
                            {!isOwnPhoto && (
                              <div className="text-xs px-4 pt-3 font-semibold text-primary-300">
                                {photo.uploaded_by_name || 'Unknown'}
                              </div>
                            )}
                            <img
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/events/photos/${photo.id}/file?token=${token}`}
                              alt={photo.caption || 'Shared photo'}
                              className="max-w-full max-h-64 object-contain cursor-pointer"
                              onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/events/photos/${photo.id}/file?token=${token}`, '_blank')}
                            />
                            {photo.caption && (
                              <p className={`text-sm px-4 py-2 ${isOwnPhoto ? 'text-white' : 'text-gray-200'}`}>
                                {photo.caption}
                              </p>
                            )}
                          </div>
                          {isOwnPhoto && (
                            user?.profile_photo ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/me/photo?token=${token}`}
                                alt={user?.name || 'You'}
                                className="flex-shrink-0 w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null
                          )}
                          {isOwnPhoto && (
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-600 to-primary-600 flex items-center justify-center text-white font-semibold text-xs"
                              style={{ display: user?.profile_photo ? 'none' : 'flex' }}
                            >
                              {getInitials(user?.name || 'You')}
                            </div>
                          )}
                        </div>
                        <div
                          className={`text-xs text-gray-500 mt-1 ${
                            isOwnPhoto ? 'text-right mr-11' : 'text-left ml-11'
                          }`}
                        >
                          {formatTime(photo.created_at)}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-primary-500/20 bg-dark-800/80">
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded-lg border border-primary-500/30"
                />
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PDF Preview */}
            {selectedPdf && (
              <div className="mb-3 relative inline-flex items-center gap-2 px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg">
                <FileText className="w-5 h-5 text-primary-400" />
                <span className="text-sm text-gray-300">{selectedPdf.name}</span>
                <button
                  type="button"
                  onClick={clearSelectedPdf}
                  className="ml-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleUploadPdf}
                  disabled={uploadingPdf}
                  className="ml-2 px-3 py-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 transition"
                >
                  {uploadingPdf ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            )}

            <form onSubmit={selectedImage ? (e) => { e.preventDefault(); handleUploadImage(); } : handleSendMessage} className="flex items-center gap-2">
              {/* Hidden file inputs */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={pdfInputRef}
                onChange={handlePdfSelect}
                accept=".pdf,application/pdf"
                className="hidden"
              />

              {/* Image upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || uploadingPdf}
                className="p-3 rounded-lg bg-dark-700/50 border border-primary-500/30 text-gray-300 hover:text-white hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Upload image"
              >
                <Image className="w-5 h-5" />
              </button>

              {/* PDF upload button */}
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={uploadingImage || uploadingPdf}
                className="p-3 rounded-lg bg-dark-700/50 border border-primary-500/30 text-gray-300 hover:text-white hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Upload PDF (AI will be able to answer questions about it)"
              >
                <FileText className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedImage ? "Add a caption (optional)..." : "Type a message..."}
                className="flex-1 py-3 px-4 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={(!message.trim() && !selectedImage) || uploadingImage || uploadingPdf}
                className="p-3 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploadingImage || uploadingPdf ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Clear Chat History</h3>
            <p className="text-gray-300 mb-6">
              This will clear all messages and photos from your view. This action only affects your local view - messages will still exist on the server.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMessages([]);
                  setPhotos([]);
                  setShowClearConfirm(false);
                  toast.success('Chat cleared');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupChatWorking;
