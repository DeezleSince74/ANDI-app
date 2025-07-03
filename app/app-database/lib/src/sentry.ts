/**
 * Sentry Configuration for ANDI Database Layer
 * Centralized error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Environment configuration
const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || NODE_ENV;
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || 'unknown';

/**
 * Initialize Sentry for the database layer
 */
export function initializeSentry(): void {
  if (!SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured - Sentry will not be initialized');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    
    // Performance monitoring
    tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: undefined }),
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out development noise
      if (NODE_ENV === 'development') {
        console.log('Sentry event captured:', event.exception?.values?.[0]?.value || event.message);
      }
      
      // Don't send connection timeout errors in development
      const error = hint.originalException;
      if (NODE_ENV === 'development' && 
          error instanceof Error && 
          error.message.includes('timeout')) {
        return null;
      }
      
      return event;
    },
    
    // Additional configuration
    maxBreadcrumbs: 50,
    debug: NODE_ENV === 'development',
    
    // Tags for better organization
    initialScope: {
      tags: {
        component: 'database',
        layer: 'data_access'
      }
    }
  });

  console.log(`Sentry initialized for database layer (${SENTRY_ENVIRONMENT})`);
}

/**
 * Capture database operation context for better error tracking
 */
export function withDatabaseContext<T>(
  operation: string,
  metadata: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.withScope(async (scope) => {
    scope.setTag('operation', operation);
    scope.setContext('database', {
      operation,
      ...metadata,
      timestamp: new Date().toISOString()
    });
    
    const transaction = Sentry.startTransaction({
      name: `database.${operation}`,
      op: 'db'
    });
    
    scope.setSpan(transaction);
    
    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      
      // Enhance error with database context
      Sentry.withScope((errorScope) => {
        errorScope.setLevel('error');
        errorScope.setContext('error_context', {
          operation,
          metadata,
          stack: error instanceof Error ? error.stack : 'Unknown stack'
        });
        
        Sentry.captureException(error);
      });
      
      throw error;
    } finally {
      transaction.finish();
    }
  });
}

/**
 * Log database performance metrics
 */
export function trackDatabaseMetrics(
  operation: string,
  duration: number,
  metadata: Record<string, any> = {}
): void {
  Sentry.withScope((scope) => {
    scope.setTag('metric_type', 'database_performance');
    scope.setContext('performance', {
      operation,
      duration_ms: duration,
      ...metadata
    });
    
    // Track slow queries
    if (duration > 1000) {
      scope.setLevel('warning');
      Sentry.captureMessage(`Slow database query: ${operation} (${duration}ms)`, 'warning');
    }
    
    // Add metric
    Sentry.setMeasurement('db_query_duration', duration, 'millisecond');
  });
}

/**
 * Enhanced logger with Sentry integration
 */
export const sentryLogger = {
  info: (message: string, extra?: Record<string, any>) => {
    console.log(message, extra);
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: extra
    });
  },
  
  warn: (message: string, extra?: Record<string, any>) => {
    console.warn(message, extra);
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      if (extra) scope.setContext('warning_context', extra);
      Sentry.captureMessage(message, 'warning');
    });
  },
  
  error: (message: string, error?: Error, extra?: Record<string, any>) => {
    console.error(message, error, extra);
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      if (extra) scope.setContext('error_context', extra);
      
      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    });
  },
  
  debug: (message: string, extra?: Record<string, any>) => {
    if (NODE_ENV === 'development') {
      console.debug(message, extra);
    }
    Sentry.addBreadcrumb({
      message,
      level: 'debug',
      data: extra
    });
  }
};

// Export Sentry instance for advanced usage
export { Sentry };