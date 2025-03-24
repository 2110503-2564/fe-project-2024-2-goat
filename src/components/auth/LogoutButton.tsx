'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setShowConfirm(false);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-700"
        disabled={isLoggingOut}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>

      {showConfirm && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="p-4">
            <p className="text-sm text-gray-700 mb-3">Are you sure you want to logout?</p>
            <div className="flex space-x-2">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-black text-white px-3 py-1 rounded text-xs font-medium disabled:bg-gray-400"
              >
                {isLoggingOut ? 'Logging out...' : 'Yes, Logout'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs font-medium disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 