@echo off
echo ==========================================
echo Starting AI Pipeline Test...
echo ==========================================

"%~dp0venv\Scripts\python.exe" "%~dp0test_pipeline.py"

echo.
pause
