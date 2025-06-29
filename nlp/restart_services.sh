#!/bin/bash

echo "=== Restarting NLP Services ==="

# Kill any existing processes
echo "Stopping existing services..."
pkill -f "python app.py" || true
pkill -f "celery -A celery_config" || true

# Get the host IP address that can be accessed from Windows
if [[ "$(uname -a)" == *WSL* ]]; then
  # In WSL, get IP address
  HOST_IP=$(hostname -I | awk '{print $1}')
else
  # On regular Linux
  HOST_IP=$(hostname -I | awk '{print $1}')
  # If empty or localhost, try alternative
  if [[ -z "$HOST_IP" || "$HOST_IP" == "127.0.0.1" ]]; then
    HOST_IP=$(ip route get 1.1.1.1 | awk '{print $7}')
  fi
fi

echo "Host IP detected as: $HOST_IP"
export WSL_HOST_IP=$HOST_IP
export CELERY_BROKER_URL="redis://$HOST_IP:6379/0"
export CELERY_RESULT_BACKEND="redis://$HOST_IP:6379/0"

echo "Broker URL: $CELERY_BROKER_URL"

# Check if Redis is running
echo "Checking Redis status..."
if redis-cli ping > /dev/null 2>&1; then
  echo "Redis is running"
else
  echo "Redis is not running! Starting Redis..."
  redis-server &
  sleep 2
  if redis-cli ping > /dev/null 2>&1; then
    echo "Redis started successfully"
  else
    echo "Failed to start Redis. Please start it manually with 'redis-server'"
    exit 1
  fi
fi

# Start Flask server in background
echo "Starting NLP service..."
python app.py > logs/nlp_app.log 2>&1 &
NLP_PID=$!
echo "NLP service started with PID: $NLP_PID"

# Wait for Flask to start
echo "Waiting for NLP service to start..."
sleep 5

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A celery_config worker --loglevel=info > logs/celery_worker.log 2>&1 &
CELERY_PID=$!
echo "Celery worker started with PID: $CELERY_PID"

echo "=== Services started ==="
echo "- NLP API running at http://localhost:5002"
echo "- Celery worker connected to Redis at $CELERY_BROKER_URL"
echo ""
echo "Service PIDs:"
echo "- NLP Service: $NLP_PID"
echo "- Celery Worker: $CELERY_PID"
echo ""
echo "To stop services, run: kill $NLP_PID $CELERY_PID"
echo "Logs available in logs/nlp_app.log and logs/celery_worker.log" 