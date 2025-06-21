// app/hooks/useDeviceDetection.ts
"use client";

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  width: number;
  height: number;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Check for iOS
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      
      // Check for Android
      const isAndroid = /android/i.test(userAgent);
      
      // Determine device type based on width
      const isMobile = width < 768 || isIOS || isAndroid;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setDeviceInfo({
        isMobile: isMobile && !isTablet,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        width,
        height,
      });
    };

    // Initial check
    checkDevice();

    // Add resize listener
    window.addEventListener('resize', checkDevice);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceInfo;
}

// Simplified hook for just mobile detection
export function useIsMobile(): boolean {
  const { isMobile } = useDeviceDetection();
  return isMobile;
}