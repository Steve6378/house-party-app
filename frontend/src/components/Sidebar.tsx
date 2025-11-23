import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, CalendarIcon, MessageCircleIcon, SettingsIcon, ImageIcon } from 'lucide-react';
const Sidebar: React.FC = () => {
  return <aside className="hidden md:flex md:flex-col w-64 bg-[#131515] text-white">
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <span className="text-xl font-bold">Yorru</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          <li>
            <NavLink to="/" className={({
            isActive
          }) => `flex items-center px-6 py-3 text-sm ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <HomeIcon className="h-5 w-5 mr-3" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/events" className={({
            isActive
          }) => `flex items-center px-6 py-3 text-sm ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <CalendarIcon className="h-5 w-5 mr-3" />
              Events
            </NavLink>
          </li>
          <li>
            <NavLink to="/chat" className={({
            isActive
          }) => `flex items-center px-6 py-3 text-sm ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <MessageCircleIcon className="h-5 w-5 mr-3" />
              Chat
            </NavLink>
          </li>
          <li>
            <NavLink to="/photos" className={({
            isActive
          }) => `flex items-center px-6 py-3 text-sm ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <ImageIcon className="h-5 w-5 mr-3" />
              Photos
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({
            isActive
          }) => `flex items-center px-6 py-3 text-sm ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <SettingsIcon className="h-5 w-5 mr-3" />
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>;
};
export default Sidebar;