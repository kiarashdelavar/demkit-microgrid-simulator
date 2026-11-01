@echo off
setlocal

REM This file is in workspace\touchtable\. Go two folders up to the repo root.
for %%I in ("%~dp0..\..") do set "REPO_ROOT=%%~fI"
set "PYTHON_EXE=%REPO_ROOT%\.venv\Scripts\python.exe"
set "WEB_DIR=%REPO_ROOT%\workspace\touchtable\web"

if not exist "%PYTHON_EXE%" (
    echo Python virtual environment not found: "%PYTHON_EXE%"
    echo Please follow docs\CONFIGURATION_GUIDE.md to create .venv.
    exit /b 1
)
if not exist "%REPO_ROOT%\demkittt\conf\usrconf.py" (
    echo Missing local DEMKit config: demkittt\conf\usrconf.py
    echo Copy usrconf.example.py to usrconf.py as explained in the setup guide.
    exit /b 1
)
if not exist "%WEB_DIR%\node_modules" (
    echo Node.js packages are not installed. Run npm ci in "%WEB_DIR%".
    exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js was not found on PATH.
    exit /b 1
)

echo Starting DEMKit using "%REPO_ROOT%"
start "DEMKit Python" /D "%REPO_ROOT%" "%PYTHON_EXE%" "%REPO_ROOT%\demkittt\demkit.py" -f touchtable/model -m touchtable
REM Temporary delay inherited from the old launcher; readiness checks are BK-08.
timeout /t 30 /nobreak >nul
start "DEMKit Web" /D "%WEB_DIR%" cmd /k node index.js
echo Open http://localhost:3002 once the Node.js window is ready.
endlocal
