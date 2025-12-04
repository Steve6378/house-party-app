import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './stores/authStore';
import SplashScreen from './components/SplashScreen';
import { initNative, isNative, onNetworkChange } from './utils/native';
import { toast } from 'sonner';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import JoinEventPage from './pages/JoinEventPage';
import EventPage from './pages/EventPage';
import CalendarPage from './pages/CalendarPage';
import HostInterfaceEnhanced from './pages/HostInterfaceEnhanced';
import GuestInterfaceEnhanced from './pages/GuestInterfaceEnhanced';
import GroupsPage from './pages/GroupsPage';
import GroupChatWorking from './pages/GroupChatWorking';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import InvitePage from './pages/InvitePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  // Initialize native platform features
  useEffect(() => {
    initNative();

    // Show toast when network status changes (mobile)
    if (isNative) {
      const listener = onNetworkChange((connected) => {
        if (!connected) {
          toast.error('No internet connection');
        } else {
          toast.success('Back online');
        }
      });
      return () => { listener.then(l => l.remove()); };
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProtectedRoute>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id/edit"
            element={
              <ProtectedRoute>
                <EditEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join-event"
            element={
              <ProtectedRoute>
                <JoinEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id"
            element={
              <ProtectedRoute>
                <EventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id/host"
            element={
              <ProtectedRoute>
                <HostInterfaceEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id/guest"
            element={
              <ProtectedRoute>
                <GuestInterfaceEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path="/event/:id/chat"
            element={
              <ProtectedRoute>
                <GroupChatWorking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group/:groupId/channel/:channelId"
            element={
              <ProtectedRoute>
                <GroupChatWorking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}