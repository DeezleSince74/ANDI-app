#!/usr/bin/env node

/**
 * Sentry Integration Test Script
 * Tests error tracking and performance monitoring across ANDI components
 */

require('dotenv').config();

// Test database layer Sentry integration
async function testDatabaseSentry() {
  console.log('🔍 Testing Database Layer Sentry Integration...');
  
  try {
    // Import after dotenv config
    const { initializeSentry, sentryLogger, withDatabaseContext, trackDatabaseMetrics } = require('../app/app-database/lib/dist/sentry');
    
    // Initialize Sentry
    initializeSentry();
    
    // Test structured logging
    sentryLogger.info('Database test started', { 
      test_type: 'sentry_integration',
      component: 'database'
    });
    
    // Test performance tracking
    await withDatabaseContext('test_operation', { test: true }, async () => {
      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true };
    });
    
    // Test metrics tracking
    trackDatabaseMetrics('test_query', 150, { 
      query_type: 'SELECT',
      table: 'test_table'
    });
    
    // Test warning
    sentryLogger.warn('Test warning from database layer', {
      warning_type: 'test',
      severity: 'low'
    });
    
    // Test error capture
    try {
      throw new Error('Test error from database layer');
    } catch (error) {
      sentryLogger.error('Caught test error', error, {
        error_context: 'sentry_test',
        component: 'database'
      });
    }
    
    console.log('✅ Database Layer: Sentry events sent successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database Layer: Sentry test failed:', error.message);
    return false;
  }
}

// Test data pipelines Sentry integration  
async function testPipelinesSentry() {
  console.log('🔍 Testing Data Pipelines Sentry Integration...');
  
  try {
    // Test TypeScript ETL utilities
    const { initializeSentry, createPipelineLogger, withETLContext, trackDataQuality } = require('../app/data-pipelines/etl/dist/utils/sentry');
    
    // Initialize Sentry
    initializeSentry();
    
    // Test pipeline logger
    const logger = createPipelineLogger('test_pipeline', 'extract');
    logger.info('Pipeline test started', { test_mode: true });
    
    // Test ETL context tracking
    await withETLContext(
      'test_pipeline',
      'transform', 
      'data_validation',
      { records: 1000, source: 'test_db' },
      async () => {
        // Simulate ETL operation
        await new Promise(resolve => setTimeout(resolve, 200));
        return { processed: 1000, errors: 0 };
      }
    );
    
    // Test data quality tracking
    trackDataQuality('test_pipeline', [
      { name: 'null_check', passed: true, value: 0, threshold: 0 },
      { name: 'range_check', passed: false, value: 5, threshold: 2, message: 'Values out of range' }
    ]);
    
    // Test error capture
    logger.error('Test pipeline error', new Error('Pipeline processing failed'), {
      pipeline_stage: 'transform',
      batch_id: 'test_batch_001'
    });
    
    console.log('✅ Data Pipelines: Sentry events sent successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Data Pipelines: Sentry test failed:', error.message);
    return false;
  }
}

// Test Python Airflow integration (if available)
async function testAirflowSentry() {
  console.log('🔍 Testing Airflow Sentry Integration...');
  
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Test Python Sentry integration
    const pythonTest = `
import sys
import os
sys.path.append('${__dirname}/../app/data-pipelines')

try:
    from shared.sentry_config import initialize_sentry, create_dag_logger, track_pipeline_metrics
    
    # Initialize Sentry
    initialize_sentry()
    print("✓ Sentry initialized")
    
    # Test DAG logger
    logger = create_dag_logger('test_dag', 'test_task')
    logger.info('Airflow test started', {'test_mode': True})
    print("✓ DAG logger created")
    
    # Test metrics tracking
    track_pipeline_metrics('test_dag', 'test_task', {
        'duration_ms': 1500,
        'records_processed': 500,
        'success_rate': 98.5
    })
    print("✓ Metrics tracked")
    
    # Test error capture
    logger.error('Test Airflow error', Exception('Airflow task failed'), {
        'dag_run_id': 'test_run_001',
        'execution_date': '2024-01-01'
    })
    print("✓ Error captured")
    
    print("✅ Airflow Sentry integration test completed")
    
except Exception as e:
    print(f"❌ Airflow test failed: {str(e)}")
    sys.exit(1)
`;
    
    await execAsync(`python3 -c "${pythonTest}"`, {
      cwd: __dirname,
      env: { ...process.env, PYTHONPATH: `${__dirname}/../app/data-pipelines` }
    });
    
    console.log('✅ Airflow: Sentry events sent successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Airflow: Sentry test failed:', error.message);
    return false;
  }
}

// Main test function
async function runSentryTests() {
  console.log('🚀 ANDI Sentry Integration Test Suite');
  console.log('=====================================');
  
  // Check if Sentry DSN is configured
  if (!process.env.SENTRY_DSN) {
    console.error('❌ SENTRY_DSN environment variable not configured');
    console.log('💡 Please set SENTRY_DSN in your .env file');
    process.exit(1);
  }
  
  console.log(`📡 Sentry DSN: ${process.env.SENTRY_DSN.substring(0, 30)}...`);
  console.log(`🌍 Environment: ${process.env.SENTRY_ENVIRONMENT || 'development'}`);
  console.log(`📦 Release: ${process.env.SENTRY_RELEASE || 'unknown'}`);
  console.log('');
  
  const results = [];
  
  // Run tests
  results.push(await testDatabaseSentry());
  results.push(await testPipelinesSentry());
  results.push(await testAirflowSentry());
  
  // Summary
  console.log('');
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('');
    console.log('🎉 All Sentry integration tests passed!');
    console.log('🔗 Check your Sentry dashboard for captured events:');
    console.log(`   https://sentry.io/organizations/your-org/issues/`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Configure alert rules in Sentry dashboard');
    console.log('   2. Set up Slack/email notifications');
    console.log('   3. Create performance monitoring dashboards');
    console.log('   4. Test in production environment');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Please check the error messages above.');
    console.log('📖 Refer to docs/SENTRY_SETUP.md for troubleshooting guide.');
    process.exit(1);
  }
  
  // Wait for events to be sent
  console.log('');
  console.log('⏳ Waiting for events to be sent to Sentry...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('✅ Test completed!');
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);  
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runSentryTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runSentryTests,
  testDatabaseSentry,
  testPipelinesSentry,
  testAirflowSentry
};