/**
 * Sentry Configuration for ANDI Data Pipelines
 * ETL and Airflow error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Environment configuration
const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || NODE_ENV;
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || 'unknown';

/**
 * Initialize Sentry for data pipelines
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
    
    // Performance monitoring - more aggressive for pipelines
    tracesSampleRate: NODE_ENV === 'production' ? 0.2 : 1.0,
    profilesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    
    // Error filtering for pipeline context
    beforeSend(event, hint) {
      // Filter out expected connection retries
      const error = hint.originalException;
      if (error instanceof Error && 
          error.message.includes('ECONNRESET') && 
          hint.contexts?.pipeline?.retry_attempt) {
        return null; // Don't send retry errors
      }
      
      // Enhance with pipeline context
      if (hint.contexts?.pipeline) {
        event.tags = {
          ...event.tags,
          pipeline_id: hint.contexts.pipeline.pipeline_id,
          stage: hint.contexts.pipeline.stage
        };
      }
      
      return event;
    },
    
    // Pipeline-specific configuration
    maxBreadcrumbs: 100, // More breadcrumbs for complex pipeline flows
    debug: NODE_ENV === 'development',
    
    // Tags for pipeline identification
    initialScope: {
      tags: {
        component: 'data_pipelines',
        layer: 'etl'
      }
    }
  });

  console.log(`Sentry initialized for data pipelines (${SENTRY_ENVIRONMENT})`);
}

/**
 * ETL operation wrapper with comprehensive tracking
 */
export function withETLContext<T>(
  pipelineId: string,
  stage: string,
  operation: string,
  metadata: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.withScope(async (scope) => {
    // Set pipeline context
    scope.setTag('pipeline_id', pipelineId);
    scope.setTag('stage', stage);
    scope.setTag('operation', operation);
    
    scope.setContext('pipeline', {
      pipeline_id: pipelineId,
      stage,
      operation,
      ...metadata,
      start_time: new Date().toISOString()
    });
    
    // Create transaction for performance tracking
    const transaction = Sentry.startTransaction({
      name: `etl.${pipelineId}.${stage}.${operation}`,
      op: 'etl'
    });
    
    scope.setSpan(transaction);
    
    const startTime = Date.now();
    
    try {
      // Add breadcrumb for operation start
      Sentry.addBreadcrumb({
        message: `Starting ${stage}:${operation}`,
        level: 'info',
        data: { pipeline_id: pipelineId, ...metadata }
      });
      
      const result = await fn();
      
      const duration = Date.now() - startTime;
      transaction.setStatus('ok');
      
      // Track performance metrics
      Sentry.setMeasurement('etl_operation_duration', duration, 'millisecond');
      
      // Log success
      Sentry.addBreadcrumb({
        message: `Completed ${stage}:${operation}`,
        level: 'info',
        data: { 
          pipeline_id: pipelineId, 
          duration_ms: duration,
          success: true 
        }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      transaction.setStatus('internal_error');
      
      // Enhanced error context for ETL failures
      Sentry.withScope((errorScope) => {
        errorScope.setLevel('error');
        errorScope.setContext('etl_error', {
          pipeline_id: pipelineId,
          stage,
          operation,
          duration_ms: duration,
          metadata,
          error_type: error instanceof Error ? error.constructor.name : 'Unknown'
        });
        
        // Add fingerprinting for similar ETL errors
        errorScope.setFingerprint([
          'etl_error',
          pipelineId,
          stage,
          operation,
          error instanceof Error ? error.message : String(error)
        ]);
        
        Sentry.captureException(error);
      });
      
      throw error;
    } finally {
      transaction.finish();
    }
  });
}

/**
 * Track data quality metrics and issues
 */
export function trackDataQuality(
  pipelineId: string,
  checks: Array<{
    name: string;
    passed: boolean;
    value?: number;
    threshold?: number;
    message?: string;
  }>
): void {
  Sentry.withScope((scope) => {
    scope.setTag('metric_type', 'data_quality');
    scope.setTag('pipeline_id', pipelineId);
    
    const failedChecks = checks.filter(check => !check.passed);
    const passedChecks = checks.filter(check => check.passed);
    
    scope.setContext('data_quality', {
      pipeline_id: pipelineId,
      total_checks: checks.length,
      passed_checks: passedChecks.length,
      failed_checks: failedChecks.length,
      checks: checks
    });
    
    // Set measurements
    Sentry.setMeasurement('dq_total_checks', checks.length, 'none');
    Sentry.setMeasurement('dq_failed_checks', failedChecks.length, 'none');
    Sentry.setMeasurement('dq_success_rate', (passedChecks.length / checks.length) * 100, 'percent');
    
    // Report failed checks as warnings or errors
    if (failedChecks.length > 0) {
      const severity = failedChecks.length > checks.length * 0.5 ? 'error' : 'warning';
      scope.setLevel(severity);
      
      Sentry.captureMessage(
        `Data quality issues in pipeline ${pipelineId}: ${failedChecks.length}/${checks.length} checks failed`,
        severity
      );
    }
    
    // Add breadcrumb for tracking
    Sentry.addBreadcrumb({
      message: `Data quality check completed for ${pipelineId}`,
      level: failedChecks.length > 0 ? 'warning' : 'info',
      data: {
        pipeline_id: pipelineId,
        passed: passedChecks.length,
        failed: failedChecks.length
      }
    });
  });
}

/**
 * Pipeline-aware logger with Sentry integration
 */
export class PipelineLogger {
  constructor(
    private pipelineId: string,
    private stage?: string
  ) {}
  
  info(message: string, extra?: Record<string, any>) {
    console.log(`[${this.pipelineId}${this.stage ? `:${this.stage}` : ''}] ${message}`, extra);
    
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: {
        pipeline_id: this.pipelineId,
        stage: this.stage,
        ...extra
      }
    });
  }
  
  warn(message: string, extra?: Record<string, any>) {
    console.warn(`[${this.pipelineId}${this.stage ? `:${this.stage}` : ''}] ${message}`, extra);
    
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setTag('pipeline_id', this.pipelineId);
      if (this.stage) scope.setTag('stage', this.stage);
      if (extra) scope.setContext('warning_context', extra);
      
      Sentry.captureMessage(message, 'warning');
    });
  }
  
  error(message: string, error?: Error, extra?: Record<string, any>) {
    console.error(`[${this.pipelineId}${this.stage ? `:${this.stage}` : ''}] ${message}`, error, extra);
    
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setTag('pipeline_id', this.pipelineId);
      if (this.stage) scope.setTag('stage', this.stage);
      
      scope.setContext('pipeline_error', {
        pipeline_id: this.pipelineId,
        stage: this.stage,
        message,
        ...extra
      });
      
      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    });
  }
  
  debug(message: string, extra?: Record<string, any>) {
    if (NODE_ENV === 'development') {
      console.debug(`[${this.pipelineId}${this.stage ? `:${this.stage}` : ''}] ${message}`, extra);
    }
    
    Sentry.addBreadcrumb({
      message,
      level: 'debug',
      data: {
        pipeline_id: this.pipelineId,
        stage: this.stage,
        ...extra
      }
    });
  }
  
  /**
   * Track pipeline metrics
   */
  metric(name: string, value: number, unit: string = 'none', extra?: Record<string, any>) {
    Sentry.setMeasurement(name, value, unit as any);
    
    Sentry.addBreadcrumb({
      message: `Metric recorded: ${name} = ${value} ${unit}`,
      level: 'info',
      data: {
        pipeline_id: this.pipelineId,
        stage: this.stage,
        metric_name: name,
        metric_value: value,
        metric_unit: unit,
        ...extra
      }
    });
  }
}

/**
 * Create a pipeline logger instance
 */
export function createPipelineLogger(pipelineId: string, stage?: string): PipelineLogger {
  return new PipelineLogger(pipelineId, stage);
}

// Export Sentry instance for advanced usage
export { Sentry };