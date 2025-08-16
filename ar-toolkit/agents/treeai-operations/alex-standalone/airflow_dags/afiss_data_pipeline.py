#!/usr/bin/env python3
"""
TreeAI AFISS Data Pipeline - Apache Airflow DAG
Handles 340+ AFISS factors, real-time updates, and data quality validation
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
import logging

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.sensors.s3_key_sensor import S3KeySensor
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.redis.operators.redis_publish import RedisPublishOperator
from airflow.providers.http.sensors.http import HttpSensor
from airflow.models import Variable
from airflow.utils.task_group import TaskGroup
from airflow.utils.dates import days_ago

# DAG Configuration
default_args = {
    'owner': 'treeai-data-engineering',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(minutes=30)
}

dag = DAG(
    'treeai_afiss_data_pipeline',
    default_args=default_args,
    description='TreeAI AFISS factor management and validation pipeline',
    schedule_interval=timedelta(hours=6),  # Every 6 hours
    max_active_runs=1,
    catchup=False,
    tags=['treeai', 'afiss', 'data-quality', 'real-time']
)

# Configuration from Airflow Variables
AFISS_FACTOR_COUNT = int(Variable.get("afiss_factor_count", 340))
DOMAIN_WEIGHTS = json.loads(Variable.get("afiss_domain_weights", 
    '{"access": 0.20, "fall_zone": 0.25, "interference": 0.20, "severity": 0.30, "site_conditions": 0.05}'))
POSTGRES_CONN = Variable.get("postgres_conn_id", "treeai_postgres")
REDIS_CONN = Variable.get("redis_conn_id", "treeai_redis")

def extract_afiss_factor_updates(**context) -> Dict[str, Any]:
    """Extract AFISS factor updates from source systems"""
    
    # Import dependencies
    import pandas as pd
    import sqlalchemy as sa
    from airflow.providers.postgres.hooks.postgres import PostgresHook
    
    postgres_hook = PostgresHook(postgres_conn_id=POSTGRES_CONN)
    
    # Get latest AFISS factor updates
    query = """
    SELECT 
        factor_id,
        factor_code,
        domain_name,
        base_percentage,
        description,
        trigger_conditions,
        multiplier_rules,
        last_updated,
        version
    FROM afiss_factors
    WHERE last_updated > NOW() - INTERVAL '6 hours'
    OR version = 'latest'
    ORDER BY domain_name, factor_code
    """
    
    df = postgres_hook.get_pandas_df(query)
    logging.info(f"Extracted {len(df)} AFISS factor updates")
    
    # Validate factor count
    total_factors = postgres_hook.get_first("SELECT COUNT(*) FROM afiss_factors WHERE version = 'latest'")[0]
    if total_factors != AFISS_FACTOR_COUNT:
        raise ValueError(f"Expected {AFISS_FACTOR_COUNT} factors, found {total_factors}")
    
    # Return summary for downstream tasks
    return {
        'updated_factors': len(df),
        'total_factors': total_factors,
        'domains': df['domain_name'].unique().tolist(),
        'extraction_timestamp': datetime.now().isoformat()
    }

def validate_afiss_factor_integrity(**context) -> Dict[str, Any]:
    """Validate AFISS factor data integrity and business rules"""
    
    from airflow.providers.postgres.hooks.postgres import PostgresHook
    
    postgres_hook = PostgresHook(postgres_conn_id=POSTGRES_CONN)
    
    validation_results = {
        'validation_timestamp': datetime.now().isoformat(),
        'checks_passed': 0,
        'checks_failed': 0,
        'errors': []
    }
    
    # Validation 1: Domain weight totals
    domain_check = """
    SELECT domain_name, SUM(base_percentage * weight) as weighted_total
    FROM afiss_factors f
    JOIN afiss_domain_weights w ON f.domain_name = w.domain_name
    WHERE f.version = 'latest'
    GROUP BY domain_name
    """
    
    domain_results = postgres_hook.get_pandas_df(domain_check)
    expected_total = sum(DOMAIN_WEIGHTS.values())
    
    if abs(domain_results['weighted_total'].sum() - expected_total) > 0.01:
        validation_results['errors'].append(f"Domain weights don't sum to {expected_total}")
        validation_results['checks_failed'] += 1
    else:
        validation_results['checks_passed'] += 1
    
    # Validation 2: Factor percentage ranges
    range_check = """
    SELECT COUNT(*) as invalid_factors
    FROM afiss_factors
    WHERE version = 'latest'
    AND (base_percentage < 0 OR base_percentage > 100)
    """
    
    invalid_factors = postgres_hook.get_first(range_check)[0]
    if invalid_factors > 0:
        validation_results['errors'].append(f"{invalid_factors} factors have invalid percentages")
        validation_results['checks_failed'] += 1
    else:
        validation_results['checks_passed'] += 1
    
    # Validation 3: Required factor coverage
    coverage_check = """
    SELECT domain_name, COUNT(*) as factor_count
    FROM afiss_factors
    WHERE version = 'latest'
    GROUP BY domain_name
    """
    
    coverage_results = postgres_hook.get_pandas_df(coverage_check)
    min_factors_per_domain = 5  # Business rule
    
    for _, row in coverage_results.iterrows():
        if row['factor_count'] < min_factors_per_domain:
            validation_results['errors'].append(
                f"Domain {row['domain_name']} has only {row['factor_count']} factors"
            )
            validation_results['checks_failed'] += 1
        else:
            validation_results['checks_passed'] += 1
    
    # Validation 4: Factor code uniqueness
    uniqueness_check = """
    SELECT factor_code, COUNT(*) as occurrences
    FROM afiss_factors
    WHERE version = 'latest'
    GROUP BY factor_code
    HAVING COUNT(*) > 1
    """
    
    duplicates = postgres_hook.get_pandas_df(uniqueness_check)
    if len(duplicates) > 0:
        validation_results['errors'].append(f"Found {len(duplicates)} duplicate factor codes")
        validation_results['checks_failed'] += 1
    else:
        validation_results['checks_passed'] += 1
    
    logging.info(f"AFISS validation completed: {validation_results['checks_passed']} passed, {validation_results['checks_failed']} failed")
    
    if validation_results['checks_failed'] > 0:
        raise ValueError(f"AFISS validation failed: {validation_results['errors']}")
    
    return validation_results

def update_afiss_calculation_cache(**context) -> Dict[str, Any]:
    """Update Redis cache with latest AFISS calculation matrices"""
    
    import redis
    import pickle
    import numpy as np
    from airflow.providers.postgres.hooks.postgres import PostgresHook
    from airflow.providers.redis.hooks.redis_hook import RedisHook
    
    postgres_hook = PostgresHook(postgres_conn_id=POSTGRES_CONN)
    redis_hook = RedisHook(redis_conn_id=REDIS_CONN)
    redis_client = redis_hook.get_conn()
    
    # Build factor lookup matrices
    factor_query = """
    SELECT 
        factor_code,
        domain_name,
        base_percentage,
        multiplier_rules
    FROM afiss_factors
    WHERE version = 'latest'
    ORDER BY domain_name, factor_code
    """
    
    factors_df = postgres_hook.get_pandas_df(factor_query)
    
    # Create domain-specific calculation matrices
    cache_updates = {
        'cache_timestamp': datetime.now().isoformat(),
        'matrices_updated': 0,
        'cache_keys': []
    }
    
    for domain in factors_df['domain_name'].unique():
        domain_factors = factors_df[factors_df['domain_name'] == domain]
        
        # Create lookup matrix for this domain
        factor_matrix = {}
        for _, factor in domain_factors.iterrows():
            factor_matrix[factor['factor_code']] = {
                'base_percentage': factor['base_percentage'],
                'multiplier_rules': json.loads(factor['multiplier_rules']) if factor['multiplier_rules'] else {},
                'domain_weight': DOMAIN_WEIGHTS.get(domain, 0.0)
            }
        
        # Cache the matrix
        cache_key = f"afiss:domain:{domain}:matrix"
        redis_client.setex(
            cache_key,
            timedelta(hours=12),  # 12 hour TTL
            pickle.dumps(factor_matrix)
        )
        
        cache_updates['matrices_updated'] += 1
        cache_updates['cache_keys'].append(cache_key)
        
        logging.info(f"Cached {len(factor_matrix)} factors for domain {domain}")
    
    # Create composite calculation lookup
    composite_matrix = {
        'domain_weights': DOMAIN_WEIGHTS,
        'total_factors': len(factors_df),
        'last_updated': datetime.now().isoformat()
    }
    
    redis_client.setex(
        "afiss:composite:config",
        timedelta(hours=12),
        pickle.dumps(composite_matrix)
    )
    
    cache_updates['cache_keys'].append("afiss:composite:config")
    
    logging.info(f"Updated {cache_updates['matrices_updated']} AFISS calculation matrices in cache")
    
    return cache_updates

def validate_cache_performance(**context) -> Dict[str, Any]:
    """Validate that cache updates improve calculation performance"""
    
    import time
    import redis
    import pickle
    from airflow.providers.redis.hooks.redis_hook import RedisHook
    
    redis_hook = RedisHook(redis_conn_id=REDIS_CONN)
    redis_client = redis_hook.get_conn()
    
    performance_results = {
        'test_timestamp': datetime.now().isoformat(),
        'cache_tests': [],
        'avg_lookup_time_ms': 0,
        'cache_hit_ratio': 0
    }
    
    # Test cache performance for each domain
    domains = list(DOMAIN_WEIGHTS.keys())
    total_lookup_time = 0
    cache_hits = 0
    
    for domain in domains:
        cache_key = f"afiss:domain:{domain}:matrix"
        
        # Test cache lookup performance
        start_time = time.time()
        cached_data = redis_client.get(cache_key)
        lookup_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        total_lookup_time += lookup_time
        
        if cached_data:
            cache_hits += 1
            matrix = pickle.loads(cached_data)
            factor_count = len(matrix)
            
            performance_results['cache_tests'].append({
                'domain': domain,
                'lookup_time_ms': lookup_time,
                'factor_count': factor_count,
                'cache_hit': True
            })
        else:
            performance_results['cache_tests'].append({
                'domain': domain,
                'lookup_time_ms': lookup_time,
                'factor_count': 0,
                'cache_hit': False
            })
    
    performance_results['avg_lookup_time_ms'] = total_lookup_time / len(domains)
    performance_results['cache_hit_ratio'] = cache_hits / len(domains)
    
    # Performance SLA check
    max_lookup_time_ms = 50  # Business requirement
    min_cache_hit_ratio = 0.95  # Business requirement
    
    if performance_results['avg_lookup_time_ms'] > max_lookup_time_ms:
        raise ValueError(f"Cache lookup too slow: {performance_results['avg_lookup_time_ms']:.2f}ms > {max_lookup_time_ms}ms")
    
    if performance_results['cache_hit_ratio'] < min_cache_hit_ratio:
        raise ValueError(f"Cache hit ratio too low: {performance_results['cache_hit_ratio']:.2f} < {min_cache_hit_ratio}")
    
    logging.info(f"Cache performance validation passed: {performance_results['avg_lookup_time_ms']:.2f}ms avg, {performance_results['cache_hit_ratio']:.2%} hit ratio")
    
    return performance_results

def notify_alex_engine_update(**context) -> str:
    """Notify Alex's assessment engine that AFISS data has been updated"""
    
    import requests
    from airflow.models import Variable
    
    alex_webhook_url = Variable.get("alex_webhook_url", "")
    
    if not alex_webhook_url:
        logging.warning("Alex webhook URL not configured, skipping notification")
        return "skipped"
    
    notification_payload = {
        'event_type': 'afiss_data_update',
        'timestamp': datetime.now().isoformat(),
        'pipeline_run_id': context['run_id'],
        'updated_factors': context['task_instance'].xcom_pull(task_ids='extract_afiss_updates')['updated_factors'],
        'validation_status': 'passed',
        'cache_update_status': 'completed'
    }
    
    try:
        response = requests.post(
            alex_webhook_url,
            json=notification_payload,
            timeout=30,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        
        logging.info(f"Successfully notified Alex engine: {response.status_code}")
        return "success"
        
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to notify Alex engine: {str(e)}")
        # Don't fail the pipeline for notification failures
        return "failed"

# Task Groups for better organization
with TaskGroup("afiss_data_extraction", dag=dag) as extraction_group:
    
    # Check for external AFISS updates
    check_external_updates = HttpSensor(
        task_id='check_external_afiss_updates',
        http_conn_id='treeai_external_api',
        endpoint='afiss/updates/available',
        request_params={'since': '{{ prev_ds }}'},
        poke_interval=60,
        timeout=300,
        mode='poke'
    )
    
    # Extract AFISS factor updates
    extract_factors = PythonOperator(
        task_id='extract_afiss_updates',
        python_callable=extract_afiss_factor_updates,
        provide_context=True
    )
    
    check_external_updates >> extract_factors

with TaskGroup("afiss_data_validation", dag=dag) as validation_group:
    
    # Validate factor integrity
    validate_factors = PythonOperator(
        task_id='validate_factor_integrity',
        python_callable=validate_afiss_factor_integrity,
        provide_context=True
    )
    
    # Run data quality checks
    quality_checks = PostgresOperator(
        task_id='run_data_quality_checks',
        postgres_conn_id=POSTGRES_CONN,
        sql="""
        -- Check for orphaned factors
        SELECT COUNT(*) as orphaned_factors
        FROM afiss_factors f
        LEFT JOIN afiss_domain_weights w ON f.domain_name = w.domain_name
        WHERE w.domain_name IS NULL
        AND f.version = 'latest';
        
        -- Verify factor distribution
        SELECT 
            domain_name,
            COUNT(*) as factor_count,
            AVG(base_percentage) as avg_percentage,
            MIN(base_percentage) as min_percentage,
            MAX(base_percentage) as max_percentage
        FROM afiss_factors
        WHERE version = 'latest'
        GROUP BY domain_name;
        """,
        autocommit=True
    )
    
    validate_factors >> quality_checks

with TaskGroup("afiss_cache_update", dag=dag) as cache_group:
    
    # Update calculation cache
    update_cache = PythonOperator(
        task_id='update_calculation_cache',
        python_callable=update_afiss_calculation_cache,
        provide_context=True
    )
    
    # Validate cache performance
    validate_cache = PythonOperator(
        task_id='validate_cache_performance',
        python_callable=validate_cache_performance,
        provide_context=True
    )
    
    # Refresh Alex engine cache
    refresh_alex_cache = RedisPublishOperator(
        task_id='refresh_alex_cache',
        redis_conn_id=REDIS_CONN,
        channel='alex:cache:refresh',
        message='{{ task_instance.xcom_pull(task_ids="update_calculation_cache") }}'
    )
    
    update_cache >> validate_cache >> refresh_alex_cache

# Final notification task
notify_alex = PythonOperator(
    task_id='notify_alex_engine',
    python_callable=notify_alex_engine_update,
    provide_context=True
)

# Pipeline dependencies
extraction_group >> validation_group >> cache_group >> notify_alex

# Add monitoring and alerting
from airflow.operators.email import EmailOperator

pipeline_success_notification = EmailOperator(
    task_id='pipeline_success_notification',
    to=['treeai-data-engineering@company.com'],
    subject='TreeAI AFISS Pipeline Success - {{ ds }}',
    html_content="""
    <h3>TreeAI AFISS Data Pipeline Completed Successfully</h3>
    <p><strong>Run ID:</strong> {{ run_id }}</p>
    <p><strong>Execution Date:</strong> {{ ds }}</p>
    <p><strong>Factors Updated:</strong> {{ task_instance.xcom_pull(task_ids='extract_afiss_updates')['updated_factors'] }}</p>
    <p><strong>Validation Status:</strong> Passed</p>
    <p><strong>Cache Update:</strong> Completed</p>
    <p><strong>Alex Engine:</strong> Notified</p>
    """,
    trigger_rule='all_success'
)

notify_alex >> pipeline_success_notification