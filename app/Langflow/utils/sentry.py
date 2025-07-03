# Langflow Sentry Integration
# Monitors AI workflows, flow executions, and component performance

import os
import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from typing import Dict, Any, Optional, Callable
from functools import wraps
import time
from datetime import datetime

class LangflowSentryMonitor:
    """
    Sentry monitoring for Langflow AI workflows
    """
    
    def __init__(self):
        self.initialized = False
        self.environment = os.getenv('SENTRY_ENVIRONMENT', 'development')
        self.dsn = os.getenv('SENTRY_DSN')
        
    def initialize(self):
        """Initialize Sentry SDK with Langflow-specific configuration"""
        if not self.dsn:
            print("⚠️  Sentry DSN not configured for Langflow. Monitoring disabled.")
            return
            
        sentry_sdk.init(
            dsn=self.dsn,
            environment=self.environment,
            release=os.getenv('SENTRY_RELEASE', 'langflow-1.0.0'),
            traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
            profiles_sample_rate=float(os.getenv('SENTRY_PROFILES_SAMPLE_RATE', '0.1')),
            integrations=[
                LoggingIntegration(
                    level=None,  # Capture all levels
                    event_level=None  # Send all as events
                ),
                SqlalchemyIntegration(),
                RedisIntegration(),
            ],
            before_send=self._before_send,
            before_send_transaction=self._before_send_transaction,
        )
        
        # Set Langflow context
        sentry_sdk.set_context("langflow", {
            "version": os.getenv('LANGFLOW_VERSION', 'latest'),
            "mode": os.getenv('LANGFLOW_BACKEND_ONLY', 'false'),
            "workers": os.getenv('LANGFLOW_WORKERS', '2'),
            "environment": self.environment
        })
        
        # Set user context if available
        if os.getenv('LANGFLOW_SUPERUSER_EMAIL'):
            sentry_sdk.set_user({
                "email": os.getenv('LANGFLOW_SUPERUSER_EMAIL'),
                "username": "langflow_admin"
            })
        
        self.initialized = True
        print(f"✅ Sentry initialized for Langflow ({self.environment})")
    
    def _before_send(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process events before sending to Sentry"""
        # Filter out sensitive data
        if 'extra' in event:
            sensitive_keys = ['api_key', 'password', 'token', 'secret']
            for key in list(event['extra'].keys()):
                if any(sensitive in key.lower() for sensitive in sensitive_keys):
                    event['extra'][key] = '[REDACTED]'
        
        # Add Langflow-specific tags
        event.setdefault('tags', {})
        event['tags']['langflow.component'] = 'workflow-engine'
        
        return event
    
    def _before_send_transaction(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process performance transactions before sending"""
        # Add custom measurements
        if 'measurements' not in event:
            event['measurements'] = {}
            
        return event
    
    def track_flow_execution(self, flow_id: str, flow_name: str):
        """
        Decorator to track flow execution performance
        
        Usage:
            @sentry_monitor.track_flow_execution("flow_123", "CIQ Analysis Flow")
            def execute_flow():
                # Flow execution logic
                pass
        """
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if not self.initialized:
                    return func(*args, **kwargs)
                
                with sentry_sdk.start_transaction(
                    op="langflow.flow.execute",
                    name=f"Flow: {flow_name}",
                    sampled=True
                ) as transaction:
                    transaction.set_tag("flow.id", flow_id)
                    transaction.set_tag("flow.name", flow_name)
                    transaction.set_context("flow", {
                        "id": flow_id,
                        "name": flow_name,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    start_time = time.time()
                    
                    try:
                        # Execute the flow
                        result = func(*args, **kwargs)
                        
                        # Track success metrics
                        duration = time.time() - start_time
                        transaction.set_measurement("flow.duration", duration, "second")
                        transaction.set_tag("flow.status", "success")
                        
                        # Track custom metrics if result contains them
                        if isinstance(result, dict):
                            if 'metrics' in result:
                                for metric_name, metric_value in result['metrics'].items():
                                    transaction.set_measurement(f"flow.{metric_name}", metric_value)
                            
                            if 'node_count' in result:
                                transaction.set_measurement("flow.nodes", result['node_count'])
                        
                        return result
                        
                    except Exception as e:
                        # Track error
                        transaction.set_tag("flow.status", "error")
                        transaction.set_tag("error.type", type(e).__name__)
                        
                        # Capture the exception with flow context
                        sentry_sdk.capture_exception(e, contexts={
                            "flow": {
                                "id": flow_id,
                                "name": flow_name,
                                "error": str(e)
                            }
                        })
                        
                        raise
                    
            return wrapper
        return decorator
    
    def track_component_execution(self, component_type: str, component_name: str):
        """
        Track individual component execution within flows
        
        Usage:
            @sentry_monitor.track_component_execution("DatabaseConnector", "CIQ_Reader")
            def execute_component():
                # Component logic
                pass
        """
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if not self.initialized:
                    return func(*args, **kwargs)
                
                with sentry_sdk.start_span(
                    op=f"langflow.component.{component_type}",
                    description=component_name
                ) as span:
                    span.set_tag("component.type", component_type)
                    span.set_tag("component.name", component_name)
                    
                    start_time = time.time()
                    
                    try:
                        result = func(*args, **kwargs)
                        
                        # Track component metrics
                        duration = time.time() - start_time
                        span.set_measurement("component.duration", duration, "second")
                        
                        # Track data volume if available
                        if isinstance(result, (list, dict)):
                            if isinstance(result, list):
                                span.set_measurement("component.records", len(result))
                            elif 'count' in result:
                                span.set_measurement("component.records", result['count'])
                        
                        return result
                        
                    except Exception as e:
                        span.set_tag("component.error", True)
                        span.set_data("error.message", str(e))
                        raise
                    
            return wrapper
        return decorator
    
    def track_ai_api_call(self, provider: str, model: str, operation: str):
        """
        Track AI API calls (OpenAI, Anthropic, etc.)
        
        Usage:
            @sentry_monitor.track_ai_api_call("openai", "gpt-4", "completion")
            def call_openai():
                # API call logic
                pass
        """
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if not self.initialized:
                    return func(*args, **kwargs)
                
                with sentry_sdk.start_span(
                    op=f"ai.{provider}.{operation}",
                    description=f"{provider} {model} {operation}"
                ) as span:
                    span.set_tag("ai.provider", provider)
                    span.set_tag("ai.model", model)
                    span.set_tag("ai.operation", operation)
                    
                    start_time = time.time()
                    
                    try:
                        result = func(*args, **kwargs)
                        
                        # Track API metrics
                        duration = time.time() - start_time
                        span.set_measurement("ai.latency", duration * 1000, "millisecond")
                        
                        # Track token usage if available
                        if isinstance(result, dict):
                            if 'usage' in result:
                                usage = result['usage']
                                if 'prompt_tokens' in usage:
                                    span.set_measurement("ai.tokens.prompt", usage['prompt_tokens'])
                                if 'completion_tokens' in usage:
                                    span.set_measurement("ai.tokens.completion", usage['completion_tokens'])
                                if 'total_tokens' in usage:
                                    span.set_measurement("ai.tokens.total", usage['total_tokens'])
                            
                            # Track cost if available
                            if 'cost' in result:
                                span.set_measurement("ai.cost", result['cost'], "usd")
                        
                        return result
                        
                    except Exception as e:
                        span.set_tag("ai.error", True)
                        span.set_data("error.type", type(e).__name__)
                        span.set_data("error.message", str(e))
                        
                        # Special handling for rate limits
                        if "rate limit" in str(e).lower():
                            span.set_tag("ai.rate_limited", True)
                        
                        raise
                    
            return wrapper
        return decorator
    
    def track_database_query(self, database: str, operation: str):
        """
        Track database queries from Langflow components
        
        Usage:
            @sentry_monitor.track_database_query("andi_db", "select")
            def query_ciq_data():
                # Query logic
                pass
        """
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if not self.initialized:
                    return func(*args, **kwargs)
                
                with sentry_sdk.start_span(
                    op=f"db.{operation}",
                    description=f"{database} {operation}"
                ) as span:
                    span.set_tag("db.system", "postgresql" if "postgres" in database else "clickhouse")
                    span.set_tag("db.name", database)
                    span.set_tag("db.operation", operation)
                    
                    start_time = time.time()
                    
                    try:
                        result = func(*args, **kwargs)
                        
                        # Track query metrics
                        duration = time.time() - start_time
                        span.set_measurement("db.duration", duration * 1000, "millisecond")
                        
                        # Track result size
                        if isinstance(result, list):
                            span.set_measurement("db.rows", len(result))
                        
                        return result
                        
                    except Exception as e:
                        span.set_tag("db.error", True)
                        span.set_data("error.message", str(e))
                        raise
                    
            return wrapper
        return decorator
    
    def log_flow_error(self, flow_id: str, flow_name: str, error: Exception, context: Dict[str, Any] = None):
        """Log flow execution errors with context"""
        if not self.initialized:
            return
        
        sentry_sdk.capture_exception(error, contexts={
            "flow": {
                "id": flow_id,
                "name": flow_name,
                "error_type": type(error).__name__,
                "error_message": str(error),
                **(context or {})
            }
        })
    
    def log_component_error(self, component_type: str, component_name: str, error: Exception, context: Dict[str, Any] = None):
        """Log component errors with context"""
        if not self.initialized:
            return
        
        sentry_sdk.capture_exception(error, contexts={
            "component": {
                "type": component_type,
                "name": component_name,
                "error_type": type(error).__name__,
                "error_message": str(error),
                **(context or {})
            }
        })
    
    def track_flow_metrics(self, flow_id: str, metrics: Dict[str, float]):
        """Track custom flow metrics"""
        if not self.initialized:
            return
        
        with sentry_sdk.start_transaction(
            op="langflow.metrics",
            name=f"Flow Metrics: {flow_id}"
        ) as transaction:
            transaction.set_tag("flow.id", flow_id)
            
            for metric_name, metric_value in metrics.items():
                transaction.set_measurement(f"flow.{metric_name}", metric_value)
    
    def add_breadcrumb(self, message: str, category: str = "langflow", level: str = "info", data: Dict[str, Any] = None):
        """Add breadcrumb for better error context"""
        if not self.initialized:
            return
        
        sentry_sdk.add_breadcrumb(
            message=message,
            category=category,
            level=level,
            data=data or {}
        )
    
    def set_flow_context(self, flow_id: str, flow_name: str, metadata: Dict[str, Any] = None):
        """Set flow context for current scope"""
        if not self.initialized:
            return
        
        sentry_sdk.set_context("current_flow", {
            "id": flow_id,
            "name": flow_name,
            "started_at": datetime.utcnow().isoformat(),
            **(metadata or {})
        })
    
    def clear_flow_context(self):
        """Clear flow context after execution"""
        if not self.initialized:
            return
        
        with sentry_sdk.configure_scope() as scope:
            scope.remove_context("current_flow")


# Global instance
sentry_monitor = LangflowSentryMonitor()


# Convenience functions
def initialize_sentry():
    """Initialize Sentry monitoring for Langflow"""
    sentry_monitor.initialize()


def track_flow(flow_id: str, flow_name: str):
    """Decorator for tracking flow execution"""
    return sentry_monitor.track_flow_execution(flow_id, flow_name)


def track_component(component_type: str, component_name: str):
    """Decorator for tracking component execution"""
    return sentry_monitor.track_component_execution(component_type, component_name)


def track_ai_call(provider: str, model: str, operation: str):
    """Decorator for tracking AI API calls"""
    return sentry_monitor.track_ai_api_call(provider, model, operation)


def track_db_query(database: str, operation: str):
    """Decorator for tracking database queries"""
    return sentry_monitor.track_database_query(database, operation)