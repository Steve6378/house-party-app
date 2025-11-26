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
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { eventsAPI, messagesAPI, aiAPI, attendanceAPI } from '../utils/api.ts';
import SubscriptionModal from '../components/SubscriptionModal';

function HostInterfaceEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ai');
  const [message, setMessage] = useState('');
  const [aiRequest, setAiRequest] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [attendees, setAttendees] = useState([]);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchEvent();
    fetchDocuments();
    fetchContacts();
    fetchGroups();
    fetchAttendees();
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
      // Fetch event documents from backend
      // For now using placeholder
      setDocuments([]);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      // Fetch attendees and co-hosts
      setContacts([]);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      // Fetch available groups for this event
      setGroups([]);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
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

  const handleAiRequest = async () => {
    if (!aiRequest.trim()) return;

    setAiLoading(true);
    try {
      const response = await aiAPI.hostAssist(id, 'general', { request: aiRequest });
      setAiResponse(response.response || response.answer || 'No response received');
      setAiRequest('');
      toast.success('AI processed your request!');
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type (PDFs and common doc formats)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF or Word documents only');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    try {
      // Upload to backend
      toast.success('Document uploaded successfully!');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
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
          <h1 className="text-4xl font-bold text-white mb-2">{event.name}</h1>
          <p className="text-primary-200">
            {event.date} {event.time && `at ${event.time}`} • {event.address || 'Location TBD'}
          </p>
        </div>

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
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent-400" />
              AI Host Assistant
            </h2>

            <div className="space-y-6">
              <div className="bg-dark-700/30 border border-primary-500/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">What can I help you with?</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Modify event details (date, time, location)</li>
                  <li>• Generate invitation messages</li>
                  <li>• Create to-do lists</li>
                  <li>• Suggest event improvements</li>
                  <li>• Draft announcements for guests</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiRequest}
                  onChange={(e) => setAiRequest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAiRequest()}
                  placeholder="Ask AI to help (e.g., 'Change event time to 7 PM' or 'Draft invitation message')..."
                  className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
                <button
                  onClick={handleAiRequest}
                  disabled={aiLoading}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {aiLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
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
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload PDF
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
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
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-accent-400 hover:text-accent-300 p-2">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="text-red-400 hover:text-red-300 p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No documents uploaded yet</p>
                <p className="text-gray-500 text-sm mt-2">Upload PDFs, contracts, or event materials</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Mock groups - will be replaced with real data */}
              {[
                { id: '1', name: 'Sorority', events: 2, members: 45 },
                { id: '2', name: 'Study Group', events: 1, members: 12 },
                { id: '3', name: 'Friends', events: 1, members: 8 }
              ].map((group) => (
                <div
                  key={group.id}
                  className="bg-dark-700/50 border border-primary-500/20 rounded-xl p-6 hover:border-primary-500/40 transition cursor-pointer"
                  onClick={() => navigate(`/groups`)}
                >
                  <h3 className="text-lg font-bold text-white mb-4">{group.name}</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent-400" />
                      {group.events} events
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent-400" />
                      {group.members} members
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/event/${id}/chat`);
                    }}
                    className="mt-4 w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Chat
                  </button>
                </div>
              ))}
            </div>

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
                    onKeyPress={(e) => e.key === 'Enter' && handleAddContact()}
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

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
}

export default HostInterfaceEnhanced;
