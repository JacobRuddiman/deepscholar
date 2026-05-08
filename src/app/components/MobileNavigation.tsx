// app/components/MobileNavigation.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSwipe } from "@/hooks/useTouchGestures";
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
  const menuDrawerRef = useSwipe<HTMLDivElement>({
    minDistance: 60,
    onSwipeLeft: () => setIsMenuOpen(false),
  });
  const menuOverlayRef = useSwipe<HTMLDivElement>({
    minDistance: 60,
    onSwipeLeft: () => setIsMenuOpen(false),
  });
  const menuEdgeRef = useSwipe<HTMLDivElement>({
    minDistance: 60,
    onSwipeRight: () => setIsMenuOpen(true),
  });

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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

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

      {!isMenuOpen && (
        <div
          ref={menuEdgeRef}
          className="fixed top-14 bottom-16 left-0 z-20 w-5 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          ref={menuOverlayRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        ref={menuDrawerRef}
        className={`fixed top-14 left-0 bottom-0 w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      >
        <nav aria-label="Main navigation" className="p-4 space-y-2">
          {!isHomePage && (
            <Link
              href="/"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              aria-current={pathname === '/' ? 'page' : undefined}
            >
              <BiHome size={24} className="text-gray-600" />
              <span className="text-gray-800">Home</span>
            </Link>
          )}

          <Link
            href="/brief_upload"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            aria-current={pathname === '/brief_upload' ? 'page' : undefined}
          >
            <BiUpload size={24} className="text-gray-600" />
            <span className="text-gray-800">Upload Brief</span>
          </Link>

          <Link
            href="/my-briefs"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            aria-current={pathname === '/my-briefs' ? 'page' : undefined}
          >
            <BiFile size={24} className="text-gray-600" />
            <span className="text-gray-800">My Briefs</span>
          </Link>

          <Link
            href="/users"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            aria-current={pathname === '/users' ? 'page' : undefined}
          >
            <FiUsers size={24} className="text-gray-600" />
            <span className="text-gray-800">Users</span>
          </Link>

          <div className="border-t border-gray-200 my-4"></div>

          <Link
            href="/profile"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            aria-current={pathname === '/profile' ? 'page' : undefined}
          >
            <BiUser size={24} className="text-gray-600" />
            <span className="text-gray-800">Profile</span>
          </Link>

          <Link
            href="/tokens"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            aria-current={pathname === '/tokens' ? 'page' : undefined}
          >
            <RiCoinLine size={24} className="text-gray-600" />
            <span className="text-gray-800">Tokens ({tokens} ₮)</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            aria-current={pathname === '/settings' ? 'page' : undefined}
          >
            <BiCog size={24} className="text-gray-600" />
            <span className="text-gray-800">Settings</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <nav aria-label="Quick navigation" className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden">
        <div className="grid grid-cols-4 h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === '/' || pathname === '/home' ? 'text-blue-600' : 'text-gray-600'
            }`}
            aria-current={pathname === '/' || pathname === '/home' ? 'page' : undefined}
          >
            <BiHome size={20} />
            <span className="text-xs">Home</span>
          </Link>

          <Link
            href="/briefs"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === '/briefs' ? 'text-blue-600' : 'text-gray-600'
            }`}
            aria-current={pathname === '/briefs' ? 'page' : undefined}
          >
            <BiFile size={20} />
            <span className="text-xs">Browse</span>
          </Link>

          <Link
            href="/brief_upload"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === '/brief_upload' ? 'text-blue-600' : 'text-gray-600'
            }`}
            aria-current={pathname === '/brief_upload' ? 'page' : undefined}
          >
            <BiUpload size={20} />
            <span className="text-xs">Upload</span>
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center space-y-1 ${
              pathname === '/profile' ? 'text-blue-600' : 'text-gray-600'
            }`}
            aria-current={pathname === '/profile' ? 'page' : undefined}
          >
            <BiUser size={20} />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
