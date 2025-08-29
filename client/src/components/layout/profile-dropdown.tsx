import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { User, Settings, HelpCircle, LogOut } from "lucide-react";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white">
          {/* User initials or avatar */}
          <span>MC</span>
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium text-white">Musharof Chowdhury</p>
          <p className="text-xs text-gray-400">randomuser@pimjo.com</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-sm font-medium text-white">Musharof Chowdhury</p>
            <p className="text-xs text-gray-400">randomuser@pimjo.com</p>
          </div>
          
          <Link href="/profile">
            <a className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 flex items-center">
              <User className="w-5 h-5 mr-3" />
              Edit profile
            </a>
          </Link>
          
          <Link href="/settings">
            <a className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 flex items-center">
              <Settings className="w-5 h-5 mr-3" />
              Account settings
            </a>
          </Link>
          
          <Link href="/support">
            <a className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 flex items-center">
              <HelpCircle className="w-5 h-5 mr-3" />
              Support
            </a>
          </Link>
          
          <div className="border-t border-gray-700 mt-1">
            <button 
              className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              onClick={() => console.log("Logging out...")}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 