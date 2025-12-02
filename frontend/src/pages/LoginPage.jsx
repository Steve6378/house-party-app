import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Calendar, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../utils/api.ts';
import logo from '../assets/logo.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      // FastAPI returns: { access_token, token_type, user_id, email, name }
      login(
        { id: response.user_id, email: response.email, name: response.name },
        response.access_token
      );
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen glow-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={logo} alt="Yorru Logo" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Yorru Events</h1>
          <p className="text-primary-200">Your AI-powered event planning assistant</p>
        </div>

        <div className="glass-card shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 glass-input rounded-lg transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 glass-input rounded-lg transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-3 px-4 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="glass-card p-4">
            <Calendar className="w-6 h-6 text-accent-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300">Smart Planning</p>
          </div>
          <div className="glass-card p-4">
            <Sparkles className="w-6 h-6 text-secondary-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300">AI Assistant</p>
          </div>
          <div className="glass-card p-4">
            <Users className="w-6 h-6 text-primary-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300">Easy Invites</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
