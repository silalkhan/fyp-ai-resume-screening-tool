#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Resume Screening Tool Services...${NC}"

# Start Backend Service
echo -e "${YELLOW}Starting Backend Service...${NC}"
cd backend
npm start &
BACKEND_PID=$!
echo -e "${GREEN}Backend Service started with PID: $BACKEND_PID${NC}"

# Wait a bit for backend to initialize
sleep 2

# Start NLP Service
echo -e "${YELLOW}Starting NLP Service...${NC}"
cd ../nlp
source venv/bin/activate
python app.py &
NLP_PID=$!
echo -e "${GREEN}NLP Service started with PID: $NLP_PID${NC}"

# Wait a bit for NLP service to initialize
sleep 2

# Start Celery Worker for NLP tasks
echo -e "${YELLOW}Starting Celery Worker...${NC}"
cd ../nlp
celery -A utils.tasks worker --loglevel=info &
CELERY_PID=$!
echo -e "${GREEN}Celery Worker started with PID: $CELERY_PID${NC}"

# Start Frontend (optional)
echo -e "${YELLOW}Do you want to start the Frontend as well? (y/n)${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo -e "${YELLOW}Starting Frontend...${NC}"
  cd ../frontend
  npm start &
  FRONTEND_PID=$!
  echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
fi

echo -e "${GREEN}All services are running!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to kill processes when script is terminated
function cleanup {
  echo -e "${YELLOW}Stopping all services...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $NLP_PID 2>/dev/null
  kill $CELERY_PID 2>/dev/null
  if [[ -n $FRONTEND_PID ]]; then
    kill $FRONTEND_PID 2>/dev/null
  fi
  echo -e "${GREEN}All services stopped${NC}"
  exit 0
}

# Register the cleanup function for exit signals
trap cleanup SIGINT SIGTERM

# Keep script running
wait 