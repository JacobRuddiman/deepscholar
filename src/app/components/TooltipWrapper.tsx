'use client';

import React from 'react';
import Tooltip from './Tooltip';
import { useTooltipSettings } from './TooltipProvider';

interface TooltipWrapperProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const { settings } = useTooltipSettings();

  return (
    <Tooltip
      content={content}
      delay={settings.delay}
      position={position}
      disabled={!settings.enabled}
    >
      {children}
    </Tooltip>
  );
};

export default TooltipWrapper;
