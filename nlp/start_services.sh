#!/bin/bash
# Script to start the NLP service and Celery worker

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  echo "Activating virtual environment..."
  source venv/bin/activate
fi

# Make sure dependencies are installed
pip install -r requirements.txt

# Add any missing dependencies
echo "Ensuring all dependencies are installed..."
pip install six==1.16.0 python-dateutil==2.8.2 docx2txt

# Set environment variables for better debugging
export PYTHONUNBUFFERED=1

# Start Redis if not running (uncomment if you want to manage Redis from this script)
# redis-server &
# sleep 2

# Check if Redis is running
echo "Checking Redis status..."
if ! redis-cli ping > /dev/null 2>&1; then
  echo "Redis is not running! Please start Redis first."
  echo "You can do this by running: redis-server"
  exit 1
fi

# Clean up any old log files
mkdir -p logs
> logs/nlp_service.log
> logs/celery_worker.log

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A celery_config worker --loglevel=info > logs/celery_worker.log 2>&1 &
CELERY_PID=$!

# Wait for Celery to start
sleep 3

# Check if Celery worker is running
if ! ps -p $CELERY_PID > /dev/null; then
  echo "ERROR: Celery worker failed to start. Check logs/celery_worker.log for details."
  cat logs/celery_worker.log
  exit 1
fi

echo "Celery worker started successfully with PID: $CELERY_PID"

# Start Flask app
echo "Starting NLP service..."
python app.py > logs/nlp_service.log 2>&1 &
FLASK_PID=$!

# Wait for Flask to start
sleep 3

# Check if Flask is running
if ! ps -p $FLASK_PID > /dev/null; then
  echo "ERROR: Flask app failed to start. Check logs/nlp_service.log for details."
  cat logs/nlp_service.log
  # Kill Celery worker before exiting
  kill $CELERY_PID
  exit 1
fi

echo "NLP service started successfully with PID: $FLASK_PID"

# Print startup summary
echo ""
echo "Services started successfully:"
echo "- Celery worker: PID $CELERY_PID"
echo "- NLP service: PID $FLASK_PID"
echo ""
echo "Logs:"
echo "- Celery: logs/celery_worker.log"
echo "- NLP service: logs/nlp_service.log"
echo ""
echo "To stop services, run: kill $CELERY_PID $FLASK_PID"
echo "Or use: pkill -f 'celery|app.py'"
echo ""
echo "API Endpoints:"
echo "- NLP service: http://localhost:5002/"
echo "- API docs: http://localhost:5002/docs"

# Make the script wait here
echo ""
echo "Press Ctrl+C to stop all services..."
wait 