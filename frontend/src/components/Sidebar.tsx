import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  MessageCircleIcon,
  SettingsIcon,
  ImageIcon,
  SparklesIcon,
  PlusIcon
} from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-secondary-500/5 pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center justify-center h-16 border-b border-dark-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            Yorru
          </span>
        </div>
      </div>

      {/* Create Event Button */}
      <div className="relative px-4 py-4">
        <NavLink
          to="/create-event"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium hover:from-primary-500 hover:to-secondary-500 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
        >
          <PlusIcon className="h-5 w-5" />
          Create Event
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto py-2 px-3">
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-800/50 hover:text-dark-100'
                }`
              }
            >
              <HomeIcon className="h-5 w-5 mr-3" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-800/50 hover:text-dark-100'
                }`
              }
            >
              <CalendarIcon className="h-5 w-5 mr-3" />
              Events
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-800/50 hover:text-dark-100'
                }`
              }
            >
              <MessageCircleIcon className="h-5 w-5 mr-3" />
              Chat
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/photos"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-800/50 hover:text-dark-100'
                }`
              }
            >
              <ImageIcon className="h-5 w-5 mr-3" />
              Photos
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-800/50 hover:text-dark-100'
                }`
              }
            >
              <SettingsIcon className="h-5 w-5 mr-3" />
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom decoration */}
      <div className="relative p-4 border-t border-dark-700/50">
        <div className="text-xs text-dark-500 text-center">
          Powered by AI
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
