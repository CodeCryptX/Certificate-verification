import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import UserMenu from './UserMenu';
import { Shield, Scroll, CheckCircle } from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  roles: string[];
  icon: React.ReactNode;
};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Define the navigation items based on available roles
  const navItems: NavItem[] = [
    { 
      name: 'Dashboard', 
      href: '/', 
      roles: ['student', 'university', 'employer', 'admin'],
      icon: <Shield className="h-4 w-4 mr-1" />
    },
    { 
      name: 'Certificates', 
      href: '/certificates', 
      roles: ['student', 'university', 'admin'],
      icon: <Scroll className="h-4 w-4 mr-1" />
    },
    { 
      name: 'Verification', 
      href: '/verification', 
      roles: ['student', 'university', 'employer', 'admin'],
      icon: <CheckCircle className="h-4 w-4 mr-1" />
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <header className="bg-white border-b border-secondary-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <svg 
                className="h-8 w-8 text-primary" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="ml-2 text-xl font-semibold text-primary">CertChain</span>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {filteredNavItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    location === item.href
                      ? 'border-primary-500 text-secondary-900'
                      : 'border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.icon}
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          
          {/* User menu (desktop) */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <UserMenu />
          </div>
          
          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {filteredNavItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`${
                location === item.href
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              {item.name}
            </a>
          ))}
        </div>
        
        {/* Mobile user menu */}
        {user && (
          <div className="pt-4 pb-3 border-t border-secondary-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-secondary-800">{user.name}</div>
                <div className="text-sm font-medium text-secondary-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <a
                href="#"
                className="block px-4 py-2 text-base font-medium text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100"
              >
                Your Profile
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-base font-medium text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100"
              >
                Settings
              </a>
              <button
                onClick={() => {
                  setIsOpen(false);
                  logoutMutation.mutate();
                }}
                className="w-full text-left block px-4 py-2 text-base font-medium text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
