'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TooltipSettings {
  enabled: boolean;
  delay: number;
}

interface TooltipContextType {
  settings: TooltipSettings;
  updateSettings: (settings: Partial<TooltipSettings>) => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const useTooltipSettings = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltipSettings must be used within a TooltipProvider');
  }
  return context;
};

interface TooltipProviderProps {
  children: React.ReactNode;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<TooltipSettings>({
    enabled: true,
    delay: 2000,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tooltipSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse tooltip settings:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<TooltipSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('tooltipSettings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <TooltipContext.Provider value={{ settings, updateSettings }}>
      {children}
    </TooltipContext.Provider>
  );
};
