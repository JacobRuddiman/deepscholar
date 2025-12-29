'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSwipe } from '@/hooks/useTouchGestures';
import { useSession } from 'next-auth/react';

/**
 * Mobile navigation component with bottom tab bar and hamburger menu
 */
export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Swipe to close menu
  const menuRef = useSwipe({
    onSwipeLeft: () => setIsMenuOpen(false),
  });

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: '/explore',
      label: 'Explore',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      href: '/briefs',
      label: 'Briefs',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      ),
    },
    {
      href: session ? '/dashboard' : '/auth/signin',
      label: session ? 'Dashboard' : 'Sign In',
      icon: session ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800
                   border-t border-gray-200 dark:border-gray-700 safe-area-bottom"
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full
                           transition-colors ${
                             isActive
                               ? 'text-blue-600 dark:text-blue-400'
                               : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                           }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Hamburger Menu Button (Mobile Only) */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800
                 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
                 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Menu */}
      <div
        ref={menuRef}
        className={`md:hidden fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white dark:bg-gray-800
                   shadow-xl z-50 transform transition-transform duration-300 ease-in-out
                   ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900
                     dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                     transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-5rem)]">
          <MobileMenuItem href="/" icon="🏠">
            Home
          </MobileMenuItem>
          <MobileMenuItem href="/explore" icon="🔍">
            Explore
          </MobileMenuItem>
          <MobileMenuItem href="/briefs" icon="📄">
            Briefs
          </MobileMenuItem>

          {session ? (
            <>
              <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
              <MobileMenuItem href="/dashboard" icon="📊">
                Dashboard
              </MobileMenuItem>
              <MobileMenuItem href="/dashboard/drafts" icon="✏️">
                My Drafts
              </MobileMenuItem>
              <MobileMenuItem href="/dashboard/saved" icon="🔖">
                Saved Briefs
              </MobileMenuItem>
              <MobileMenuItem href="/dashboard/settings" icon="⚙️">
                Settings
              </MobileMenuItem>
            </>
          ) : (
            <>
              <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
              <MobileMenuItem href="/auth/signin" icon="🔐">
                Sign In
              </MobileMenuItem>
            </>
          )}

          <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
          <MobileMenuItem href="/faq" icon="❓">
            FAQ
          </MobileMenuItem>
          <MobileMenuItem href="/privacy" icon="🔒">
            Privacy Policy
          </MobileMenuItem>
          <MobileMenuItem href="/terms" icon="📜">
            Terms of Service
          </MobileMenuItem>
        </nav>
      </div>
    </>
  );
}

function MobileMenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                 ${
                   isActive
                     ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                     : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                 }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}

/**
 * Safe area helper for notched devices
 */
export function SafeAreaView({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`safe-area-top safe-area-bottom ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {children}
    </div>
  );
}
