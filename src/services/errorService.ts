/**
 * Error Service
 *
 * Centralized error handling service for the application.
 * Provides consistent error logging, user-friendly messages, and hooks for external monitoring.
 */

import { logger } from '@/src/utils/logger';

interface ErrorContext {
  component: string;
  action: string;
  jobId?: string;
  resumeId?: string;
  fileName?: string;
  jobTitle?: string;
  [key: string]: unknown;
}

class ErrorService {
  /**
   * Sanitize context to remove PII before logging
   */
  private sanitizeContext(context: ErrorContext): Record<string, unknown> {
    return {
      component: context.component,
      action: context.action,
      // Redact sensitive fields - only log that they were present
      ...(context.jobId ? { jobId: '[REDACTED]' } : {}),
      ...(context.resumeId ? { resumeId: '[REDACTED]' } : {}),
      ...(context.fileName ? { fileName: '[REDACTED]' } : {}),
      ...(context.jobTitle ? { jobTitle: '[REDACTED]' } : {}),
    };
  }

  /**
   * Handles errors and returns a user-friendly message
   * 
   * @param error - The error that occurred (Error object, string, or unknown)
   * @param context - Context about where/why the error occurred
   * @returns A user-friendly error message
   */
  handleError(error: unknown, context: ErrorContext): string {
    // Sanitize context before logging to prevent PII exposure
    const sanitizedContext = this.sanitizeContext(context);

    // Use structured logger
    logger.error(
      `Error in ${context.component}::${context.action}`,
      error instanceof Error ? error : new Error(String(error)),
      sanitizedContext
    );

    // Extract user-friendly message
    const message = this.extractMessage(error);

    // NOTE: Integration point for external error tracking (e.g., Sentry, LogRocket)
    // Uncomment and configure when setting up production monitoring:
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     tags: { component: context.component, action: context.action },
    //     extra: sanitizedContext
    //   });
    // }

    return message;
  }

  /**
   * Extract a user-friendly message from an error
   * 
   * @param error - The error to extract a message from
   * @returns A user-friendly error message
   */
  private extractMessage(error: unknown): string {
    // Handle Error objects
    if (error instanceof Error) {
      return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Handle objects with message property
    if (error && typeof error === 'object' && 'message' in error) {
      const msg = (error as { message: unknown }).message;
      if (typeof msg === 'string') {
        return msg;
      }
    }

    // Fallback for unknown error types
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log non-critical errors or warnings (for analytics/debugging)
   */
  logError(error: unknown, context: Partial<ErrorContext> = {}): void {
    const sanitized = {
      component: context.component,
      action: context.action,
    };
    logger.warn('Non-critical error', sanitized);
  }

  /**
   * Check if an error is a network error
   */
  isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('Failed to fetch')
      );
    }
    return false;
  }

  /**
   * Check if an error is a quota/storage error
   */
  isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('quota') ||
        error.message.includes('storage') ||
        error.message.includes('QuotaExceededError')
      );
    }
    return false;
  }
}

// Export singleton instance
export const errorService = new ErrorService();
