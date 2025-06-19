@echo off
echo Starting Resume Screening Tool with Docker Compose...

:: Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed or not in PATH. Please install Docker first.
    exit /b 1
)

:: Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker Compose is not installed or not in PATH. Please install Docker Compose first.
    exit /b 1
)

:: Start the services with Docker Compose
echo Building and starting services...
docker-compose up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo Failed to start services with Docker Compose.
    exit /b 1
)

echo All services started successfully with Docker Compose.
echo You can access the application at:
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo NLP API: http://localhost:5002

echo To stop the services, run: docker-compose down