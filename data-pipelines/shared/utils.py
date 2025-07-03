"""
Shared utilities for ANDI data pipelines
"""

import os
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from functools import wraps


def setup_logging(name: str, level: str = 'INFO') -> logging.Logger:
    """Set up structured logging for ETL processes"""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger


def send_slack_notification(message: str, channel: str = '#andi-alerts', username: str = 'ANDI ETL Bot') -> bool:
    """Send Slack notification"""
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    if not webhook_url:
        print(f"No Slack webhook configured, would send: {message}")
        return False
    
    payload = {
        'text': message,
        'channel': channel,
        'username': username,
        'icon_emoji': ':robot_face:'
    }
    
    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Failed to send Slack notification: {e}")
        return False


def send_pipeline_alert(pipeline_name: str, status: str, details: str = "", context: Dict[str, Any] = None):
    """Send standardized pipeline status alert"""
    context = context or {}
    
    emoji = {
        'success': '✅',
        'failure': '❌', 
        'warning': '⚠️',
        'info': 'ℹ️'
    }.get(status.lower(), '📊')
    
    message = f"{emoji} *{pipeline_name}* - {status.upper()}"
    
    if details:
        message += f"\n{details}"
    
    if context:
        message += f"\n```{json.dumps(context, indent=2, default=str)}```"
    
    send_slack_notification(message)


def retry_with_backoff(max_retries: int = 3, backoff_factor: float = 2.0, exceptions: tuple = (Exception,)):
    """Decorator for retrying functions with exponential backoff"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt == max_retries:
                        break
                    
                    wait_time = backoff_factor ** attempt
                    print(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
            
            raise last_exception
        return wrapper
    return decorator


def batch_processor(items: List[Any], batch_size: int = 1000):
    """Process items in batches"""
    for i in range(0, len(items), batch_size):
        yield items[i:i + batch_size]


def get_date_range(start_date: str, end_date: str = None) -> List[datetime]:
    """Get list of dates between start and end date"""
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d') if end_date else datetime.now()
    
    dates = []
    current = start
    while current <= end:
        dates.append(current)
        current += timedelta(days=1)
    
    return dates


def validate_data_quality(data: List[Dict], rules: Dict[str, Any]) -> Dict[str, Any]:
    """Validate data quality based on rules"""
    results = {
        'total_records': len(data),
        'passed': 0,
        'failed': 0,
        'errors': []
    }
    
    for record in data:
        record_valid = True
        
        # Check required fields
        if 'required_fields' in rules:
            for field in rules['required_fields']:
                if field not in record or record[field] is None:
                    results['errors'].append(f"Missing required field: {field}")
                    record_valid = False
        
        # Check data types
        if 'data_types' in rules:
            for field, expected_type in rules['data_types'].items():
                if field in record and record[field] is not None:
                    if not isinstance(record[field], expected_type):
                        results['errors'].append(f"Invalid type for {field}: expected {expected_type.__name__}")
                        record_valid = False
        
        # Check value ranges
        if 'ranges' in rules:
            for field, (min_val, max_val) in rules['ranges'].items():
                if field in record and record[field] is not None:
                    value = record[field]
                    if not (min_val <= value <= max_val):
                        results['errors'].append(f"Value out of range for {field}: {value} not in [{min_val}, {max_val}]")
                        record_valid = False
        
        if record_valid:
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    results['success_rate'] = results['passed'] / results['total_records'] if results['total_records'] > 0 else 0
    
    return results


def format_bytes(bytes_value: int) -> str:
    """Format bytes to human readable string"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def format_duration(seconds: float) -> str:
    """Format duration in seconds to human readable string"""
    if seconds < 60:
        return f"{seconds:.2f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.2f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.2f}h"


class ETLMetrics:
    """Track ETL pipeline metrics"""
    
    def __init__(self, pipeline_name: str):
        self.pipeline_name = pipeline_name
        self.start_time = datetime.now()
        self.metrics = {
            'records_extracted': 0,
            'records_transformed': 0,
            'records_loaded': 0,
            'records_failed': 0,
            'bytes_processed': 0,
            'errors': []
        }
    
    def record_extraction(self, count: int):
        """Record extraction metrics"""
        self.metrics['records_extracted'] = count
    
    def record_transformation(self, count: int):
        """Record transformation metrics"""
        self.metrics['records_transformed'] = count
    
    def record_load(self, count: int, bytes_processed: int = 0):
        """Record load metrics"""
        self.metrics['records_loaded'] = count
        self.metrics['bytes_processed'] += bytes_processed
    
    def record_error(self, error: str):
        """Record error"""
        self.metrics['records_failed'] += 1
        self.metrics['errors'].append(error)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get metrics summary"""
        duration = (datetime.now() - self.start_time).total_seconds()
        
        return {
            'pipeline': self.pipeline_name,
            'duration': format_duration(duration),
            'start_time': self.start_time.isoformat(),
            'end_time': datetime.now().isoformat(),
            'records_extracted': self.metrics['records_extracted'],
            'records_transformed': self.metrics['records_transformed'],
            'records_loaded': self.metrics['records_loaded'],
            'records_failed': self.metrics['records_failed'],
            'bytes_processed': format_bytes(self.metrics['bytes_processed']),
            'success_rate': (self.metrics['records_loaded'] / max(self.metrics['records_extracted'], 1)) * 100,
            'throughput_records_per_second': self.metrics['records_loaded'] / max(duration, 1),
            'error_count': len(self.metrics['errors']),
            'errors': self.metrics['errors'][:10]  # Limit to first 10 errors
        }
    
    def send_completion_alert(self):
        """Send pipeline completion alert"""
        summary = self.get_summary()
        
        status = 'success' if summary['error_count'] == 0 else 'warning'
        if summary['records_failed'] > summary['records_loaded'] * 0.1:  # More than 10% failure rate
            status = 'failure'
        
        details = (
            f"Duration: {summary['duration']}\n"
            f"Records: {summary['records_loaded']:,} loaded, {summary['records_failed']:,} failed\n"
            f"Success Rate: {summary['success_rate']:.1f}%\n"
            f"Throughput: {summary['throughput_records_per_second']:.1f} records/sec"
        )
        
        send_pipeline_alert(self.pipeline_name, status, details, summary)


# Import time for the retry decorator
import time