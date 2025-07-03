# ANDI Database Connector Component for Langflow
# Connects to ANDI PostgreSQL database with Sentry monitoring

from typing import Dict, List, Any, Optional
from langflow import CustomComponent
from langflow.field_typing import Data, Text
from langflow.interface.custom.custom_component import CustomComponent
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys
from datetime import datetime, timedelta

# Add utils to path for Sentry integration
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
from sentry import sentry_monitor, track_db_query, track_component


class ANDIDatabaseConnector(CustomComponent):
    """
    ANDI Database Connector Component
    
    Connects to ANDI PostgreSQL database to fetch CIQ data,
    teacher information, and session analytics with Sentry monitoring.
    """
    
    display_name = "ANDI Database Connector"
    description = "Connect to ANDI PostgreSQL database for CIQ data and analytics"
    icon = "database"
    
    def build_config(self) -> Dict[str, Any]:
        return {
            "database_host": {
                "display_name": "Database Host",
                "field_type": "str",
                "required": True,
                "value": os.getenv("POSTGRES_HOST", "localhost")
            },
            "database_port": {
                "display_name": "Database Port",
                "field_type": "int",
                "required": True,
                "value": int(os.getenv("POSTGRES_PORT", "5432"))
            },
            "database_name": {
                "display_name": "Database Name",
                "field_type": "str",
                "required": True,
                "value": os.getenv("POSTGRES_DB", "andi_db")
            },
            "username": {
                "display_name": "Username",
                "field_type": "str",
                "required": True,
                "value": os.getenv("POSTGRES_USER", "andi_user")
            },
            "password": {
                "display_name": "Password",
                "field_type": "str",
                "required": True,
                "password": True,
                "value": os.getenv("POSTGRES_PASSWORD", "")
            },
            "query_type": {
                "display_name": "Query Type",
                "field_type": "str",
                "required": True,
                "options": [
                    "ciq_sessions",
                    "teacher_data",
                    "session_analytics",
                    "custom_query"
                ],
                "value": "ciq_sessions"
            },
            "custom_query": {
                "display_name": "Custom Query",
                "field_type": "str",
                "required": False,
                "multiline": True,
                "value": ""
            },
            "teacher_id": {
                "display_name": "Teacher ID",
                "field_type": "str",
                "required": False,
                "value": ""
            },
            "date_from": {
                "display_name": "Date From",
                "field_type": "str",
                "required": False,
                "value": ""
            },
            "date_to": {
                "display_name": "Date To",
                "field_type": "str",
                "required": False,
                "value": ""
            },
            "limit": {
                "display_name": "Limit Results",
                "field_type": "int",
                "required": False,
                "value": 100
            }
        }
    
    @track_component("DatabaseConnector", "ANDI_DB")
    def build(
        self,
        database_host: str,
        database_port: int,
        database_name: str,
        username: str,
        password: str,
        query_type: str,
        custom_query: str = "",
        teacher_id: str = "",
        date_from: str = "",
        date_to: str = "",
        limit: int = 100
    ) -> Data:
        """
        Connect to ANDI database and fetch data based on query type
        """
        
        # Add breadcrumb for debugging
        sentry_monitor.add_breadcrumb(
            message=f"Starting ANDI database query: {query_type}",
            category="database",
            level="info",
            data={
                "query_type": query_type,
                "teacher_id": teacher_id,
                "date_from": date_from,
                "date_to": date_to,
                "limit": limit
            }
        )
        
        try:
            # Build connection string
            conn_string = f"host={database_host} port={database_port} dbname={database_name} user={username} password={password}"
            
            # Connect to database
            with psycopg2.connect(conn_string) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    
                    # Build query based on type
                    if query_type == "ciq_sessions":
                        query, params = self._build_ciq_sessions_query(teacher_id, date_from, date_to, limit)
                    elif query_type == "teacher_data":
                        query, params = self._build_teacher_data_query(teacher_id, limit)
                    elif query_type == "session_analytics":
                        query, params = self._build_session_analytics_query(teacher_id, date_from, date_to, limit)
                    elif query_type == "custom_query":
                        if not custom_query.strip():
                            raise ValueError("Custom query cannot be empty")
                        query, params = custom_query, []
                    else:
                        raise ValueError(f"Unknown query type: {query_type}")
                    
                    # Execute query with monitoring
                    result = self._execute_query(cursor, query, params, query_type)
                    
                    # Convert to DataFrame for better handling
                    df = pd.DataFrame(result)
                    
                    # Add metadata
                    metadata = {
                        "query_type": query_type,
                        "row_count": len(df),
                        "executed_at": datetime.utcnow().isoformat(),
                        "teacher_id": teacher_id,
                        "date_range": f"{date_from} to {date_to}" if date_from and date_to else None
                    }
                    
                    # Track success metrics
                    sentry_monitor.track_flow_metrics(
                        flow_id="andi_db_connector",
                        metrics={
                            "records_fetched": len(df),
                            "query_success": 1.0
                        }
                    )
                    
                    return Data(
                        data=df.to_dict('records'),
                        metadata=metadata
                    )
                    
        except Exception as e:
            # Log error with context
            sentry_monitor.log_component_error(
                component_type="DatabaseConnector",
                component_name="ANDI_DB",
                error=e,
                context={
                    "query_type": query_type,
                    "teacher_id": teacher_id,
                    "database_host": database_host,
                    "database_name": database_name
                }
            )
            
            # Track error metrics
            sentry_monitor.track_flow_metrics(
                flow_id="andi_db_connector",
                metrics={
                    "query_error": 1.0
                }
            )
            
            raise
    
    @track_db_query("andi_db", "select")
    def _execute_query(self, cursor, query: str, params: List[Any], query_type: str) -> List[Dict[str, Any]]:
        """Execute database query with monitoring"""
        sentry_monitor.add_breadcrumb(
            message=f"Executing {query_type} query",
            category="database",
            level="info",
            data={"query_preview": query[:200] + "..." if len(query) > 200 else query}
        )
        
        cursor.execute(query, params)
        return cursor.fetchall()
    
    def _build_ciq_sessions_query(self, teacher_id: str, date_from: str, date_to: str, limit: int) -> tuple:
        """Build CIQ sessions query"""
        query = """
            SELECT 
                s.id,
                s.session_date,
                s.session_duration,
                s.teacher_id,
                t.name as teacher_name,
                t.school_id,
                sc.name as school_name,
                s.grade_level,
                s.subject,
                s.session_type,
                s.total_interactions,
                s.student_engagement_score,
                s.learning_objectives_met,
                s.created_at,
                s.updated_at
            FROM ciq_sessions s
            JOIN teachers t ON s.teacher_id = t.id
            JOIN schools sc ON t.school_id = sc.id
            WHERE 1=1
        """
        
        params = []
        
        if teacher_id:
            query += " AND s.teacher_id = %s"
            params.append(teacher_id)
        
        if date_from:
            query += " AND s.session_date >= %s"
            params.append(date_from)
        
        if date_to:
            query += " AND s.session_date <= %s"
            params.append(date_to)
        
        query += " ORDER BY s.session_date DESC LIMIT %s"
        params.append(limit)
        
        return query, params
    
    def _build_teacher_data_query(self, teacher_id: str, limit: int) -> tuple:
        """Build teacher data query"""
        query = """
            SELECT 
                t.id,
                t.name,
                t.email,
                t.school_id,
                s.name as school_name,
                s.district_id,
                d.name as district_name,
                t.grade_levels,
                t.subjects,
                t.years_experience,
                t.certification_level,
                t.created_at,
                COUNT(cs.id) as total_sessions,
                AVG(cs.student_engagement_score) as avg_engagement_score,
                MAX(cs.session_date) as last_session_date
            FROM teachers t
            JOIN schools s ON t.school_id = s.id
            JOIN districts d ON s.district_id = d.id
            LEFT JOIN ciq_sessions cs ON t.id = cs.teacher_id
            WHERE 1=1
        """
        
        params = []
        
        if teacher_id:
            query += " AND t.id = %s"
            params.append(teacher_id)
        
        query += """
            GROUP BY t.id, t.name, t.email, t.school_id, s.name, s.district_id, d.name, 
                     t.grade_levels, t.subjects, t.years_experience, t.certification_level, t.created_at
            ORDER BY t.name
            LIMIT %s
        """
        params.append(limit)
        
        return query, params
    
    def _build_session_analytics_query(self, teacher_id: str, date_from: str, date_to: str, limit: int) -> tuple:
        """Build session analytics query"""
        query = """
            SELECT 
                DATE(s.session_date) as session_date,
                COUNT(*) as session_count,
                AVG(s.session_duration) as avg_duration,
                AVG(s.total_interactions) as avg_interactions,
                AVG(s.student_engagement_score) as avg_engagement,
                AVG(s.learning_objectives_met) as avg_objectives_met,
                COUNT(DISTINCT s.teacher_id) as unique_teachers,
                COUNT(DISTINCT t.school_id) as unique_schools
            FROM ciq_sessions s
            JOIN teachers t ON s.teacher_id = t.id
            WHERE 1=1
        """
        
        params = []
        
        if teacher_id:
            query += " AND s.teacher_id = %s"
            params.append(teacher_id)
        
        if date_from:
            query += " AND s.session_date >= %s"
            params.append(date_from)
        
        if date_to:
            query += " AND s.session_date <= %s"
            params.append(date_to)
        
        query += """
            GROUP BY DATE(s.session_date)
            ORDER BY session_date DESC
            LIMIT %s
        """
        params.append(limit)
        
        return query, params