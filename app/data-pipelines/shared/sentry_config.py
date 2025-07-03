"""
Sentry Configuration for ANDI Airflow Data Pipelines
Python-based error tracking and performance monitoring for Airflow DAGs
"""

import os
import logging
from typing import Dict, Any, Optional
import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.flask import FlaskIntegration


# Environment configuration
SENTRY_DSN = os.getenv('SENTRY_DSN')
NODE_ENV = os.getenv('NODE_ENV', 'development')
SENTRY_ENVIRONMENT = os.getenv('SENTRY_ENVIRONMENT', NODE_ENV)
SENTRY_RELEASE = os.getenv('SENTRY_RELEASE', 'unknown')


def initialize_sentry() -> None:
    """Initialize Sentry for Airflow data pipelines."""
    
    if not SENTRY_DSN:
        logging.warning('SENTRY_DSN not configured - Sentry will not be initialized')
        return
    
    # Sentry integrations for Python/Airflow
    integrations = [
        LoggingIntegration(
            level=logging.INFO,        # Capture info and above as breadcrumbs
            event_level=logging.ERROR  # Send errors as events
        ),
        SqlalchemyIntegration(),       # Database query tracking
        FlaskIntegration(              # Airflow webserver integration
            transaction_style='endpoint'
        ),
    ]
    
    # Initialize Sentry
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=SENTRY_ENVIRONMENT,
        release=SENTRY_RELEASE,
        
        # Performance monitoring
        traces_sample_rate=0.2 if NODE_ENV == 'production' else 1.0,
        profiles_sample_rate=0.1 if NODE_ENV == 'production' else 1.0,
        
        # Integrations
        integrations=integrations,
        
        # Error filtering
        before_send=_before_send_filter,
        
        # Additional configuration
        max_breadcrumbs=100,
        debug=NODE_ENV == 'development',
        
        # Default tags
        default_integrations=True,
    )
    
    # Set default tags
    sentry_sdk.set_tag('component', 'data_pipelines')
    sentry_sdk.set_tag('layer', 'airflow')
    
    logging.info(f'Sentry initialized for Airflow pipelines ({SENTRY_ENVIRONMENT})')


def _before_send_filter(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Filter Sentry events before sending."""
    
    # Don't send Airflow task retry errors (expected behavior)
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        if exc_type and 'AirflowTaskTimeout' in str(exc_type):
            return None
        if exc_value and 'Task instance did not finish' in str(exc_value):
            return None
    
    # Filter out development noise
    if NODE_ENV == 'development':
        logging.debug(f"Sentry event captured: {event.get('message', 'Unknown error')}")
    
    return event


class DAGLogger:
    """Enhanced logger for Airflow DAGs with Sentry integration."""
    
    def __init__(self, dag_id: str, task_id: Optional[str] = None):
        self.dag_id = dag_id
        self.task_id = task_id
        self.logger = logging.getLogger(f'airflow.dag.{dag_id}')
        
        # Set context tags
        sentry_sdk.set_tag('dag_id', dag_id)
        if task_id:
            sentry_sdk.set_tag('task_id', task_id)
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log info message with Sentry breadcrumb."""
        log_msg = f"[{self.dag_id}{f':{self.task_id}' if self.task_id else ''}] {message}"
        self.logger.info(log_msg, extra=extra)
        
        sentry_sdk.add_breadcrumb(
            message=message,
            level='info',
            data={
                'dag_id': self.dag_id,
                'task_id': self.task_id,
                **(extra or {})
            }
        )
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log warning with Sentry capture."""
        log_msg = f"[{self.dag_id}{f':{self.task_id}' if self.task_id else ''}] {message}"
        self.logger.warning(log_msg, extra=extra)
        
        with sentry_sdk.push_scope() as scope:
            scope.set_level('warning')
            scope.set_context('warning_context', {
                'dag_id': self.dag_id,
                'task_id': self.task_id,
                **(extra or {})
            })
            sentry_sdk.capture_message(message, level='warning')
    
    def error(self, message: str, error: Optional[Exception] = None, 
              extra: Optional[Dict[str, Any]] = None) -> None:
        """Log error with Sentry capture."""
        log_msg = f"[{self.dag_id}{f':{self.task_id}' if self.task_id else ''}] {message}"
        
        if error:
            self.logger.error(log_msg, exc_info=error, extra=extra)
        else:
            self.logger.error(log_msg, extra=extra)
        
        with sentry_sdk.push_scope() as scope:
            scope.set_level('error')
            scope.set_context('error_context', {
                'dag_id': self.dag_id,
                'task_id': self.task_id,
                'message': message,
                **(extra or {})
            })
            
            # Set fingerprinting for similar DAG errors
            scope.set_fingerprint([
                'dag_error',
                self.dag_id,
                self.task_id or 'unknown_task',
                error.__class__.__name__ if error else 'unknown_error'
            ])
            
            if error:
                sentry_sdk.capture_exception(error)
            else:
                sentry_sdk.capture_message(message, level='error')
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log debug message with breadcrumb."""
        if NODE_ENV == 'development':
            log_msg = f"[{self.dag_id}{f':{self.task_id}' if self.task_id else ''}] {message}"
            self.logger.debug(log_msg, extra=extra)
        
        sentry_sdk.add_breadcrumb(
            message=message,
            level='debug',
            data={
                'dag_id': self.dag_id,
                'task_id': self.task_id,
                **(extra or {})
            }
        )


def with_dag_context(dag_id: str, task_id: Optional[str] = None):
    """Decorator for DAG tasks with Sentry context."""
    
    def decorator(func):
        def wrapper(*args, **kwargs):
            with sentry_sdk.push_scope() as scope:
                # Set DAG context
                scope.set_tag('dag_id', dag_id)
                if task_id:
                    scope.set_tag('task_id', task_id)
                
                scope.set_context('dag_context', {
                    'dag_id': dag_id,
                    'task_id': task_id,
                    'execution_date': kwargs.get('execution_date'),
                    'run_id': kwargs.get('run_id')
                })
                
                # Create transaction for performance tracking
                with sentry_sdk.start_transaction(
                    name=f'dag.{dag_id}.{task_id or "unknown"}',
                    op='airflow_task'
                ) as transaction:
                    
                    try:
                        # Add breadcrumb for task start
                        sentry_sdk.add_breadcrumb(
                            message=f'Starting task {task_id or "unknown"} in DAG {dag_id}',
                            level='info',
                            data={'dag_id': dag_id, 'task_id': task_id}
                        )
                        
                        result = func(*args, **kwargs)
                        transaction.set_status('ok')
                        
                        # Add breadcrumb for task success
                        sentry_sdk.add_breadcrumb(
                            message=f'Completed task {task_id or "unknown"} in DAG {dag_id}',
                            level='info',
                            data={'dag_id': dag_id, 'task_id': task_id, 'success': True}
                        )
                        
                        return result
                        
                    except Exception as e:
                        transaction.set_status('internal_error')
                        
                        # Enhanced error context for Airflow tasks
                        scope.set_context('task_error', {
                            'dag_id': dag_id,
                            'task_id': task_id,
                            'error_type': e.__class__.__name__,
                            'execution_date': kwargs.get('execution_date'),
                            'run_id': kwargs.get('run_id')
                        })
                        
                        raise
        
        return wrapper
    return decorator


def track_pipeline_metrics(
    dag_id: str,
    task_id: str,
    metrics: Dict[str, Any]
) -> None:
    """Track pipeline metrics with Sentry."""
    
    with sentry_sdk.push_scope() as scope:
        scope.set_tag('metric_type', 'pipeline_performance')
        scope.set_tag('dag_id', dag_id)
        scope.set_tag('task_id', task_id)
        
        scope.set_context('pipeline_metrics', {
            'dag_id': dag_id,
            'task_id': task_id,
            **metrics
        })
        
        # Set measurements for numeric metrics
        for key, value in metrics.items():
            if isinstance(value, (int, float)):
                # Determine unit based on metric name
                unit = 'none'
                if 'duration' in key.lower() or 'time' in key.lower():
                    unit = 'millisecond'
                elif 'count' in key.lower() or 'records' in key.lower():
                    unit = 'none'
                elif 'rate' in key.lower() or 'percent' in key.lower():
                    unit = 'percent'
                
                sentry_sdk.set_measurement(f'pipeline_{key}', value, unit)
        
        # Add breadcrumb for metrics tracking
        sentry_sdk.add_breadcrumb(
            message=f'Pipeline metrics recorded for {dag_id}:{task_id}',
            level='info',
            data={
                'dag_id': dag_id,
                'task_id': task_id,
                'metrics_count': len(metrics)
            }
        )


def create_dag_logger(dag_id: str, task_id: Optional[str] = None) -> DAGLogger:
    """Create a DAG logger instance."""
    return DAGLogger(dag_id, task_id)


# Initialize Sentry when module is imported
if __name__ != '__main__':
    initialize_sentry()