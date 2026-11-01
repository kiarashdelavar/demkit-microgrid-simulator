@echo off
setlocal

REM Find the repository from the location of this batch file.
for %%I in ("%~dp0..\..") do set "REPO_ROOT=%%~fI"
set "PYTHON_EXE=%REPO_ROOT%\.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
    echo [Launcher] Python virtual environment not found.
    echo [Launcher] Please follow docs\CONFIGURATION_GUIDE.md to set up .venv.
    pause
    exit /b 1
)

REM One window starts and monitors both Python and Node.js.
"%PYTHON_EXE%" "%REPO_ROOT%\scripts\launch_demkit.py"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
    echo [Launcher] Startup failed. Review the message above.
    pause
)
endlocal & exit /b %RESULT%
