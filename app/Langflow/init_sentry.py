#!/usr/bin/env python3
"""
Langflow Sentry Initialization Script
Initializes Sentry monitoring for Langflow AI workflows
"""

import os
import sys
from pathlib import Path

# Add utils to Python path
current_dir = Path(__file__).parent
utils_dir = current_dir / "utils"
sys.path.insert(0, str(utils_dir))

from sentry import initialize_sentry, sentry_monitor

def main():
    """Initialize Sentry monitoring for Langflow"""
    print("🚀 Initializing ANDI Langflow with Sentry monitoring...")
    
    # Initialize Sentry
    initialize_sentry()
    
    if sentry_monitor.initialized:
        print("✅ Sentry monitoring initialized successfully")
        
        # Set initial context
        sentry_monitor.set_flow_context(
            flow_id="langflow_init",
            flow_name="Langflow Initialization",
            metadata={
                "langflow_version": os.getenv("LANGFLOW_VERSION", "latest"),
                "environment": os.getenv("SENTRY_ENVIRONMENT", "development"),
                "mode": "runtime" if os.getenv("LANGFLOW_BACKEND_ONLY", "false").lower() == "true" else "ide"
            }
        )
        
        # Add initialization breadcrumb
        sentry_monitor.add_breadcrumb(
            message="Langflow started with Sentry monitoring",
            category="initialization",
            level="info",
            data={
                "sentry_dsn_configured": bool(os.getenv("SENTRY_DSN")),
                "environment": os.getenv("SENTRY_ENVIRONMENT"),
                "traces_sample_rate": os.getenv("SENTRY_TRACES_SAMPLE_RATE")
            }
        )
        
        print("📊 Sentry context and breadcrumbs configured")
        
    else:
        print("⚠️  Sentry monitoring not configured - running without monitoring")
    
    print("🎯 Langflow initialization complete")

if __name__ == "__main__":
    main()