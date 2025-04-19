import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <div className="ml-3 relative">
      <div>
        <button
          type="button"
          className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="sr-only">Open user menu</span>
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
            {user.name.charAt(0)}
          </div>
        </button>
      </div>

      {/* User dropdown menu */}
      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
        >
          <a
            href="#"
            className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
          >
            Your Profile
          </a>
          <a
            href="#"
            className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
          >
            Settings
          </a>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full text-left block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
