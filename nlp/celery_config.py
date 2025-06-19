#!/usr/bin/env python3
"""
Celery configuration for NLP Resume Screening Tool
"""

import os
import sys

# Add error handling for celery import
try:
    from celery import Celery
    print("✓ Celery imported successfully")
except ImportError as e:
    print(f"❌ Failed to import Celery: {e}")
    print("Make sure you're in the virtual environment and Celery is installed:")
    print("pip install celery")
    sys.exit(1)

# Get broker and backend URLs from environment or use defaults
broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Create Celery application
app = Celery(
    'nlp',
    broker=broker_url,
    backend=result_backend,
    include=['utils.tasks']  # Make sure this path exists
)

# Configure Celery settings
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minute time limit per task
    worker_prefetch_multiplier=1,  # Prefetch only one task at a time
    # Windows-specific settings
    worker_pool='solo' if os.name == 'nt' else 'prefork',
    # Remove task routes to use default queue
    task_default_queue='celery',
    # Add task always eager for debugging
    task_always_eager=False,
    task_create_missing_queues=True
)

# Test task to verify Celery is working
@app.task
def health_check():
    """Simple health check task"""
    return {
        'status': 'healthy',
        'message': 'Celery worker is running',
        'broker': broker_url
    }

# Print configuration details for debugging
if __name__ == '__main__':
    print("=" * 50)
    print("Celery Configuration")
    print("=" * 50)
    print(f"Broker URL: {broker_url}")
    print(f"Result Backend: {result_backend}")
    print(f"Python Version: {sys.version}")
    print(f"Python Executable: {sys.executable}")
    print("=" * 50)
    
    # Test Redis connection
    try:
        import redis
        r = redis.Redis.from_url(broker_url)
        r.ping()
        print("✓ Redis connection successful")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        print("Make sure Redis server is running")
    
    print("Configuration complete!")
else:
    print(f"Celery configured with broker: {broker_url}")
    print(f"Celery result backend: {result_backend}")