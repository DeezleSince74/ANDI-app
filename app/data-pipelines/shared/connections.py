"""
Database connections and utilities for ANDI data pipelines
"""

import os
import psycopg2
import clickhouse_connect
from typing import Optional, Dict, Any
from contextlib import contextmanager


class DatabaseConnections:
    """Centralized database connection management for ETL pipelines"""
    
    def __init__(self):
        self._pg_config = None
        self._ch_config = None
    
    @property
    def postgres_config(self) -> Dict[str, Any]:
        """Get PostgreSQL connection configuration"""
        if self._pg_config is None:
            self._pg_config = {
                'host': os.getenv('POSTGRES_HOST', 'localhost'),
                'port': int(os.getenv('POSTGRES_PORT', '5432')),
                'database': os.getenv('POSTGRES_DB', 'andi_db'),
                'user': os.getenv('POSTGRES_USER', 'andi_user'),
                'password': os.getenv('POSTGRES_PASSWORD', 'change_me_in_production')
            }
        return self._pg_config
    
    @property
    def clickhouse_config(self) -> Dict[str, Any]:
        """Get ClickHouse connection configuration"""
        if self._ch_config is None:
            self._ch_config = {
                'host': os.getenv('CLICKHOUSE_HOST', 'localhost'),
                'port': int(os.getenv('CLICKHOUSE_PORT', '8123')),
                'database': os.getenv('CLICKHOUSE_DB', 'andi_warehouse'),
                'username': os.getenv('CLICKHOUSE_USER', 'default'),
                'password': os.getenv('CLICKHOUSE_PASSWORD', '')
            }
        return self._ch_config
    
    @contextmanager
    def get_postgres_connection(self):
        """Get PostgreSQL connection context manager"""
        conn = None
        try:
            conn = psycopg2.connect(**self.postgres_config)
            yield conn
        finally:
            if conn:
                conn.close()
    
    @contextmanager
    def get_clickhouse_connection(self):
        """Get ClickHouse connection context manager"""
        client = None
        try:
            client = clickhouse_connect.get_client(**self.clickhouse_config)
            yield client
        finally:
            if client:
                client.close()
    
    def test_postgres_connection(self) -> bool:
        """Test PostgreSQL connection"""
        try:
            with self.get_postgres_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute('SELECT 1')
                    return cursor.fetchone()[0] == 1
        except Exception as e:
            print(f"PostgreSQL connection test failed: {e}")
            return False
    
    def test_clickhouse_connection(self) -> bool:
        """Test ClickHouse connection"""
        try:
            with self.get_clickhouse_connection() as client:
                result = client.command('SELECT 1')
                return result == 1
        except Exception as e:
            print(f"ClickHouse connection test failed: {e}")
            return False
    
    def test_all_connections(self) -> Dict[str, bool]:
        """Test all database connections"""
        return {
            'postgresql': self.test_postgres_connection(),
            'clickhouse': self.test_clickhouse_connection()
        }


# Global instance
db_connections = DatabaseConnections()


def get_postgres_hook():
    """Get Airflow PostgreSQL hook (if available)"""
    try:
        from airflow.providers.postgres.hooks.postgres import PostgresHook
        return PostgresHook(postgres_conn_id='postgres_andi')
    except ImportError:
        return None


def get_clickhouse_hook():
    """Get Airflow ClickHouse hook (if available)"""
    try:
        from airflow.providers.http.hooks.http import HttpHook
        return HttpHook(http_conn_id='clickhouse_andi')
    except ImportError:
        return None


def create_airflow_connections():
    """Create Airflow connections programmatically"""
    try:
        from airflow.models import Connection
        from airflow import settings
        
        session = settings.Session()
        
        # PostgreSQL connection
        pg_conn = Connection(
            conn_id='postgres_andi',
            conn_type='postgres',
            host=db_connections.postgres_config['host'],
            port=db_connections.postgres_config['port'],
            schema=db_connections.postgres_config['database'],
            login=db_connections.postgres_config['user'],
            password=db_connections.postgres_config['password']
        )
        
        # ClickHouse connection (using HTTP)
        ch_conn = Connection(
            conn_id='clickhouse_andi',
            conn_type='http',
            host=db_connections.clickhouse_config['host'],
            port=db_connections.clickhouse_config['port'],
            schema=db_connections.clickhouse_config['database'],
            login=db_connections.clickhouse_config['username'],
            password=db_connections.clickhouse_config['password']
        )
        
        # Check if connections exist and create/update them
        existing_pg = session.query(Connection).filter(Connection.conn_id == 'postgres_andi').first()
        if existing_pg:
            session.delete(existing_pg)
        
        existing_ch = session.query(Connection).filter(Connection.conn_id == 'clickhouse_andi').first()
        if existing_ch:
            session.delete(existing_ch)
        
        session.add(pg_conn)
        session.add(ch_conn)
        session.commit()
        session.close()
        
        print("Airflow connections created successfully")
        
    except ImportError:
        print("Airflow not available, skipping connection creation")
    except Exception as e:
        print(f"Failed to create Airflow connections: {e}")


if __name__ == '__main__':
    # Test connections when run directly
    print("Testing database connections...")
    results = db_connections.test_all_connections()
    
    for db, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{db}: {status}")
    
    # Create Airflow connections
    create_airflow_connections()