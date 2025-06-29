import os
import sys
import redis
import socket
from celery_config import app as celery_app

print("===== NLP Service Diagnostic Tool =====")

# Check Redis connectivity
print("\n--- Redis Connectivity ---")
broker_url = celery_app.conf.broker_url
result_backend = celery_app.conf.result_backend

print(f"Broker URL: {broker_url}")
print(f"Result Backend: {result_backend}")

# Parse host from broker URL
try:
    redis_host = broker_url.split('@')[1].split(':')[0] if '@' in broker_url else broker_url.split('//')[1].split(':')[0]
    redis_port = int(broker_url.split(':')[-1].split('/')[0])
    print(f"Parsed Redis host: {redis_host}:{redis_port}")
except Exception as e:
    print(f"Error parsing Redis URL: {e}")
    redis_host = 'localhost'
    redis_port = 6379

# Try to connect to Redis
try:
    r = redis.Redis(host=redis_host, port=redis_port, socket_connect_timeout=5)
    if r.ping():
        print("✅ Redis connection successful")
    else:
        print("❌ Redis ping failed")
except Exception as e:
    print(f"❌ Redis connection failed: {e}")

# Try WSL Redis if on Windows
if os.name == 'nt':
    print("\n--- Checking WSL Redis ---")
    try:
        # Try common WSL IP addresses
        wsl_ips = ['172.17.0.1', '172.18.0.1', '192.168.1.1']
        
        for wsl_ip in wsl_ips:
            try:
                print(f"Testing WSL Redis at {wsl_ip}...")
                r_wsl = redis.Redis(host=wsl_ip, port=6379, socket_connect_timeout=2)
                if r_wsl.ping():
                    print(f"✅ WSL Redis connection successful at {wsl_ip}")
                    print(f"Consider using: redis://{wsl_ip}:6379/0")
                    break
            except:
                continue
    except Exception as e:
        print(f"Error checking WSL Redis: {e}")

# Check Celery task status
print("\n--- Celery Status ---")
try:
    i = celery_app.control.inspect()
    stats = i.stats()
    if stats:
        print("✅ Celery workers are running")
        print(f"Active workers: {list(stats.keys())}")
    else:
        print("❌ No Celery workers are running")
except Exception as e:
    print(f"❌ Error inspecting Celery: {e}")

# Print environment variables
print("\n--- Environment Variables ---")
print(f"CELERY_BROKER_URL: {os.environ.get('CELERY_BROKER_URL', 'Not set')}")
print(f"CELERY_RESULT_BACKEND: {os.environ.get('CELERY_RESULT_BACKEND', 'Not set')}")
print(f"WSL_HOST_IP: {os.environ.get('WSL_HOST_IP', 'Not set')}")

print("\n--- Network Info ---")
try:
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"Hostname: {hostname}")
    print(f"Local IP: {local_ip}")
except Exception as e:
    print(f"Error getting network info: {e}")

print("\n===== End of Diagnostic =====") 