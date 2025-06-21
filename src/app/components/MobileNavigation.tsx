// app/components/MobileNavigation.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BiUpload, 
  BiFile, 
  BiUser,
  BiCog,
  BiMenu,
  BiX,
  BiHome
} from "react-icons/bi";
import { FiUsers } from "react-icons/fi";
import { RiCoinLine } from "react-icons/ri";
import { getUserTokenBalance } from "@/server/actions/tokens";

export default function MobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tokens, setTokens] = useState(0);
  const pathname = usePathname();
  const isHomePage = pathname === "/" || pathname === "/home";

  useEffect(() => {
    const loadTokenBalance = async () => {
      try {
        const result = await getUserTokenBalance();
        if (result.success) {
          setTokens(result.balance);
        }
      } catch (error) {
        console.error('Failed to load token balance:', error);
      }
    };

    void loadTokenBalance();
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-700 h-14 z-40 flex items-center justify-between px-4 shadow-lg">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white p-2"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <BiX size={24} /> : <BiMenu size={24} />}
        </button>
        
        <Link href="/" className="text-white font-semibold text-lg">
          Deep Scholar
        </Link>
        
        <div className="flex items-center space-x-2 text-white">
          <RiCoinLine size={20} />
          <span className="text-sm font-medium">{tokens}</span>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-14 left-0 bottom-0 w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <nav className="p-4 space-y-2">
          {!isHomePage && (
            <Link 
              href="/"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <BiHome size={24} className="text-gray-600" />
              <span className="text-gray-800">Home</span>
            </Link>
          )}
          
          <Link 
            href="/brief_upload"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BiUpload size={24} className="text-gray-600" />
            <span className="text-gray-800">Upload Brief</span>
          </Link>
          
          <Link 
            href="/my-briefs"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BiFile size={24} className="text-gray-600" />
            <span className="text-gray-800">My Briefs</span>
          </Link>
          
          <Link 
            href="/users"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiUsers size={24} className="text-gray-600" />
            <span className="text-gray-800">Users</span>
          </Link>
          
          <div className="border-t border-gray-200 my-4"></div>
          
          <Link 
            href="/profile"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BiUser size={24} className="text-gray-600" />
            <span className="text-gray-800">Profile</span>
          </Link>
          
          <Link 
            href="/tokens"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RiCoinLine size={24} className="text-gray-600" />
            <span className="text-gray-800">Tokens ({tokens} ₮)</span>
          </Link>
          
          <Link 
            href="/settings"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BiCog size={24} className="text-gray-600" />
            <span className="text-gray-800">Settings</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden">
        <div className="grid grid-cols-4 h-16">
          <Link 
            href="/"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === '/' || pathname === '/home' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <BiHome size={20} />
            <span className="text-xs">Home</span>
          </Link>
          
          <Link 
            href="/briefs"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === '/briefs' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <BiFile size={20} />
            <span className="text-xs">Browse</span>
          </Link>
          
          <Link 
            href="/brief_upload"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === '/brief_upload' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <BiUpload size={20} />
            <span className="text-xs">Upload</span>
          </Link>
          
          <Link 
            href="/profile"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === '/profile' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <BiUser size={20} />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </>
  );
}