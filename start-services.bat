@echo off
echo Starting Resume Screening Tool Services...

:: Check if MongoDB is installed
mongod --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo MongoDB is not installed or not in PATH. Please install MongoDB first.
    echo You can use Docker Compose instead: docker-compose up -d
    exit /b 1
)

:: Check if Redis is installed
redis-cli --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Redis is not installed or not in PATH. Please install Redis first.
    echo You can use Docker Compose instead: docker-compose up -d
    exit /b 1
)

:: Start Backend Service
echo Starting Backend Service...
start cmd /k "cd backend && npm install && npm start"

:: Wait a bit for backend to initialize
timeout /t 5

:: Start NLP Service
echo Starting NLP Service...
start cmd /k "cd nlp && pip install -r requirements_fixed.txt && python -m spacy download en_core_web_sm && python app.py"

:: Wait a bit for NLP service to initialize
timeout /t 5

:: Start Celery Worker for NLP tasks
echo Starting Celery Worker...
start cmd /k "cd nlp && celery -A celery_config worker --loglevel=info"

:: Start Frontend
echo Starting Frontend...
start cmd /k "cd frontend && npm install && npm start"

echo All services started. You can access the application at:
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo NLP API: http://localhost:5002