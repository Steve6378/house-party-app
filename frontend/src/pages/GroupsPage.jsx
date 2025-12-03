import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Clock,
  MapPin,
  X,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { groupsAPI } from '../utils/api.ts';

function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await groupsAPI.list();
      const groupsList = data.groups || data || [];
      setGroups(groupsList);
      if (groupsList.length > 0) {
        setSelectedGroup(groupsList[0]);
        setExpandedGroups({ [groupsList[0].id]: true });
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      const newGroup = await groupsAPI.create({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        is_private: false
      });
      toast.success(`Group "${newGroupName}" created!`);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      // Refresh groups list
      fetchGroups();
      // Select the new group
      setSelectedGroup(newGroup);
      setExpandedGroups(prev => ({ ...prev, [newGroup.id]: true }));
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(error.response?.data?.detail || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!selectedGroup) return;

    try {
      // Call the invite link API (assuming it exists)
      const response = await fetch(`/api/groups/${selectedGroup.id}/invite-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ max_uses: null, expires_in_days: 7 })
      });

      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.invite_url || `${window.location.origin}/invite/${data.token}`);
        setShowInviteModal(true);
      } else {
        // Fallback: generate a simple invite URL
        const inviteUrl = `${window.location.origin}/groups/${selectedGroup.id}/join`;
        setInviteLink(inviteUrl);
        setShowInviteModal(true);
      }
    } catch (error) {
      // Fallback: generate a simple invite URL
      const inviteUrl = `${window.location.origin}/groups/${selectedGroup.id}/join`;
      setInviteLink(inviteUrl);
      setShowInviteModal(true);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const selectGroup = (group) => {
    setSelectedGroup(group);
    setExpandedGroups(prev => ({ ...prev, [group.id]: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-400 mx-auto"></div>
          <p className="mt-4 text-primary-200">Loading groups...</p>
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

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar - Discord Style */}
        <div className="w-64 bg-dark-800/50 backdrop-blur-xl border-r border-primary-500/20 flex flex-col">
          {/* Groups List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">My Groups</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1.5 hover:bg-dark-700 rounded transition"
                title="Create new group"
              >
                <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">No groups yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold"
                >
                  Create Group
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {groups.map((group) => (
                  <div key={group.id} className="mb-2">
                    {/* Group Header */}
                    <button
                      onClick={() => {
                        selectGroup(group);
                        toggleGroup(group.id);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition ${
                        selectedGroup?.id === group.id
                          ? 'bg-primary-600/20 text-white'
                          : 'text-gray-300 hover:bg-dark-700/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {expandedGroups[group.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <Users className="w-4 h-4" />
                        <span className="font-semibold text-sm truncate">{group.name}</span>
                      </div>
                    </button>

                    {/* Expanded Group Content */}
                    {expandedGroups[group.id] && (
                      <div className="ml-6 mt-1 space-y-1">
                        {/* General Chat */}
                        <button
                          onClick={() => navigate(`/group/${group.id}/chat`)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-white rounded transition"
                        >
                          <Hash className="w-4 h-4" />
                          general
                        </button>

                        {/* Events */}
                        {group.events && group.events.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                              Events
                            </div>
                            {group.events.map((event) => (
                              <button
                                key={event.id}
                                onClick={() => navigate(`/event/${event.id}/guest`)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-white rounded transition"
                              >
                                <Calendar className="w-4 h-4" />
                                <span className="truncate">{event.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <div className="bg-dark-800/50 backdrop-blur-xl border-b border-primary-500/20 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-accent-400" />
                      {selectedGroup.name}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">{selectedGroup.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGenerateInviteLink}
                      className="bg-dark-700/50 hover:bg-dark-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Invite Link
                    </button>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Members</p>
                      <p className="text-lg font-semibold text-white">{selectedGroup.member_count || 0}</p>
                    </div>
                    <button className="p-2 hover:bg-dark-700 rounded-lg transition">
                      <Settings className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Quick Actions */}
                <div className="mb-8">
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => navigate(`/group/${selectedGroup.id}/chat`)}
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 font-semibold"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Open Group Chat
                    </button>
                    <button
                      onClick={() => navigate('/create-event')}
                      className="bg-dark-700/50 hover:bg-dark-700 text-gray-300 hover:text-white px-6 py-3 rounded-lg transition flex items-center gap-2 border border-primary-500/20"
                    >
                      <Plus className="w-5 h-5" />
                      Create Event
                    </button>
                  </div>
                </div>

                {/* Events Section */}
                {selectedGroup.events && selectedGroup.events.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-accent-400" />
                      Upcoming Events
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedGroup.events.map((event) => (
                        <div
                          key={event.id}
                          className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-xl p-4 hover:border-primary-500/40 transition cursor-pointer"
                          onClick={() => navigate(`/event/${event.id}/guest`)}
                        >
                          <h3 className="text-lg font-bold text-white mb-3">{event.name}</h3>
                          <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-accent-400" />
                              {event.date}
                            </div>
                            {event.time && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-accent-400" />
                                {event.time}
                              </div>
                            )}
                            {event.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-accent-400" />
                                {event.address}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State for Events */}
                {(!selectedGroup.events || selectedGroup.events.length === 0) && (
                  <div className="text-center py-12 bg-dark-800/30 rounded-xl border border-primary-500/20">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No events in this group yet</p>
                    <button
                      onClick={() => navigate('/create-event')}
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold"
                    >
                      Create First Event
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Select a group or create a new one</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-primary-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Friends, Study Group, Team"
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What is this group about?"
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creating || !newGroupName.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Group
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-primary-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Invite to {selectedGroup?.name}</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Share this link with friends to invite them to your group.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white font-mono text-sm"
              />
              <button
                onClick={copyInviteLink}
                className="px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-lg transition flex items-center gap-2"
              >
                {copiedLink ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full mt-4 px-4 py-3 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupsPage;
