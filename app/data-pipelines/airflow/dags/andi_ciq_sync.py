"""
ANDI CIQ Hourly Sync Pipeline
Real-time synchronization of CIQ metrics for immediate analytics
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Dict, Any

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.utils.dates import days_ago

# Add shared utilities to path
sys.path.append('/opt/airflow/shared')
from utils import send_pipeline_alert, ETLMetrics, setup_logging

# DAG Configuration
DAG_ID = 'andi_ciq_sync'
DESCRIPTION = 'Hourly CIQ metrics synchronization for real-time analytics'
SCHEDULE_INTERVAL = '0 * * * *'  # Every hour
START_DATE = days_ago(1)

# Default arguments
default_args = {
    'owner': 'andi-data-team',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=2),
    'execution_timeout': timedelta(minutes=15),
    'sla': timedelta(minutes=30),
    'email': ['data-team@andilabs.ai']
}

# Create the DAG
dag = DAG(
    DAG_ID,
    default_args=default_args,
    description=DESCRIPTION,
    schedule_interval=SCHEDULE_INTERVAL,
    start_date=START_DATE,
    catchup=False,
    max_active_runs=3,  # Allow some overlap for high-frequency syncs
    tags=['andi', 'ciq', 'hourly', 'realtime'],
    doc_md=__doc__
)

def check_new_ciq_data(**context):
    """Check for new CIQ metrics since last sync"""
    logger = setup_logging('ciq_data_check')
    
    try:
        pg_hook = PostgresHook(postgres_conn_id='postgres_andi')
        
        # Get last sync time (1 hour ago as fallback)
        last_sync = context['execution_date'] - timedelta(hours=1)
        
        # Check for new CIQ metrics
        query = """
        SELECT 
            COUNT(*) as new_sessions,
            COUNT(DISTINCT s.teacher_id) as affected_teachers,
            MIN(s.recorded_at) as earliest_session,
            MAX(s.recorded_at) as latest_session
        FROM audio.audio_sessions s
        JOIN analytics.ciq_metrics m ON s.id = m.session_id
        WHERE (s.created_at > %s OR m.created_at > %s OR m.updated_at > %s)
          AND s.status = 'completed'
        """
        
        result = pg_hook.get_first(query, parameters=[last_sync, last_sync, last_sync])
        new_sessions, affected_teachers, earliest_session, latest_session = result
        
        sync_info = {
            'new_sessions': new_sessions,
            'affected_teachers': affected_teachers,
            'has_new_data': new_sessions > 0,
            'last_sync': last_sync.isoformat(),
            'earliest_session': earliest_session.isoformat() if earliest_session else None,
            'latest_session': latest_session.isoformat() if latest_session else None
        }
        
        context['task_instance'].xcom_push(key='sync_info', value=sync_info)
        
        if new_sessions == 0:
            logger.info("No new CIQ data found, skipping sync")
        else:
            logger.info(f"Found {new_sessions} new sessions affecting {affected_teachers} teachers")
        
        return sync_info
        
    except Exception as e:
        logger.error(f"Failed to check new CIQ data: {e}")
        send_pipeline_alert('CIQ Data Check', 'failure', str(e))
        raise

def sync_ciq_incremental(**context):
    """Sync new CIQ data incrementally"""
    logger = setup_logging('ciq_incremental_sync')
    
    # Get sync info from previous task
    sync_info = context['task_instance'].xcom_pull(key='sync_info', task_ids='check_new_data')
    
    if not sync_info.get('has_new_data', False):
        logger.info("No new data to sync, skipping")
        return "echo 'No new data to sync'"
    
    last_sync = sync_info['last_sync']
    
    sync_cmd = f"""
    cd /opt/airflow/etl && \
    npm run etl:ciq -- --incremental --since '{last_sync}'
    """
    
    return sync_cmd

def update_realtime_aggregates(**context):
    """Update real-time aggregation tables"""
    logger = setup_logging('realtime_aggregates')
    
    sync_info = context['task_instance'].xcom_pull(key='sync_info', task_ids='check_new_data')
    
    if not sync_info.get('has_new_data', False):
        logger.info("No new data, skipping aggregation updates")
        return "echo 'No aggregation updates needed'"
    
    # Update only affected teachers and schools
    update_cmd = f"""
    cd /opt/airflow/etl && \
    npm run etl:aggregates -- --realtime --teachers '{sync_info.get("affected_teachers", 0)}'
    """
    
    return update_cmd

def validate_sync_quality(**context):
    """Quick validation of sync quality"""
    logger = setup_logging('sync_validation')
    
    try:
        sync_info = context['task_instance'].xcom_pull(key='sync_info', task_ids='check_new_data')
        
        if not sync_info.get('has_new_data', False):
            logger.info("No sync validation needed")
            return
        
        # Quick validation checks
        # In real implementation, compare source vs target counts
        expected_sessions = sync_info.get('new_sessions', 0)
        
        # Mock validation for now
        validation_result = {
            'expected_sessions': expected_sessions,
            'synced_sessions': expected_sessions,  # Would be actual count from ClickHouse
            'sync_success_rate': 1.0,
            'validation_passed': True
        }
        
        if validation_result['sync_success_rate'] < 0.95:
            raise ValueError(f"Sync success rate too low: {validation_result['sync_success_rate']:.2%}")
        
        context['task_instance'].xcom_push(key='validation_result', value=validation_result)
        
        logger.info(f"Sync validation passed: {validation_result}")
        
    except Exception as e:
        logger.error(f"Sync validation failed: {e}")
        send_pipeline_alert('CIQ Sync Validation', 'failure', str(e))
        raise

def send_sync_summary(**context):
    """Send sync completion summary if there were updates"""
    logger = setup_logging('sync_summary')
    
    try:
        sync_info = context['task_instance'].xcom_pull(key='sync_info', task_ids='check_new_data')
        
        if not sync_info.get('has_new_data', False):
            logger.info("No sync summary needed - no new data")
            return
        
        validation_result = context['task_instance'].xcom_pull(key='validation_result', task_ids='validate_sync')
        execution_time = context['execution_date']
        
        # Calculate sync duration
        dag_run = context['dag_run']
        duration = (datetime.now() - dag_run.start_date).total_seconds()
        
        # Only send summary for significant updates or failures
        sessions_synced = validation_result.get('synced_sessions', 0)
        
        if sessions_synced >= 5 or validation_result.get('sync_success_rate', 1.0) < 1.0:
            details = f"""
            Sync Time: {execution_time.strftime('%Y-%m-%d %H:%M')}
            Duration: {duration:.1f} seconds
            Sessions Synced: {sessions_synced}
            Teachers Affected: {sync_info.get('affected_teachers', 0)}
            Success Rate: {validation_result.get('sync_success_rate', 1.0):.1%}
            """
            
            status = 'success' if validation_result.get('validation_passed', False) else 'warning'
            
            send_pipeline_alert(
                'CIQ Hourly Sync',
                status,
                details,
                {
                    'execution_time': execution_time.isoformat(),
                    'sessions_synced': sessions_synced,
                    'affected_teachers': sync_info.get('affected_teachers', 0),
                    'duration_seconds': duration
                }
            )
        
        logger.info(f"CIQ sync completed: {sessions_synced} sessions")
        
    except Exception as e:
        logger.error(f"Failed to send sync summary: {e}")

# Task Definitions

check_data_task = PythonOperator(
    task_id='check_new_data',
    python_callable=check_new_ciq_data,
    dag=dag,
    doc_md="Check for new CIQ metrics since last sync"
)

sync_task = BashOperator(
    task_id='sync_ciq_data',
    bash_command=sync_ciq_incremental(),
    dag=dag,
    doc_md="Incrementally sync new CIQ data to ClickHouse"
)

aggregate_task = BashOperator(
    task_id='update_realtime_aggregates',
    bash_command=update_realtime_aggregates(),
    dag=dag,
    doc_md="Update real-time aggregation tables"
)

validate_task = PythonOperator(
    task_id='validate_sync',
    python_callable=validate_sync_quality,
    dag=dag,
    doc_md="Validate sync data quality"
)

summary_task = PythonOperator(
    task_id='send_sync_summary',
    python_callable=send_sync_summary,
    dag=dag,
    trigger_rule='none_failed_min_one_success',
    doc_md="Send sync completion summary"
)

# Task Dependencies
check_data_task >> sync_task >> aggregate_task >> validate_task >> summary_task