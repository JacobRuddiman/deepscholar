/**
 * Error Monitoring Service
 *
 * Provides a centralized interface for error tracking and monitoring.
 * This module can be easily integrated with external services like:
 * - Sentry (https://sentry.io)
 * - LogRocket (https://logrocket.com)
 * - Rollbar (https://rollbar.com)
 * - Bugsnag (https://bugsnag.com)
 */

import { logger } from './logger';

export interface ErrorContext {
  userId?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export interface ErrorSeverity {
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

class ErrorMonitoringService {
  private isInitialized = false;
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Initialize the error monitoring service
   * Call this once at application startup
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize external service (e.g., Sentry)
      // Example for Sentry:
      // if (this.isProduction) {
      //   Sentry.init({
      //     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      //     environment: process.env.NODE_ENV,
      //     tracesSampleRate: 1.0,
      //   });
      // }

      this.isInitialized = true;
      logger.info('Error monitoring service initialized');
    } catch (error) {
      logger.error('Failed to initialize error monitoring service', error);
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext) {
    try {
      // Log locally
      logger.error('Exception captured', error, context);

      // Send to external service in production
      if (this.isProduction) {
        this.sendToExternalService(error, 'error', context);
      }
    } catch (e) {
      // Fail silently to avoid breaking the application
      console.error('Failed to capture exception:', e);
    }
  }

  /**
   * Capture a message (non-error events)
   */
  captureMessage(message: string, severity: ErrorSeverity['level'] = 'info', context?: ErrorContext) {
    try {
      // Log locally
      logger.info(`Message captured: ${message}`, context);

      // Send to external service in production
      if (this.isProduction) {
        this.sendMessageToExternalService(message, severity, context);
      }
    } catch (e) {
      console.error('Failed to capture message:', e);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; name?: string }) {
    try {
      // Example for Sentry:
      // Sentry.setUser({
      //   id: user.id,
      //   email: user.email,
      //   username: user.name,
      // });

      logger.debug('User context set for error monitoring', { userId: user.id });
    } catch (e) {
      console.error('Failed to set user context:', e);
    }
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser() {
    try {
      // Example for Sentry:
      // Sentry.setUser(null);

      logger.debug('User context cleared from error monitoring');
    } catch (e) {
      console.error('Failed to clear user context:', e);
    }
  }

  /**
   * Add breadcrumb (trail of events leading to an error)
   */
  addBreadcrumb(message: string, category: string = 'default', data?: Record<string, unknown>) {
    try {
      // Example for Sentry:
      // Sentry.addBreadcrumb({
      //   message,
      //   category,
      //   data,
      //   timestamp: Date.now() / 1000,
      // });

      logger.debug('Breadcrumb added', { message, category, data });
    } catch (e) {
      console.error('Failed to add breadcrumb:', e);
    }
  }

  /**
   * Send error to external monitoring service (placeholder)
   */
  private sendToExternalService(error: Error, severity: ErrorSeverity['level'], context?: ErrorContext) {
    // PLACEHOLDER: Intentionally a no-op until an external service (e.g. Sentry, LogRocket)
    // is configured. When ready, replace the log below with the service SDK call.
    //
    // Example for Sentry:
    // Sentry.captureException(error, { level: severity, extra: context });

    // Structure the data for local logging
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      severity,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // This would be sent to your external service
    logger.error('Error sent to monitoring service (placeholder)', error, errorData);
  }

  /**
   * Send message to external monitoring service (placeholder)
   */
  private sendMessageToExternalService(message: string, severity: ErrorSeverity['level'], context?: ErrorContext) {
    // PLACEHOLDER: Intentionally a no-op until an external service (e.g. Sentry)
    // is configured. When ready, replace the log below with the service SDK call.
    //
    // Example for Sentry:
    // Sentry.captureMessage(message, { level: severity, extra: context });

    const messageData = {
      message,
      severity,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    logger.info('Message sent to monitoring service (placeholder)', messageData);
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoringService();

/**
 * Helper function to wrap async functions with error monitoring
 */
export function monitorAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorMonitoring.captureException(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Helper function to wrap sync functions with error monitoring
 */
export function monitorSync<T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      errorMonitoring.captureException(error as Error, context);
      throw error;
    }
  }) as T;
}
