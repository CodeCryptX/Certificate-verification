import { Twitter, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mt-8 border-t border-secondary-200 pt-6 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <a href="#" className="text-secondary-400 hover:text-secondary-500">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-secondary-400 hover:text-secondary-500">
              <span className="sr-only">GitHub</span>
              <Github className="h-6 w-6" />
            </a>
          </div>
          <p className="mt-8 text-base text-secondary-400 md:mt-0 md:order-1">
            &copy; {new Date().getFullYear()} CertChain. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
