'use client';

import { useEffect, useRef } from 'react';
import { useFocusTrap } from '@/hooks/useKeyboardNavigation';

interface ConfirmDialogProps {
  /**
   * Dialog visibility state
   */
  isOpen: boolean;
  /**
   * Callback to close the dialog
   */
  onClose: () => void;
  /**
   * Callback when user confirms
   */
  onConfirm: () => void;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog description/message
   */
  message: string;
  /**
   * Text for the confirm button
   */
  confirmLabel?: string;
  /**
   * Text for the cancel button
   */
  cancelLabel?: string;
  /**
   * Confirm button variant (danger for destructive actions)
   */
  variant?: 'default' | 'danger';
  /**
   * Whether to show loading state
   */
  isLoading?: boolean;
}

/**
 * Confirmation dialog for destructive or important actions
 * Implements proper accessibility with focus trap and ARIA labels
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus within dialog when open
  useFocusTrap(dialogRef, isOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
      >
        {/* Title */}
        <h2
          id="dialog-title"
          className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
        >
          {title}
        </h2>

        {/* Message */}
        <p
          id="dialog-description"
          className="text-gray-600 dark:text-gray-400 mb-6"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              // Don't auto-close - let the parent handle it after async operation
            }}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
            type="button"
            autoFocus
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing confirm dialog state
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = (): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setIsOpen(false);
  };

  return {
    isOpen,
    isLoading,
    setIsLoading,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

// Note: Add this import at the top of the file
import React from 'react';
