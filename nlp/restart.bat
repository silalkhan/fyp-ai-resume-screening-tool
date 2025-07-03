@echo off
echo Restarting NLP Service...

REM Kill any existing Python processes if needed
taskkill /IM python.exe /F

REM Start Flask app in a new window
start cmd /k "cd %~dp0 && python app.py"

REM Start Celery worker in a new window
start cmd /k "cd %~dp0 && celery -A celery_config worker --loglevel=INFO -P solo"

echo NLP Service restart initiated.
echo Flask API and Celery worker should be starting in separate windows.
echo Please check the windows for any error messages. 