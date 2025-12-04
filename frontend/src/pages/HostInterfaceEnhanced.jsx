import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Send,
  Upload,
  FileText,
  Users,
  MessageSquare,
  Bot,
  UserPlus,
  Trash2,
  Download,
  Sparkles,
  Settings,
  Calendar,
  Image,
  Hash,
  MapPin,
  MessagesSquare,
  Radio,
  Palette,
  X,
  ZoomIn,
  Camera,
  Share2,
  Link,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI, messagesAPI, aiAPI, attendanceAPI, documentsAPI, photosAPI, groupsAPI } from '../utils/api.ts';
import { API_URL } from '../config/api';

function HostInterfaceEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ai');
  const [message, setMessage] = useState('');
  const [aiRequest, setAiRequest] = useState('');
  const [aiConversation, setAiConversation] = useState(() => {
    // Try to load from localStorage on init
    const saved = localStorage.getItem(`ai-host-chat-${id}`);
    if (saved) {
      try {
        return JSON.parse(saved).map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error('Failed to load AI chat history:', e);
      }
    }
    return [{
      role: 'assistant',
      content: "Hi! I'm your AI host assistant. I can help with event planning, recommendations, broadcasting messages, and more. Use hashtags like #recommendation, #broadcast, or #create to access specific features!",
      timestamp: new Date()
    }];
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [lastUsedMode, setLastUsedMode] = useState(null); // Track last used mode for follow-up questions
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // AI proposed action awaiting confirmation
  const [executingAction, setExecutingAction] = useState(false);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const aiMessagesEndRef = useRef(null);

  // Auto-scroll AI conversation
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiConversation]);

  // Save AI chat history to localStorage
  useEffect(() => {
    if (!id || aiConversation.length <= 1) return; // Don't save just the greeting
    localStorage.setItem(`ai-host-chat-${id}`, JSON.stringify(aiConversation));
  }, [id, aiConversation]);

  // AI Mode options for hosts (includes #broadcast and #create)
  const aiModes = [
    { id: 'general', label: '#general', icon: Hash, description: 'General AI chat', color: 'from-gray-500 to-gray-600' },
    { id: 'event', label: '#event', icon: Calendar, description: 'Event-specific info', color: 'from-blue-500 to-blue-600' },
    { id: 'recommendation', label: '#recommendation', icon: MapPin, description: 'Find nearby places', color: 'from-green-500 to-green-600' },
    { id: 'groupchat', label: '#groupchat', icon: MessagesSquare, description: 'Search chat history', color: 'from-purple-500 to-purple-600' },
    { id: 'photos', label: '#photos', icon: Camera, description: 'Find photos of me', color: 'from-cyan-500 to-cyan-600' },
    { id: 'broadcast', label: '#broadcast', icon: Radio, description: 'Announce to all guests', color: 'from-red-500 to-red-600' },
    { id: 'create', label: '#create', icon: Palette, description: 'Generate AI invitations', color: 'from-pink-500 to-purple-600' },
  ];
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchEvent();
    fetchDocuments();
    fetchContacts();
    fetchGroups();
    fetchAttendees();
    fetchPhotos();
  }, [id]);

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

  const fetchDocuments = async () => {
    try {
      const data = await documentsAPI.list(id);
      setDocuments(data.documents || data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      // Contacts = attendees for this event
      const data = await attendanceAPI.getAttendees(id);
      setContacts(data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setContacts([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await groupsAPI.list();
      setGroups(data.groups || data || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    }
  };

  const fetchAttendees = async () => {
    try {
      const data = await attendanceAPI.getAttendees(id);
      setAttendees(data);
    } catch (error) {
      console.error('Failed to fetch attendees:', error);
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
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingPhoto(true);
    try {
      await photosAPI.upload(id, file);
      toast.success('Photo uploaded!');
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await photosAPI.delete(id, photoId);
      toast.success('Photo deleted');
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  const handleAiRequest = async () => {
    if (!aiRequest.trim()) return;

    // Check if message has a hashtag (to determine if it's an explicit mode switch)
    const messageHasHashtag = aiRequest.trim().startsWith('#');

    // Check if this is a #photos request
    // Also check if lastUsedMode was photos and no new hashtag was specified (for follow-up questions)
    const isPhotosRequest = selectedMode === 'photos' ||
      aiRequest.toLowerCase().startsWith('#photos') ||
      (!messageHasHashtag && lastUsedMode === 'photos');

    if (isPhotosRequest) {
      // Handle face recognition photo search
      const userMessage = {
        role: 'user',
        content: aiRequest || 'Find photos of me',
        timestamp: new Date()
      };
      setAiConversation(prev => [...prev, userMessage]);
      setAiRequest('');
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
          photos: response.photos || []
        };
        setAiConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('photos'); // Remember this mode for follow-up questions
      } catch (error) {
        console.error('Face search error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble searching for your photos. Make sure you have uploaded a profile photo with a clear face in Settings.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    // Check if this is a #general request (ChatGPT-like general AI)
    // Also check if lastUsedMode was general and no new hashtag was specified (for follow-up questions)
    const isGeneralRequest = selectedMode === 'general' ||
      aiRequest.toLowerCase().startsWith('#general') ||
      (!messageHasHashtag && lastUsedMode === 'general');

    if (isGeneralRequest) {
      const userMessage = {
        role: 'user',
        content: aiRequest,
        timestamp: new Date()
      };

      // Build conversation history for context (include previous exchanges)
      const historyForAPI = aiConversation
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-10)
        .map(msg => ({ role: msg.role, content: msg.content }));

      setAiConversation(prev => [...prev, userMessage]);

      // Extract the actual question (remove #general prefix)
      const cleanQuestion = aiRequest.replace(/^#general\s*/i, '').trim();
      setAiRequest('');
      setAiLoading(true);

      try {
        const response = await aiAPI.generalQuery(cleanQuestion || 'Hello', historyForAPI, id);
        const aiMessage = {
          role: 'assistant',
          content: response.answer || 'I couldn\'t generate a response.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('general'); // Remember this mode for follow-up questions
      } catch (error) {
        console.error('General query error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble processing that request. Please try again.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    // Check if this is a #groupchat request (search chat history using RAG)
    // Also check if lastUsedMode was groupchat and no new hashtag was specified (for follow-up questions)
    const isGroupchatRequest = selectedMode === 'groupchat' ||
      aiRequest.toLowerCase().startsWith('#groupchat') ||
      (!messageHasHashtag && lastUsedMode === 'groupchat');

    if (isGroupchatRequest) {
      const userMessage = {
        role: 'user',
        content: aiRequest,
        timestamp: new Date()
      };

      // Build conversation history for context (include previous groupchat exchanges)
      const historyForAPI = aiConversation
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-10)
        .map(msg => ({ role: msg.role, content: msg.content }));

      setAiConversation(prev => [...prev, userMessage]);

      // Extract the actual question (remove #groupchat prefix)
      const cleanQuestion = aiRequest.replace(/^#groupchat\s*/i, '').trim();
      setAiRequest('');
      setAiLoading(true);

      try {
        // Use guestQuery which uses RAG to search chat history - pass conversation history for context
        const response = await aiAPI.guestQuery(id, cleanQuestion || 'What has everyone been talking about?', historyForAPI);

        // If skip_response is true, AI determined no response is needed
        if (response.skip_response) {
          setLastUsedMode('groupchat');
          return;
        }

        const aiMessage = {
          role: 'assistant',
          content: response.answer || 'I couldn\'t find any relevant information in the chat.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('groupchat'); // Remember this mode for follow-up questions
      } catch (error) {
        console.error('Groupchat query error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble searching the chat history. Please try again.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    // Check if this is a #recommendation request (Google Places search)
    // Also check if lastUsedMode was recommendation and no new hashtag was specified (for follow-up questions)
    const isRecommendationRequest = selectedMode === 'recommendation' ||
      aiRequest.toLowerCase().startsWith('#recommendation') ||
      (!messageHasHashtag && lastUsedMode === 'recommendation');

    if (isRecommendationRequest) {
      const userMessage = {
        role: 'user',
        content: aiRequest,
        timestamp: new Date()
      };

      setAiConversation(prev => [...prev, userMessage]);

      // Extract the actual query (remove #recommendation prefix)
      const cleanQuery = aiRequest.replace(/^#recommendation\s*/i, '').trim();
      setAiRequest('');
      setAiLoading(true);

      try {
        const response = await aiAPI.recommendation(id, cleanQuery || 'restaurants nearby');

        let content = response.message || `Found ${response.total_found} places nearby`;

        // Format places into a nice display
        if (response.places && response.places.length > 0) {
          content += '\n\n';
          response.places.forEach((place, index) => {
            content += `**${index + 1}. ${place.name}**\n`;
            content += `📍 ${place.address}\n`;
            if (place.rating) {
              content += `⭐ ${place.rating}${place.total_ratings ? ` (${place.total_ratings} reviews)` : ''}\n`;
            }
            if (place.price_level) {
              content += `💰 ${'$'.repeat(place.price_level)}\n`;
            }
            if (place.opening_hours) {
              content += `🕐 ${place.opening_hours}\n`;
            }
            if (place.maps_url) {
              content += `🔗 [View on Google Maps](${place.maps_url})\n`;
            }
            content += '\n';
          });
        }

        const aiMessage = {
          role: 'assistant',
          content: content,
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('recommendation'); // Remember this mode for follow-up questions
      } catch (error) {
        console.error('Recommendation error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble searching for recommendations. Make sure the event has a location set, or try setting your location in Settings.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    // Check if this is a #broadcast request (send message to all guests)
    // Also check if lastUsedMode was broadcast and no new hashtag was specified
    const isBroadcastRequest = selectedMode === 'broadcast' ||
      aiRequest.toLowerCase().startsWith('#broadcast') ||
      (!messageHasHashtag && lastUsedMode === 'broadcast');

    if (isBroadcastRequest) {
      const userMessage = {
        role: 'user',
        content: aiRequest,
        timestamp: new Date()
      };

      setAiConversation(prev => [...prev, userMessage]);

      // Extract the actual message (remove #broadcast prefix)
      const cleanMessage = aiRequest.replace(/^#broadcast\s*/i, '').trim();
      setAiRequest('');
      setAiLoading(true);

      try {
        const response = await aiAPI.broadcast(id, cleanMessage || 'Hello everyone!');

        const aiMessage = {
          role: 'assistant',
          content: response.success
            ? `✅ Message broadcast successfully to all guests in the event chat!\n\n**Your announcement:**\n"${cleanMessage}"`
            : 'Failed to broadcast message. Please try again.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('broadcast');
      } catch (error) {
        console.error('Broadcast error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble broadcasting your message. Please try again.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    // Check if this is a #create request (generate AI invitation/cover image)
    // Also check if lastUsedMode was create and no new hashtag was specified
    const isCreateRequest = selectedMode === 'create' ||
      aiRequest.toLowerCase().startsWith('#create') ||
      (!messageHasHashtag && lastUsedMode === 'create');

    if (isCreateRequest) {
      const userMessage = {
        role: 'user',
        content: aiRequest || 'Generate an AI invitation image for my event',
        timestamp: new Date()
      };

      setAiConversation(prev => [...prev, userMessage]);
      setAiRequest('');
      setAiLoading(true);

      try {
        // Call the DALL-E cover image generation endpoint with preview=true
        const response = await eventsAPI.generateCoverImage(id, true);

        let content = '✨ AI invitation image generated!\n\n';
        content += 'Here\'s a preview of your generated cover image. Click "Apply as Cover" below to set it as your event\'s cover image.';

        const aiMessage = {
          role: 'assistant',
          content: content,
          timestamp: new Date(),
          coverImageUrl: response.cover_image_url,
          pendingCoverImage: true  // Flag to show apply button
        };
        setAiConversation(prev => [...prev, aiMessage]);
        setLastUsedMode('create');
      } catch (error) {
        console.error('Create invitation error:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I had trouble generating the invitation image. This could be due to content policy restrictions or API limits. Please try again or upload a custom cover image from the event page.',
          timestamp: new Date()
        };
        setAiConversation(prev => [...prev, errorMessage]);
      } finally {
        setAiLoading(false);
        setSelectedMode(null);
      }
      return;
    }

    const userMessage = {
      role: 'user',
      content: aiRequest,
      timestamp: new Date()
    };

    // Build conversation history for API (exclude system messages, limit to last 10)
    const historyForAPI = aiConversation
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map(msg => ({ role: msg.role, content: msg.content }));

    setAiConversation(prev => [...prev, userMessage]);
    const currentRequest = aiRequest;
    setAiRequest('');
    setAiLoading(true);

    try {
      // Send with conversation history for context
      const response = await aiAPI.hostAssist(id, currentRequest, null, historyForAPI);
      let responseText = response.response || response.answer || 'No response received';
      let photoIds = [];

      // Parse photo IDs from response if present [PHOTOS:id1,id2,id3]
      const photoMatch = responseText.match(/\[PHOTOS:([^\]]+)\]/);
      if (photoMatch) {
        photoIds = photoMatch[1].split(',').filter(id => id.trim());
        // Remove the photo tag from display text
        responseText = responseText.replace(/\[PHOTOS:[^\]]+\]/, '').trim();
      }

      // Check if AI wants to perform an action
      if (response.proposed_action) {
        setPendingAction(response.proposed_action);
        responseText = responseText || `I'd like to: ${response.proposed_action.description}`;
      }

      const aiMessage = {
        role: 'assistant',
        content: responseText,
        photos: photoIds,
        proposedAction: response.proposed_action || null,
        timestamp: new Date()
      };
      setAiConversation(prev => [...prev, aiMessage]);
      setSelectedMode(null);
      setLastUsedMode('event'); // Remember this mode for follow-up questions
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble processing that request right now. Please try again.',
        timestamp: new Date()
      };
      setAiConversation(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle AI action confirmation
  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setExecutingAction(true);
    try {
      const result = await aiAPI.executeAction(id, pendingAction.function, pendingAction.args);

      // Add confirmation message to chat
      const confirmMessage = {
        role: 'assistant',
        content: `✅ Done! ${result.message}`,
        timestamp: new Date()
      };
      setAiConversation(prev => [...prev, confirmMessage]);

      // Refresh event data to show updated values
      fetchEvent();
      toast.success(result.message);
    } catch (error) {
      console.error('Failed to execute action:', error);
      const errorMessage = {
        role: 'assistant',
        content: '❌ Failed to make that change. Please try again.',
        timestamp: new Date()
      };
      setAiConversation(prev => [...prev, errorMessage]);
      toast.error('Failed to execute action');
    } finally {
      setPendingAction(null);
      setExecutingAction(false);
    }
  };

  const handleCancelAction = () => {
    const cancelMessage = {
      role: 'assistant',
      content: '↩️ Okay, I won\'t make that change.',
      timestamp: new Date()
    };
    setAiConversation(prev => [...prev, cancelMessage]);
    setPendingAction(null);
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type (PDFs and TXT)
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF or TXT files only');
      return;
    }

    setUploadingDocument(true);
    try {
      const result = await documentsAPI.upload(id, file);
      toast.success(`"${file.name}" uploaded! AI extracted ${result.extracted_text_length || 0} characters.`);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (documentId, filename) => {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;

    try {
      await documentsAPI.delete(id, documentId);
      toast.success(`"${filename}" deleted`);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleAddContact = async () => {
    if (!newContactEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await attendanceAPI.inviteUser(id, newContactEmail);
      toast.success(`Invitation sent to ${newContactEmail}`);
      setNewContactEmail('');
      fetchAttendees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    }
  };

  const handleAddToGroup = async (contactId, groupId) => {
    try {
      toast.success('Contact added to group chat!');
      fetchGroups();
    } catch (error) {
      toast.error('Failed to add to group');
    }
  };

  const handleGenerateInviteLink = async () => {
    setGeneratingLink(true);
    try {
      const result = await attendanceAPI.createInviteLink(id, { role: 'attendee' });
      setInviteLink(result.url);
      setLinkCopied(false);
    } catch (error) {
      console.error('Failed to generate invite link:', error);
      toast.error('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareNative = async () => {
    if (!inviteLink || !navigator.share) return;
    try {
      await navigator.share({
        title: `Join ${event.name}`,
        text: `You're invited to ${event.name}!`,
        url: inviteLink
      });
    } catch (error) {
      // User cancelled or share failed
      if (error.name !== 'AbortError') {
        handleCopyLink(); // Fallback to copy
      }
    }
  };

  const handleDeleteEvent = async () => {
    setDeleting(true);
    try {
      await eventsAPI.delete(id);
      toast.success('Event deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete event');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-400 mx-auto"></div>
          <p className="mt-4 text-primary-200">Loading host interface...</p>
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
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-semibold">
              Host Interface
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{event.name}</h1>
              <p className="text-primary-200">
                {event.date} {event.time && `at ${event.time}`} • {event.address || 'Location TBD'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 p-2 rounded-lg transition flex items-center gap-2"
                title="Share Event"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition flex items-center gap-2"
                title="Delete Event"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-dark-800 border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Delete Event</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete "<span className="text-white font-semibold">{event.name}</span>"? This action cannot be undone and will remove all associated data including attendees, photos, and documents.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-dark-800 border border-primary-500/30 rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Share Event</h3>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setInviteLink(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!inviteLink ? (
                <div className="text-center py-6">
                  <Share2 className="w-12 h-12 text-primary-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-6">
                    Generate a shareable invite link for "{event.name}"
                  </p>
                  <button
                    onClick={handleGenerateInviteLink}
                    disabled={generatingLink}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                  >
                    {generatingLink ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4" />
                        Generate Invite Link
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Invite Link:</p>
                  <div className="bg-dark-700 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 bg-transparent text-white text-sm outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="text-primary-400 hover:text-primary-300 p-2 rounded-lg hover:bg-primary-500/10 transition"
                      title="Copy link"
                    >
                      {linkCopied ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      {linkCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    {navigator.share && (
                      <button
                        onClick={handleShareNative}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    )}
                  </div>

                  <p className="text-gray-500 text-xs mt-4 text-center">
                    Anyone with this link can join as an attendee
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-4 mb-6">
          <div className="flex gap-4 overflow-x-auto">
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
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'photos'
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                  : 'bg-dark-700/50 text-gray-300 hover:text-white'
              }`}
            >
              <Image className="w-5 h-5" />
              Photos ({photos.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'contacts'
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                  : 'bg-dark-700/50 text-gray-300 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              Contacts & Groups
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'groups'
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                  : 'bg-dark-700/50 text-gray-300 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              Groups
            </button>
            <button
              onClick={() => navigate(`/event/${id}/chat`)}
              className="px-6 py-3 rounded-lg font-semibold bg-dark-700/50 text-gray-300 hover:text-white transition whitespace-nowrap flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Event Chat
            </button>
          </div>
        </div>

        {/* AI Assistant Tab */}
        {activeTab === 'ai' && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-accent-400" />
                AI Host Assistant
              </h2>
              {aiConversation.length > 1 && (
                <button
                  onClick={() => {
                    setAiConversation([{
                      role: 'assistant',
                      content: "Hi! I'm your AI host assistant. I can help with event planning, recommendations, broadcasting messages, and more. Use hashtags like #recommendation, #broadcast, or #create to access specific features!",
                      timestamp: new Date()
                    }]);
                    localStorage.removeItem(`ai-host-chat-${id}`);
                    setLastUsedMode(null);
                    toast.success('Chat cleared');
                  }}
                  className="px-3 py-1.5 text-xs text-dark-400 hover:text-white border border-dark-600 hover:border-primary-500 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New Chat
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* AI Mode Selection Buttons */}
              <div className="bg-dark-700/30 border border-primary-500/20 rounded-xl p-4">
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
                            setAiRequest(aiRequest.replace(new RegExp(`^#${mode.id}\\s*`, 'i'), ''));
                          } else {
                            setSelectedMode(mode.id);
                            const cleanedRequest = aiRequest.replace(/^#\w+\s*/i, '');
                            setAiRequest(`#${mode.id} ${cleanedRequest}`);
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
                    'Click a mode to activate it, or type a hashtag directly in your message'
                  )}
                </p>
              </div>

              {/* Chat Conversation Area */}
              <div className="bg-dark-700/30 border border-primary-500/20 rounded-xl overflow-hidden">
                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto p-4 bg-dark-900/20">
                  <div className="space-y-4">
                    {aiConversation.map((msg, index) => (
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

                          {/* Display photos if present in this message */}
                          {msg.photos && msg.photos.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Image className="w-4 h-4 text-primary-400" />
                                <span className="text-xs text-gray-400">Found Photos</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {msg.photos.map((photo) => (
                                  <div key={photo.id || photo} className="relative group">
                                    <img
                                      src={`${API_URL}/api/events/photos/${photo.id || photo}/file?token=${token}`}
                                      alt="Event photo"
                                      className="w-full h-24 object-cover rounded-lg border border-dark-600 hover:border-primary-500 transition-colors cursor-pointer"
                                      onClick={() => window.open(`${API_URL}/api/events/photos/${photo.id || photo}/file?token=${token}`, '_blank')}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Display generated cover image if present */}
                          {msg.coverImageUrl && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Palette className="w-4 h-4 text-pink-400" />
                                <span className="text-xs text-gray-400">Generated Cover Image</span>
                              </div>
                              <div className="relative">
                                <img
                                  src={msg.coverImageUrl}
                                  alt="Generated event cover"
                                  className="w-full max-w-md rounded-lg border border-pink-500/30 hover:border-pink-500 transition-colors cursor-pointer"
                                  onClick={() => window.open(msg.coverImageUrl, '_blank')}
                                />
                              </div>
                              {msg.pendingCoverImage && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await eventsAPI.applyCoverImage(id, msg.coverImageUrl);
                                      toast.success('Cover image applied successfully!');
                                      // Update the message to remove pending state
                                      setAiConversation(prev => prev.map(m =>
                                        m === msg ? { ...m, pendingCoverImage: false } : m
                                      ));
                                      fetchEvent();
                                    } catch (error) {
                                      toast.error('Failed to apply cover image');
                                    }
                                  }}
                                  className="mt-3 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                >
                                  <Palette className="w-4 h-4" />
                                  Apply as Cover Image
                                </button>
                              )}
                            </div>
                          )}

                          <p className="text-xs mt-2 opacity-70">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Pending Action Confirmation */}
                    {pendingAction && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] p-4 rounded-xl bg-gradient-to-r from-amber-900/50 to-orange-900/50 border border-amber-500/40">
                          <div className="flex items-center gap-2 mb-3">
                            <Settings className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span className="text-sm font-semibold text-amber-400">Confirm Action</span>
                          </div>
                          <p className="text-white mb-4">{pendingAction.description}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleConfirmAction}
                              disabled={executingAction}
                              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {executingAction ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  Applying...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  Confirm
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelAction}
                              disabled={executingAction}
                              className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
                    <div ref={aiMessagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-primary-500/20 bg-dark-800/80">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={aiRequest}
                      onChange={(e) => {
                        setAiRequest(e.target.value);
                        // Auto-resize textarea (up to ~5 lines)
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAiRequest();
                        }
                      }}
                      placeholder={selectedMode ? `Ask about ${selectedMode}...` : "Ask AI to help (e.g., '#recommendation find Italian food nearby')..."}
                      className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none min-h-[48px] max-h-[150px]"
                      rows={1}
                    />
                    <button
                      onClick={handleAiRequest}
                      disabled={aiLoading || !aiRequest.trim()}
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
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-accent-400" />
                Event Documents
              </h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDocument}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {uploadingDocument ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                Upload File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.jpg,.jpeg,.png,.gif,.webp"
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
                          Uploaded {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toast.info('Download not available - documents are processed for AI context only')}
                        className="text-accent-400 hover:text-accent-300 p-2"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                        className="text-red-400 hover:text-red-300 p-2"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No files uploaded yet</p>
                <p className="text-gray-500 text-sm mt-2">Upload PDFs, images, menus, schedules - AI will read them</p>
              </div>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Image className="w-6 h-6 text-accent-400" />
                Event Photos
              </h2>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Upload className="w-5 h-5" />
                )}
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
                    className="relative group aspect-square rounded-xl overflow-hidden border border-primary-500/20 cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url || `${API_URL}/api/events/photos/${photo.id}/file?token=${token}`}
                      alt={photo.caption || 'Event photo'}
                      className="w-full h-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(photo);
                        }}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                      >
                        <ZoomIn className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        className="p-2 bg-red-500/50 rounded-full hover:bg-red-500/70 transition"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                        <p className="text-white text-sm truncate">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No photos uploaded yet</p>
                <p className="text-gray-500 text-sm mt-2">Upload photos from the event or use #create to generate AI invitations</p>
              </div>
            )}
          </div>
        )}

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
              src={selectedPhoto.url || `${API_URL}/api/events/photos/${selectedPhoto.id}/file?token=${token}`}
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

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-accent-400" />
              My Groups
            </h2>

            {groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-dark-700/50 border border-primary-500/20 rounded-xl p-6 hover:border-primary-500/40 transition cursor-pointer"
                    onClick={() => navigate(`/group/${group.id}/chat`)}
                  >
                    <h3 className="text-lg font-bold text-white mb-4">{group.name}</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent-400" />
                        {group.event_count || 0} events
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent-400" />
                        {group.member_count || 0} members
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/group/${group.id}/chat`);
                      }}
                      className="mt-4 w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open Chat
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-dark-700/30 rounded-xl border border-primary-500/20">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No groups yet</p>
                <button
                  onClick={() => navigate('/groups')}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold"
                >
                  Create a Group
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/groups')}
                className="text-primary-400 hover:text-primary-300 font-semibold transition"
              >
                View All Groups →
              </button>
            </div>
          </div>
        )}

        {/* Contacts & Groups Tab */}
        {activeTab === 'contacts' && (
          <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-accent-400" />
              Contacts & Group Chats
            </h2>

            <div className="space-y-6">
              {/* Add Contact */}
              <div className="bg-dark-700/30 border border-primary-500/20 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Add Contact</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddContact(); } }}
                    placeholder="Enter email address..."
                    className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                  <button
                    onClick={handleAddContact}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Confirmed Attendees */}
              <div className="bg-dark-700/30 border border-primary-500/20 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-400" />
                  Confirmed Attendees ({attendees.length})
                </h3>
                {attendees.length > 0 ? (
                  <div className="space-y-2">
                    {attendees.map((attendee) => (
                      <div
                        key={attendee.user_id}
                        className="bg-dark-700/50 border border-primary-500/20 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold">{attendee.name}</p>
                            <p className="text-sm text-gray-400">{attendee.email}</p>
                            {attendee.plus_ones > 0 && (
                              <p className="text-sm text-accent-400 mt-1">
                                +{attendee.plus_ones} guest{attendee.plus_ones > 1 ? 's' : ''}
                              </p>
                            )}
                            {attendee.rsvp_notes && (
                              <p className="text-sm text-gray-400 mt-1 italic">"{attendee.rsvp_notes}"</p>
                            )}
                          </div>
                          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                            Confirmed
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No confirmed attendees yet</p>
                )}
              </div>

              {/* Available Group Chats */}
              <div className="bg-dark-700/30 border border-primary-500/20 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-4">Group Chats</h3>
                {groups.length > 0 ? (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => navigate(`/group/${group.id}/chat`)}
                        className="w-full bg-dark-700/50 border border-primary-500/20 rounded-lg p-4 hover:bg-dark-700 transition text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold">{group.name}</p>
                            <p className="text-sm text-gray-400">{group.member_count || 0} members</p>
                          </div>
                          <MessageSquare className="w-5 h-5 text-primary-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No groups created yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default HostInterfaceEnhanced;
