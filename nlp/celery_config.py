#!/usr/bin/env python3
"""
Celery configuration for NLP Resume Screening Tool
"""

import os
import sys
import socket

# Add error handling for celery import
try:
    from celery import Celery
    print("✓ Celery imported successfully")
except ImportError as e:
    print(f"❌ Failed to import Celery: {e}")
    print("Make sure you're in the virtual environment and Celery is installed:")
    print("pip install celery")
    sys.exit(1)

# Define potential Redis hosts to try (in order of preference)
redis_hosts = [
    'localhost',          # Standard localhost
    '127.0.0.1',          # IPv4 localhost
    '172.17.0.1',         # Common Docker bridge
    '192.168.1.1',        # Common WSL2 host address
    '::1',                # IPv6 localhost
    # Add any potential WSL IP address here
    os.environ.get('WSL_HOST_IP', '')  # Use environment variable if set
]

# Filter out empty values
redis_hosts = [h for h in redis_hosts if h]

# Get broker and backend URLs from environment or try multiple hosts
broker_url = os.environ.get('CELERY_BROKER_URL')
result_backend = os.environ.get('CELERY_RESULT_BACKEND')

if not broker_url:
    # Try to find a working Redis server
    for host in redis_hosts:
        try:
            # Try to connect to Redis
            import redis
            test_url = f'redis://{host}:6379/0'
            print(f"Testing Redis connection to: {test_url}")
            
            r = redis.Redis.from_url(test_url)
            r.ping()  # Will raise an exception if connection fails
            
            # If successful, use this host
            broker_url = test_url
            result_backend = test_url
            print(f"✓ Successfully connected to Redis at {host}")
            break
        except Exception as e:
            print(f"Cannot connect to Redis at {host}: {e}")
    
    # If all attempts failed, fall back to default
    if not broker_url:
        print("! Could not find working Redis server, using localhost as fallback")
        broker_url = 'redis://localhost:6379/0'
        result_backend = 'redis://localhost:6379/0'
else:
    print(f"Using environment-provided Redis URL: {broker_url}")

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