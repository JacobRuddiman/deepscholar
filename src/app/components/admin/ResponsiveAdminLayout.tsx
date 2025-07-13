//ResponsiveAdminLayout.tsx
'use client';

import React from 'react';
import { useDeviceDetection } from '@/app/hooks/useDeviceDetection';
import MobileAdminNavigation from './MobileAdminNavigation';
import TabletAdminNavigation from './TabletAdminNavigation';
import Sidebar from './Sidebar';

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveAdminLayout({ children }: ResponsiveAdminLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();


  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileAdminNavigation />
        <main className="pt-20 pb-24 px-4">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="min-h-screen bg-white">
        <TabletAdminNavigation />
        <main className="ml-80 pt-20">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Desktop - use existing sidebar
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
