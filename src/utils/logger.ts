/**
 * Structured Logger for RTIOS
 *
 * Provides structured logging for AI calls, errors, and user actions.
 * In development: logs to console
 * In production: can be extended to send to logging services (Sentry, LogRocket, etc.)
 */

export interface LogContext {
  component?: string;
  userId?: string;
  jobId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface AICallContext extends LogContext {
  model?: string;
  promptLength?: number;
  responseLength?: number;
  streaming?: boolean;
  cached?: boolean;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context || {});
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || {});
  }

  /**
   * Log error messages with full context
   */
  error(message: string, error: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined,
      name: error.name
    } : { error: String(error) };

    console.error(`[ERROR] ${message}`, {
      ...errorDetails,
      ...context,
      timestamp: new Date().toISOString()
    });

    // TODO: In production, send to error tracking service
    // if (this.isProduction) {
    //   Sentry.captureException(error, { contexts: { custom: context } });
    // }
  }

  /**
   * Log AI/Gemini API calls with performance metrics
   */
  aiCall(
    action: string,
    duration: number,
    success: boolean,
    context?: AICallContext
  ): void {
    const level = success ? 'INFO' : 'ERROR';
    const emoji = success ? '✅' : '❌';

    const logData = {
      action,
      duration: `${duration}ms`,
      success,
      ...context,
      timestamp: new Date().toISOString()
    };

    if (this.isDevelopment) {
      console.log(`${emoji} [AI-${level}] ${action} - ${duration}ms`, logData);
    } else {
      // In production, log only failures or slow calls
      if (!success || duration > 5000) {
        console.log(`[AI-${level}] ${action}`, logData);
      }
    }

    // TODO: Track AI performance metrics
    // Could send to analytics service to track:
    // - Average response times
    // - Success rates
    // - Most used features
  }

  /**
   * Log user actions for analytics
   */
  userAction(action: string, userId: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[USER] ${action}`, { userId, ...context });
    }

    // TODO: Send to analytics service
    // analytics.track(userId, action, context);
  }

  /**
   * Log rate limiting events
   */
  rateLimit(userId: string, action: string, limited: boolean, context?: LogContext): void {
    if (limited) {
      console.warn(`[RATE-LIMIT] User ${userId} rate limited on ${action}`, context);
    } else if (this.isDevelopment) {
      console.log(`[RATE-LIMIT] User ${userId} passed rate limit check for ${action}`, context);
    }
  }

  /**
   * Log database operations (useful for debugging slow queries)
   */
  database(operation: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment || duration > 1000) {
      const emoji = duration > 1000 ? '🐌' : '⚡';
      console.log(`${emoji} [DB] ${operation} - ${duration}ms`, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
