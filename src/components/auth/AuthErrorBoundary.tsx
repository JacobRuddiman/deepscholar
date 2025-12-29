'use client';

import { Component, ReactNode } from 'react';
import { signOut } from 'next-auth/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isAuthError: boolean;
}

/**
 * Error boundary specifically for authentication errors
 * Catches auth failures and provides appropriate fallback UI
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isAuthError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is an authentication error
    const isAuthError =
      error.message.includes('auth') ||
      error.message.includes('session') ||
      error.message.includes('unauthorized') ||
      error.message.includes('token');

    return {
      hasError: true,
      error,
      isAuthError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('[AuthErrorBoundary] Caught error:', error, errorInfo);

    // If it's an auth error, sign out the user
    if (this.state.isAuthError) {
      console.warn('[AuthErrorBoundary] Authentication error detected, signing out user');
      signOut({ redirect: true, callbackUrl: '/auth/signin?error=SessionExpired' });
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      if (this.state.isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Session Expired
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your session has expired. Please sign in again to continue.
              </p>
              <button
                onClick={() => signOut({ redirect: true, callbackUrl: '/auth/signin' })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
