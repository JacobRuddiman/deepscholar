/**
 * Centralized logging utility for DeepScholar
 *
 * This provides a consistent logging interface across the application
 * and allows for easy integration with external logging services
 * (e.g., Sentry, LogRocket, Datadog) in the future.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context ?? '');
    }
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext) {
    console.info(`[INFO] ${message}`, context ?? '');
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context ?? '');

    // In production, could send to external service
    if (this.isProduction) {
      this.sendToExternalService('warn', message, context);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error ?? '', context ?? '');

    // In production, could send to external service
    if (this.isProduction) {
      this.sendToExternalService('error', message, {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      });
    }
  }

  /**
   * Log export activity
   */
  export(message: string, context?: LogContext) {
    this.info(`[Export] ${message}`, context);
  }

  /**
   * Log authentication activity
   */
  auth(message: string, context?: LogContext) {
    this.info(`[Auth] ${message}`, context);
  }

  /**
   * Log API activity
   */
  api(message: string, context?: LogContext) {
    this.info(`[API] ${message}`, context);
  }

  /**
   * Log database activity (only in development)
   */
  database(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.debug(`[Database] ${message}`, context);
    }
  }

  /**
   * Send log to external service (placeholder for future implementation)
   */
  private sendToExternalService(level: LogLevel, message: string, context?: LogContext) {
    // TODO: Implement integration with external logging service
    // Examples:
    // - Sentry.captureMessage(message, { level, extra: context })
    // - LogRocket.log(message, context)
    // - Datadog logger

    // For now, this is a no-op placeholder
  }
}

// Export a singleton instance
export const logger = new Logger();
