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
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [loading, setLoading] = useState(true);

  // Example Discord-style structure
  // Group: Sorority
  //   - Events
  //     - Kitty Party
  //     - Tailgate USC vs Iowa
  //   - General Chat
  const mockGroups = [
    {
      id: 'group-1',
      name: 'Sorority',
      description: 'USC Sorority Events & Activities',
      member_count: 45,
      events: [
        {
          id: 'event-1',
          name: 'Kitty Party',
          date: '2025-12-15',
          time: '18:00',
          address: 'Sorority House'
        },
        {
          id: 'event-2',
          name: 'Tailgate USC vs Iowa',
          date: '2025-11-28',
          time: '10:00',
          address: 'USC Stadium Parking Lot'
        }
      ],
      channels: [
        { id: 'ch-1', name: 'general', type: 'text' },
        { id: 'ch-2', name: 'events', type: 'text' },
        { id: 'ch-3', name: 'photos', type: 'text' }
      ]
    },
    {
      id: 'group-2',
      name: 'Study Group',
      description: 'CS 101 Study Sessions',
      member_count: 12,
      events: [
        {
          id: 'event-3',
          name: 'Midterm Prep',
          date: '2025-12-01',
          time: '14:00',
          address: 'Leavey Library Room 202'
        }
      ],
      channels: [
        { id: 'ch-4', name: 'general', type: 'text' },
        { id: 'ch-5', name: 'resources', type: 'text' }
      ]
    },
    {
      id: 'group-3',
      name: 'Friends',
      description: 'Close Friends Hangouts',
      member_count: 8,
      events: [
        {
          id: 'event-4',
          name: 'Game Night',
          date: '2025-11-30',
          time: '19:00',
          address: 'Jake\'s Apartment'
        }
      ],
      channels: [
        { id: 'ch-6', name: 'general', type: 'text' }
      ]
    }
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      // Fetch from backend - using mock data for now
      setTimeout(() => {
        setGroups(mockGroups);
        if (mockGroups.length > 0) {
          setSelectedGroup(mockGroups[0]);
          setExpandedGroups({ [mockGroups[0].id]: true });
        }
        setLoading(false);
      }, 500);
    } catch (error) {
      toast.error('Failed to load groups');
      setLoading(false);
    }
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
                onClick={() => toast.info('Create group feature coming soon!')}
                className="p-1 hover:bg-dark-700 rounded transition"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-1">
              {groups.map((group) => (
                <div key={group.id} className="mb-2">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
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
                      <span className="font-semibold text-sm">{group.name}</span>
                    </div>
                  </button>

                  {/* Expanded Group Content */}
                  {expandedGroups[group.id] && (
                    <div className="ml-6 mt-1 space-y-1">
                      {/* Channels */}
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                          Channels
                        </div>
                        {group.channels.map((channel) => (
                          <button
                            key={channel.id}
                            onClick={() => navigate(`/group/${group.id}/channel/${channel.id}`)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-dark-700/50 hover:text-white rounded transition"
                          >
                            <Hash className="w-4 h-4" />
                            {channel.name}
                          </button>
                        ))}
                      </div>

                      {/* Events */}
                      <div>
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
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                    <p className="text-gray-400 text-sm mt-1">{selectedGroup.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Members</p>
                      <p className="text-lg font-semibold text-white">{selectedGroup.member_count}</p>
                    </div>
                    <button className="p-2 hover:bg-dark-700 rounded-lg transition">
                      <Settings className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Events Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-accent-400" />
                      Upcoming Events
                    </h2>
                    <button
                      onClick={() => navigate('/create-event')}
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      Create Event
                    </button>
                  </div>

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

                {/* Channels Section */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-accent-400" />
                    Channels
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedGroup.channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => navigate(`/group/${selectedGroup.id}/channel/${channel.id}`)}
                        className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/20 rounded-xl p-6 hover:border-primary-500/40 transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-600/20 p-3 rounded-lg">
                            <Hash className="w-6 h-6 text-accent-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">#{channel.name}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {channel.name === 'general' ? 'General discussion' :
                               channel.name === 'events' ? 'Event planning & coordination' :
                               channel.name === 'photos' ? 'Share photos & memories' :
                               channel.name === 'resources' ? 'Study materials & resources' :
                               'Group channel'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Select a group to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupsPage;
