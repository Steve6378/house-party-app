import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader,
  LogIn
} from 'lucide-react';
import { toast } from 'sonner';
import { inviteAPI } from '../utils/api.ts';

function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchInviteDetails();
  }, [token]);

  const fetchInviteDetails = async () => {
    try {
      const details = await inviteAPI.getDetails(token);
      setInviteDetails(details);
    } catch (error) {
      console.error('Failed to fetch invite details:', error);
      setInviteDetails({
        is_valid: false,
        message: 'Failed to load invite details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Store the invite token and redirect to login
      sessionStorage.setItem('pendingInvite', token);
      toast.info('Please log in to accept the invitation');
      navigate('/login');
      return;
    }

    setAccepting(true);
    try {
      const result = await inviteAPI.accept(token);
      toast.success(result.message || 'Successfully joined!');

      // Navigate to the appropriate page
      if (result.link_type === 'event') {
        navigate(`/event/${result.target_id}/guest`);
      } else if (result.link_type === 'group') {
        navigate('/groups');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to accept invite:', error);
      toast.error(error.response?.data?.detail || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-primary-200">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!inviteDetails?.is_valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center px-4">
        <div className="bg-dark-800/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-gray-400 mb-6">
            {inviteDetails?.message || 'This invitation link is no longer valid.'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 flex items-center justify-center px-4">
      <div className="bg-dark-800/50 backdrop-blur-xl border border-primary-500/30 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
          <p className="text-primary-200">
            {inviteDetails.host_name ? `${inviteDetails.host_name} has invited you to:` : 'You have been invited to:'}
          </p>
        </div>

        <div className="bg-dark-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{inviteDetails.target_name}</h2>

          <div className="space-y-3 text-gray-300">
            {inviteDetails.host_name && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-accent-400" />
                <span>Hosted by {inviteDetails.host_name}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>
                Join as {inviteDetails.role === 'cohost' ? 'Co-Host' : 'Attendee'}
              </span>
            </div>

            {inviteDetails.expires_at && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">
                  Expires: {new Date(inviteDetails.expires_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-4 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Accepting...
              </>
            ) : !isAuthenticated ? (
              <>
                <LogIn className="w-5 h-5" />
                Log in to Accept
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Accept Invitation
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-dark-700 hover:bg-dark-600 text-gray-300 py-3 rounded-xl font-semibold transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvitePage;
