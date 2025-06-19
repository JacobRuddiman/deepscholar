'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 2000,
  position = 'top',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + scrollX + rect.width / 2;
        y = rect.top + scrollY - 8;
        break;
      case 'bottom':
        x = rect.left + scrollX + rect.width / 2;
        y = rect.bottom + scrollY + 8;
        break;
      case 'left':
        x = rect.left + scrollX - 8;
        y = rect.top + scrollY + rect.height / 2;
        break;
      case 'right':
        x = rect.right + scrollX + 8;
        y = rect.top + scrollY + rect.height / 2;
        break;
    }

    return { x, y };
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;

    const element = event.currentTarget;
    elementRef.current = element;

    timeoutRef.current = setTimeout(() => {
      const pos = calculatePosition(element);
      setTooltipPosition(pos);
      setIsVisible(true);
    }, delay);

    // Call original onMouseEnter if it exists
    if (children.props.onMouseEnter) {
      children.props.onMouseEnter(event);
    }
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);

    // Call original onMouseLeave if it exists
    if (children.props.onMouseLeave) {
      children.props.onMouseLeave(event);
    }
  };

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-[9999] px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none max-w-xs break-words';
    
    switch (position) {
      case 'top':
        return `${baseClasses} transform -translate-x-1/2 -translate-y-full`;
      case 'bottom':
        return `${baseClasses} transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} transform -translate-x-full -translate-y-1/2`;
      case 'right':
        return `${baseClasses} transform -translate-y-1/2`;
      default:
        return baseClasses;
    }
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
    
    switch (position) {
      case 'top':
        return `${baseClasses} left-1/2 -translate-x-1/2 -bottom-1`;
      case 'bottom':
        return `${baseClasses} left-1/2 -translate-x-1/2 -top-1`;
      case 'left':
        return `${baseClasses} top-1/2 -translate-y-1/2 -right-1`;
      case 'right':
        return `${baseClasses} top-1/2 -translate-y-1/2 -left-1`;
      default:
        return baseClasses;
    }
  };

  // Clone the child element and add event handlers
  const clonedChild = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  });

  return (
    <>
      {clonedChild}
      {isVisible && typeof window !== 'undefined' && createPortal(
        <div
          className={getTooltipClasses()}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
