import React from 'react';
import { BellIcon, UserIcon, LogOutIcon, SearchIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <header className="bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 z-10 relative">
      {/* Subtle gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search events, photos..."
              className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-700 rounded-xl text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl bg-dark-800/50 border border-dark-700 text-dark-400 hover:text-primary-400 hover:border-primary-500/50 transition-all">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-dark-700/50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary-500/20">
              {getInitials(user?.name || '')}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-dark-100">{user?.name}</p>
              <p className="text-xs text-dark-500">{user?.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-dark-800/50 border border-dark-700 text-dark-400 hover:text-red-400 hover:border-red-500/50 transition-all"
            title="Logout"
          >
            <LogOutIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
