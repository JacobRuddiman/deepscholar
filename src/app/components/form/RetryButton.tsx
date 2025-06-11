'use client';

import React, { useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

export interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  disabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  className?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function RetryButton({
  onRetry,
  disabled = false,
  maxRetries = 3,
  retryDelay = 1000,
  className = '',
  children = 'Retry',
  size = 'md',
  variant = 'secondary',
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const handleRetry = async () => {
    if (isRetrying || disabled || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setLastError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      await onRetry();
      setRetryCount(0); // Reset on success
    } catch (error) {
      console.error('Retry failed:', error);
      setRetryCount(prev => prev + 1);
      setLastError(error instanceof Error ? error.message : 'Retry failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const isMaxRetriesReached = retryCount >= maxRetries;
  const isDisabled = disabled || isRetrying || isMaxRetriesReached;

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleRetry}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center rounded-md font-medium transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${sizeClasses[size]}
          ${isDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : variantClasses[variant]
          }
          ${className}
        `}
      >
        <RefreshCw 
          className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} 
        />
        {isRetrying ? 'Retrying...' : children}
        {retryCount > 0 && !isRetrying && (
          <span className="ml-1 text-xs opacity-75">
            ({retryCount}/{maxRetries})
          </span>
        )}
      </button>

      {/* Retry status */}
      {retryCount > 0 && (
        <div className="mt-2 text-xs">
          {isMaxRetriesReached ? (
            <div className="flex items-center text-red-600">
              <AlertCircle className="mr-1 h-3 w-3" />
              Max retries reached
            </div>
          ) : (
            <div className="text-gray-500">
              Attempt {retryCount} of {maxRetries}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {lastError && (
        <div className="mt-1 text-xs text-red-600 max-w-xs">
          {lastError}
        </div>
      )}
    </div>
  );
}

// Hook for retry logic
export function useRetry(
  operation: () => Promise<void> | void,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    onMaxRetriesReached?: () => void;
  } = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    onMaxRetriesReached,
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const retry = async () => {
    if (isRetrying || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setLastError(null);

    try {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      await operation();
      
      // Success
      setRetryCount(0);
      setLastError(null);
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setLastError(err);
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount >= maxRetries) {
          onMaxRetriesReached?.();
        }
        return newCount;
      });
      onError?.(err);
    } finally {
      setIsRetrying(false);
    }
  };

  const reset = () => {
    setRetryCount(0);
    setLastError(null);
    setIsRetrying(false);
  };

  return {
    retry,
    reset,
    isRetrying,
    retryCount,
    lastError,
    isMaxRetriesReached: retryCount >= maxRetries,
    canRetry: !isRetrying && retryCount < maxRetries,
  };
}
