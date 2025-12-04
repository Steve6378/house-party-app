import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  SendIcon,
  InfoIcon,
  ImageIcon,
  SparklesIcon,
  SearchIcon,
  XIcon,
  MapPinIcon,
  Loader2Icon,
  BotIcon,
  FileTextIcon,
  PlusIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, eventsAPI, photosAPI, aiAPI, documentsAPI } from '../utils/api';
import { toast } from 'sonner';
import { API_URL } from '../config/api';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    isAI?: boolean;
  };
  timestamp: Date;
  isAnnouncement?: boolean;
  photos?: Photo[];
}

interface Photo {
  id: string;
  file_path: string;
  description?: string;
  caption?: string;
}

interface Vendor {
  place_id: string;
  name: string;
  address: string;
  rating?: number;
  total_ratings?: number;
  price_level?: number;
  photos: string[];
  is_open?: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  frequency: number;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GroupChat: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const [showVendorSearch, setShowVendorSearch] = useState(false);
  const [vendorType, setVendorType] = useState('restaurant');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showFAQs, setShowFAQs] = useState(false);
  const [photoSearchQuery, setPhotoSearchQuery] = useState('');
  const [searchedPhotos, setSearchedPhotos] = useState<Photo[]>([]);
  const [photoSearchLoading, setPhotoSearchLoading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Load event and messages
  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;
      try {
        const [eventData, messagesData] = await Promise.all([
          eventsAPI.get(eventId),
          messagesAPI.list(eventId)
        ]);
        setEvent(eventData);
        setMessages(messagesData.map((m: any) => ({
          id: m.id,
          content: m.content,
          sender: {
            id: m.sender_id || 'system',
            name: m.sender_name || 'Yorru AI',
            isAI: m.message_type === 'assistant' || m.message_type === 'system'
          },
          timestamp: new Date(m.created_at),
          isAnnouncement: m.message_type === 'system'
        })));

        // Load FAQs
        try {
          const faqsData = await aiAPI.getFAQs(eventId);
          setFaqs(faqsData);
        } catch (e) {
          console.log('No FAQs available');
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
        toast.error('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [eventId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load AI chat history from localStorage
  useEffect(() => {
    if (!eventId) return;
    const saved = localStorage.getItem(`ai-chat-${eventId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAiMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error('Failed to load AI chat history:', e);
      }
    }
  }, [eventId]);

  // Save AI chat history to localStorage
  useEffect(() => {
    if (!eventId || aiMessages.length === 0) return;
    localStorage.setItem(`ai-chat-${eventId}`, JSON.stringify(aiMessages));
  }, [eventId, aiMessages]);

  // Scroll AI messages to bottom
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '' || !eventId || isSending) return;

    const userMessage = message.trim();
    setMessage('');
    setIsSending(true);

    // Add user message immediately
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: userMessage,
      sender: {
        id: user?.id || 'current-user',
        name: user?.name || 'You'
      },
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      await messagesAPI.send(eventId, { content: userMessage });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;

    setUploadingPhoto(true);
    try {
      const result = await photosAPI.upload(eventId, file);
      toast.success('Photo uploaded! AI is analyzing it...');

      // Add a message about the photo
      const photoMessage: Message = {
        id: Date.now().toString(),
        content: `Shared a photo${result.description ? `: ${result.description}` : ''}`,
        sender: {
          id: user?.id || 'current-user',
          name: user?.name || 'You'
        },
        timestamp: new Date(),
        photos: [{
          id: result.id,
          file_path: `${API_URL}/api/events/photos/${result.id}/file`,
          description: result.description,
          caption: result.tags
        }]
      };
      setMessages(prev => [...prev, photoMessage]);
      setShowPhotoUpload(false);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAIQuery = async () => {
    if (!aiQuery.trim() || !eventId || aiLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: aiQuery.trim(),
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, userMessage]);
    setAiQuery('');
    setAiLoading(true);

    try {
      const result = await aiAPI.guestQuery(eventId, userMessage.content);
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI query failed:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I could not process your question. Please try again.',
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleVendorSearch = async () => {
    if (!eventId || vendorLoading) return;

    setVendorLoading(true);
    try {
      const result = await aiAPI.searchVendors(eventId, vendorType);
      setVendors(result.vendors);
    } catch (error) {
      console.error('Vendor search failed:', error);
      toast.error('Failed to search vendors');
    } finally {
      setVendorLoading(false);
    }
  };

  const handlePhotoSearch = async () => {
    if (!photoSearchQuery.trim() || photoSearchLoading) return;

    setPhotoSearchLoading(true);
    try {
      const result = await aiAPI.searchPhotos(photoSearchQuery, eventId);
      setSearchedPhotos(result.photos.map((p: any) => ({
        id: p.id,
        file_path: p.file_path,
        description: p.description,
        caption: p.tags
      })));
    } catch (error) {
      console.error('Photo search failed:', error);
      toast.error('Failed to search photos');
    } finally {
      setPhotoSearchLoading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;

    setUploadingDocument(true);
    setShowUploadMenu(false);
    try {
      const result = await documentsAPI.upload(eventId, file);
      toast.success(`Document "${file.name}" uploaded! AI is extracting content...`);

      // Add a system message about the document
      const docMessage: Message = {
        id: Date.now().toString(),
        content: `Uploaded document: ${file.name} (${result.extracted_text_length} characters extracted for AI context)`,
        sender: {
          id: 'system',
          name: 'Yorru AI',
          isAI: true
        },
        timestamp: new Date(),
        isAnnouncement: true
      };
      setMessages(prev => [...prev, docMessage]);
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Failed to upload document. Only PDF and TXT files are supported.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderPriceLevel = (level?: number) => {
    if (level === undefined) return null;
    return '$'.repeat(level + 1);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-dark-900 via-primary-900/20 to-dark-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary-400" />
          <p className="text-dark-300">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-dark-900 via-primary-900/20 to-dark-900">
      {/* Futuristic Header */}
      <div className="relative px-6 py-4 border-b border-primary-500/20 bg-dark-900/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-secondary-500/10" />
        <div className="relative flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              {event?.name || 'Event Chat'}
            </h2>
            <p className="text-sm text-dark-400">
              {event?.date ? new Date(event.date).toLocaleDateString() : 'Group Chat'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFAQs(!showFAQs)}
              className="p-2 rounded-xl bg-dark-800/50 border border-dark-700 text-dark-300 hover:text-primary-400 hover:border-primary-500/50 transition-all"
              title="FAQs"
            >
              <InfoIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`p-2 rounded-xl border transition-all ${
                showAIPanel
                  ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                  : 'bg-dark-800/50 border-dark-700 text-dark-300 hover:text-primary-400 hover:border-primary-500/50'
              }`}
              title="AI Assistant"
            >
              <SparklesIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                {msg.isAnnouncement ? (
                  <div className="flex justify-center">
                    <div className="max-w-md px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 text-primary-300 text-sm text-center backdrop-blur-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`flex items-start gap-3 ${msg.sender.id === (user?.id || 'current-user') ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender.id !== (user?.id || 'current-user') && (
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${
                          msg.sender.isAI
                            ? 'bg-gradient-to-br from-primary-500 to-secondary-500'
                            : 'bg-gradient-to-br from-dark-600 to-dark-700'
                        } flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
                          {msg.sender.isAI ? <BotIcon className="h-5 w-5" /> : getInitials(msg.sender.name)}
                        </div>
                      )}
                      <div className={`max-w-lg px-4 py-3 rounded-2xl shadow-lg ${
                        msg.sender.isAI
                          ? 'bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 text-dark-100'
                          : msg.sender.id === (user?.id || 'current-user')
                            ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white'
                            : 'bg-dark-800/80 border border-dark-700 text-dark-100'
                      } backdrop-blur-sm`}>
                        {msg.sender.id !== (user?.id || 'current-user') && (
                          <div className="font-medium text-xs mb-1 text-primary-400">
                            {msg.sender.name}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        {msg.photos && msg.photos.length > 0 && (
                          <div className="mt-2 grid gap-2">
                            {msg.photos.map(photo => (
                              <img
                                key={photo.id}
                                src={photo.file_path}
                                alt={photo.description || 'Event photo'}
                                className="rounded-lg max-w-full h-auto"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.sender.id === (user?.id || 'current-user') && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center text-white font-semibold text-xs shadow-lg">
                          {getInitials(user?.name || 'You')}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs text-dark-500 mt-1 ${msg.sender.id === (user?.id || 'current-user') ? 'text-right mr-14' : 'text-left ml-14'}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-dark-700/50 bg-dark-900/80 backdrop-blur-xl">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Hidden file inputs */}
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
              <input type="file" ref={docInputRef} onChange={handleDocumentUpload} accept=".pdf,.txt" className="hidden" />

              {/* Upload Menu Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  disabled={uploadingPhoto || uploadingDocument}
                  className="p-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 hover:text-primary-400 hover:border-primary-500/50 transition-all disabled:opacity-50"
                >
                  {(uploadingPhoto || uploadingDocument) ? (
                    <Loader2Icon className="h-5 w-5 animate-spin" />
                  ) : (
                    <PlusIcon className="h-5 w-5" />
                  )}
                </button>

                {/* Upload Menu Dropdown */}
                {showUploadMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-dark-200 hover:bg-dark-700 transition-colors text-sm"
                    >
                      <ImageIcon className="h-4 w-4 text-primary-400" />
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        docInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-dark-200 hover:bg-dark-700 transition-colors text-sm border-t border-dark-700"
                    >
                      <FileTextIcon className="h-4 w-4 text-secondary-400" />
                      Upload Document
                    </button>
                  </div>
                )}
              </div>

              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 py-3 px-4 bg-dark-800/50 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 text-dark-100 placeholder-dark-500 transition-all"
              />
              <button
                type="submit"
                disabled={isSending || !message.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-500 hover:to-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {isSending ? (
                  <Loader2Icon className="h-5 w-5 animate-spin" />
                ) : (
                  <SendIcon className="h-5 w-5" />
                )}
              </button>
            </form>
            <p className="text-xs text-dark-500 mt-2 text-center">
              Upload photos or documents (PDF/TXT) to share with the group. Documents are processed by AI for context.
            </p>
          </div>
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="w-96 border-l border-dark-700/50 bg-dark-900/80 backdrop-blur-xl flex flex-col">
            {/* AI Header */}
            <div className="p-4 border-b border-dark-700/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-primary-400" />
                  AI Assistant
                </h3>
                <div className="flex items-center gap-2">
                  {aiMessages.length > 0 && (
                    <button
                      onClick={() => {
                        setAiMessages([]);
                        if (eventId) localStorage.removeItem(`ai-chat-${eventId}`);
                      }}
                      className="text-xs text-dark-500 hover:text-dark-300"
                      title="Clear history"
                    >
                      Clear
                    </button>
                  )}
                  <button onClick={() => setShowAIPanel(false)} className="text-dark-400 hover:text-dark-200">
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {aiMessages.length === 0 ? (
                <div className="text-center text-dark-500 text-sm py-8">
                  <BotIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ask me anything about this event!</p>
                  <p className="text-xs mt-1">I can help with details, schedules, and more.</p>
                </div>
              ) : (
                aiMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-800/80 border border-dark-700 text-dark-200'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-dark-800/80 border border-dark-700">
                    <Loader2Icon className="h-4 w-4 animate-spin text-primary-400" />
                  </div>
                </div>
              )}
              <div ref={aiMessagesEndRef} />
            </div>

            {/* AI Input */}
            <div className="p-3 border-t border-dark-700/50 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  placeholder="Ask about the event..."
                  className="flex-1 py-2 px-3 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAIQuery(); } }}
                />
                <button
                  onClick={handleAIQuery}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500 disabled:opacity-50"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Photo Search */}
            <div className="p-4 border-b border-dark-700/50">
              <h4 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                <SearchIcon className="h-4 w-4" />
                Search Photos
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={photoSearchQuery}
                  onChange={e => setPhotoSearchQuery(e.target.value)}
                  placeholder="e.g., 'pics from last Sunday'"
                  className="flex-1 py-2 px-3 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePhotoSearch(); } }}
                />
                <button
                  onClick={handlePhotoSearch}
                  disabled={photoSearchLoading}
                  className="px-3 py-2 bg-dark-700 text-dark-200 rounded-lg text-sm hover:bg-dark-600 disabled:opacity-50"
                >
                  {photoSearchLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                </button>
              </div>
              {searchedPhotos.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {searchedPhotos.map(photo => (
                    <img
                      key={photo.id}
                      src={`${API_URL}${photo.file_path}`}
                      alt={photo.description || 'Photo'}
                      className="rounded-lg w-full h-20 object-cover cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Vendor Search */}
            <div className="p-4 flex-1 overflow-y-auto">
              <h4 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                Find Vendors Nearby
              </h4>
              <div className="flex gap-2 mb-3">
                <select
                  value={vendorType}
                  onChange={e => setVendorType(e.target.value)}
                  className="flex-1 py-2 px-3 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="restaurant">Restaurants</option>
                  <option value="catering">Catering</option>
                  <option value="hall">Event Halls</option>
                  <option value="bakery">Bakeries</option>
                  <option value="florist">Florists</option>
                  <option value="bar">Bars</option>
                </select>
                <button
                  onClick={handleVendorSearch}
                  disabled={vendorLoading}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500 disabled:opacity-50"
                >
                  {vendorLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : 'Search'}
                </button>
              </div>

              {vendors.length > 0 && (
                <div className="space-y-3">
                  {vendors.map(vendor => (
                    <div key={vendor.place_id} className="p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-dark-100 text-sm">{vendor.name}</h5>
                          <p className="text-xs text-dark-400">{vendor.address}</p>
                        </div>
                        {vendor.is_open !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded ${vendor.is_open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {vendor.is_open ? 'Open' : 'Closed'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-dark-400">
                        {vendor.rating && (
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            {vendor.rating} ({vendor.total_ratings})
                          </span>
                        )}
                        {vendor.price_level !== undefined && (
                          <span className="text-green-400">{renderPriceLevel(vendor.price_level)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAQs Panel */}
        {showFAQs && faqs.length > 0 && (
          <div className="w-80 border-l border-dark-700/50 bg-dark-900/80 backdrop-blur-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100">FAQs</h3>
              <button onClick={() => setShowFAQs(false)} className="text-dark-400 hover:text-dark-200">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.id} className="p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                  <h4 className="font-medium text-dark-200 text-sm mb-1">{faq.question}</h4>
                  <p className="text-xs text-dark-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChat;
