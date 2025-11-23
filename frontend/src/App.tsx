import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Chat from './pages/Chat';
import ChatSelector from './pages/ChatSelector';
import ChatOptions from './pages/ChatOptions';
import HostInterface from './pages/HostInterface';
import GroupChat from './pages/GroupChat';
import GuestInterface from './pages/GuestInterface';
import CreateEvent from './pages/CreateEvent';
import Photos from './pages/Photos';
import NotFound from './pages/NotFound';
// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
export function App() {
  return <AuthProvider>
      <EventProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/new" element={<CreateEvent />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/chat" element={<ChatSelector />} />
                <Route path="/chat/:id/options" element={<ChatOptions />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/host/:id" element={<HostInterface />} />
                <Route path="/group/:id" element={<GroupChat />} />
                <Route path="/guest/:id" element={<GuestInterface />} />
                <Route path="/photos" element={<Photos />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </EventProvider>
    </AuthProvider>;
}