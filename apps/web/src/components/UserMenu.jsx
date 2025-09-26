import { useState } from 'react';
import { ChevronDown, User, Settings, LogOut, Eye, Star, Info, Search } from 'lucide-react';

export default function UserMenu({ 
  setShowOverviewPage, 
  setShowAboutPage, 
  setHasStartedChat, 
  setMessages 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="h-8 w-8 rounded-full border border-gray-200 bg-gray-100 grid place-items-center font-semibold text-sm">
          U
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-semibold">User</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">user@example.com</div>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 dark:text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-gray-200 bg-gray-100 grid place-items-center font-semibold">
                U
              </div>
              <div>
                <div className="text-sm font-semibold">User</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">user@example.com</div>
              </div>
            </div>
          </div>

          <div className="p-2">
            {/* Navigation Options */}
            <button 
              onClick={() => {
                setShowOverviewPage(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <Eye size={16} />
              Overview
            </button>
            <button 
              onClick={() => {
                setShowAboutPage(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <Star size={16} />
              Features
            </button>
            <button 
              onClick={() => {
                setShowAboutPage(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <Info size={16} />
              About
            </button>
            
            <hr className="my-2" />
            
            {/* User Options */}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
              <User size={16} />
              Profile
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
              <Settings size={16} />
              Settings
            </button>
            <hr className="my-2" />
            <button 
              onClick={() => {
                setHasStartedChat(false);
                setMessages([]);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
