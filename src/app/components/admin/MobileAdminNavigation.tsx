//MobileAdminNavigation
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Users, 
  FileText, 
  MessageSquare, 
  Bot, 
  Settings, 
  Home,
  Database,
  BarChart3,
  TrendingUp,
  Sparkles,
  Mail,
  BookMarked,
  ChevronRight,
  Bell,
  GripVertical,
  PanelLeft
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Briefs', href: '/admin/briefs', icon: FileText },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { name: 'AI Reviews', href: '/admin/ai-reviews', icon: Bot },
  { name: 'Models', href: '/admin/models', icon: Database },
  { name: 'Data Synthesis', href: '/admin/seeding', icon: Sparkles },
  { name: 'Email Builder', href: '/admin/emailbuilder', icon: Mail },
  { name: 'Recommendations', href: '/admin/recommendations', icon: BookMarked },
];

export default function MobileAdminNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(280);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [notifications] = useState(3);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  const MIN_WIDTH = 60;
  const MAX_WIDTH = 280;
  const COLLAPSE_THRESHOLD = 100;
  const TEXT_HIDE_THRESHOLD = 180;

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close menu and ensure button visibility when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsMinimized(true);
    setDrawerWidth(MIN_WIDTH);
  }, [pathname]);

  // Handle drag start
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
  };

  // Handle drag move
  const handleDragMove = (e: TouchEvent | MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    let newWidth = clientX;
    
    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
    if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
    
    requestAnimationFrame(() => {
      setDrawerWidth(newWidth);
      
      if (newWidth < COLLAPSE_THRESHOLD) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    
    if (drawerWidth < COLLAPSE_THRESHOLD) {
      setIsMinimized(true);
      setIsMenuOpen(false);
      setDrawerWidth(MIN_WIDTH);
    }
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
        handleDragMove(e);
        return false;
      };
      
      const handleGlobalEnd = () => {
        handleDragEnd();
        return false;
      };
      
      document.addEventListener('touchmove', handleGlobalMove, { passive: false });
      document.addEventListener('touchend', handleGlobalEnd, { passive: false });
      document.addEventListener('mousemove', handleGlobalMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalEnd, { passive: false });
      
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('touchmove', handleGlobalMove);
        document.removeEventListener('touchend', handleGlobalEnd);
        document.removeEventListener('mousemove', handleGlobalMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        
        document.body.style.overflow = '';
      };
    }
  }, [isDragging, drawerWidth]);

  // Get current page info
  const currentPage = navigation.find(item => item.href === pathname) ?? navigation[0];

  const showText = drawerWidth > TEXT_HIDE_THRESHOLD;

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Header - Always visible with high z-index */}
      <div className="fixed top-4 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100" style={{ zIndex: 999999 }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors relative"
            style={{ zIndex: 1000000 }}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="font-semibold text-gray-900 text-sm">{currentPage?.name}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bell size={18} className="text-gray-600" />
              {notifications > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{notifications}</span>
                </div>
              )}
            </div>
            <Settings size={18} className="text-gray-600" />
          </div>
        </div>
      </div>

      {/* Floating Admin Button Portal - Renders at the end of body */}
      {!isMenuOpen && (
        <div 
          className="fixed left-0 top-1/2 -translate-y-1/2" 
          style={{ 
            zIndex: 999998,
            isolation: 'isolate' // Creates a new stacking context
          }}
        >
          <button
            onClick={() => {
              setIsMinimized(false);
              setIsMenuOpen(true);
              setDrawerWidth(280);
            }}
            className="bg-blue-600 text-white pl-3 pr-4 py-4 rounded-r-xl shadow-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
            style={{ position: 'relative', zIndex: 999998 }}
            aria-label="Open admin menu"
          >
            <PanelLeft size={20} className="mr-2" />
            <span className="font-medium">Admin</span>
          </button>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20"
          style={{ zIndex: 999995 }}
          onClick={() => !isDragging && setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div 
        ref={drawerRef}
        className="fixed top-0 left-0 h-full bg-white shadow-xl transform transition-all duration-300 will-change-transform"
        style={{ 
          width: `${drawerWidth}px`,
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          zIndex: 999996
        }}
      >
        {/* Drag Handle */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-24 bg-gray-200 rounded-l-lg cursor-ew-resize flex items-center justify-center hover:bg-gray-300 transition-colors touch-none"
          style={{ zIndex: 999997 }}
          onTouchStart={handleDragStart}
          onMouseDown={handleDragStart}
        >
          <GripVertical size={16} className="text-gray-600" />
        </div>
        
        {/* Header */}
        <div className="pt-16 px-4 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            {showText && (
              <div>
                <h2 className="font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">DeepScholar</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Items */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center ${showText ? 'justify-between' : 'justify-center'} p-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50 border border-blue-100'
                    : 'hover:bg-gray-50'
                  }
                `}
                title={!showText ? item.name : undefined}
              >
                <div className={`flex items-center ${showText ? 'space-x-3' : ''}`}>
                  <div className={`${showText ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    <item.icon
                      className={`${showText ? 'w-4 h-4' : 'w-5 h-5'} ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`}
                    />
                  </div>
                  {showText && (
                    <span className={`font-medium ${
                      isActive ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {item.name}
                    </span>
                  )}
                </div>
                {showText && (
                  <ChevronRight className={`w-4 h-4 transition-transform ${
                    isActive ? 'text-blue-500 rotate-90' : 'text-gray-400 group-hover:translate-x-1'
                  }`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {showText && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <Link
              href="/"
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-gray-600" />
              </div>
              <span className="font-medium text-gray-700">Back to Site</span>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Quick Actions */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-100" style={{ zIndex: 999990 }}>
        <div className="grid grid-cols-4 gap-1 p-2">
          <Link 
            href="/admin"
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${
              pathname === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={18} />
            <span className="text-xs font-medium mt-1">Dashboard</span>
          </Link>
          
          <Link 
            href="/admin/users"
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${
              pathname === '/admin/users' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={18} />
            <span className="text-xs font-medium mt-1">Users</span>
          </Link>
          
          <Link 
            href="/admin/briefs"
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${
              pathname === '/admin/briefs' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={18} />
            <span className="text-xs font-medium mt-1">Briefs</span>
          </Link>
          
          <Link 
            href="/admin/analytics"
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${
              pathname === '/admin/analytics' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp size={18} />
            <span className="text-xs font-medium mt-1">Analytics</span>
          </Link>
        </div>
      </div>
    </>
  );
}