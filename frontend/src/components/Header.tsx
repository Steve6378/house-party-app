import React from 'react';
import { BellIcon, UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
const Header: React.FC = () => {
  const {
    user,
    logout
  } = useAuth();
  return <header className="bg-white border-b border-gray-200 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">Yorru</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <BellIcon className="h-5 w-5 text-gray-500" />
          </button>
          <div className="relative">
            <button className="flex items-center space-x-2 focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="hidden md:inline-block font-medium text-sm text-gray-700">
                {user?.name}
              </span>
            </button>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
            Logout
          </button>
        </div>
      </div>
    </header>;
};
export default Header;