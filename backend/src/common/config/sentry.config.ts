import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.APP_VERSION || 'unknown';

  if (!dsn) {
    console.warn('Sentry DSN not provided. Error tracking will be disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
      // Add more integrations as needed
    ],
    // Filter out sensitive data
    beforeSend(event: any, hint: any) {
      // Remove sensitive data from event
      if (event.request) {
        // Sanitize headers
        if (event.request.headers) {
          const sensitiveHeaders = [
            'authorization',
            'cookie',
            'x-api-key',
            'x-auth-token',
          ];
          sensitiveHeaders.forEach((header) => {
            if (event.request?.headers?.[header]) {
              event.request.headers[header] = '********';
            }
          });
        }

        // Sanitize data
        if (event.request.data) {
          const sensitiveFields = [
            'password',
            'passwordConfirm',
            'token',
            'accessToken',
            'refreshToken',
            'secret',
            'creditCard',
            'cvv',
          ];
          const sanitizeObject = (obj: any): any => {
            if (!obj || typeof obj !== 'object') {
              return obj;
            }
            const sanitized = { ...obj };
            sensitiveFields.forEach((field) => {
              if (sanitized[field]) {
                sanitized[field] = '********';
              }
            });
            return sanitized;
          };
          event.request.data = sanitizeObject(event.request.data);
        }
      }

      return event;
    },
  });
}
