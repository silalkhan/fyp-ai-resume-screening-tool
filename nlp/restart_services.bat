@echo off
echo === Restarting NLP Services ===

REM Kill any existing Python processes for the NLP service
echo Stopping existing services...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq NLP*" >nul 2>&1
taskkill /F /IM celery.exe /FI "WINDOWTITLE eq CELERY*" >nul 2>&1

REM Set environment variables for WSL Redis if needed
echo Setting environment variables...

REM Try to get WSL IP address - adjust as needed
FOR /F "tokens=*" %%g IN ('wsl hostname -I') do (SET WSL_IP=%%g)
echo WSL IP detected as: %WSL_IP%
SET WSL_HOST_IP=%WSL_IP%
SET CELERY_BROKER_URL=redis://%WSL_IP%:6379/0
SET CELERY_RESULT_BACKEND=redis://%WSL_IP%:6379/0

echo Broker URL: %CELERY_BROKER_URL%

REM Start Flask server in a new window
echo Starting NLP service...
start "NLP Server" cmd /k "cd %~dp0 && python app.py"

REM Wait for Flask to start
timeout /t 5

REM Start Celery worker in a new window
echo Starting Celery worker...
start "CELERY Worker" cmd /k "cd %~dp0 && celery -A celery_config worker --loglevel=info"

echo === Services started ===
echo - NLP API running at http://localhost:5002
echo - Celery worker connected to Redis at %CELERY_BROKER_URL%
echo.
echo You can close this window now. 