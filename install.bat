@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
set "INSTALLER=%ROOT_DIR%tools\windows-installer.ps1"

if /I "%~1"=="/?" goto :help
if /I "%~1"=="-h" goto :help
if /I "%~1"=="--help" goto :help

if not exist "%INSTALLER%" (
    echo [ERROR] Installer script not found:
    echo "%INSTALLER%"
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER%" %*
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo [ERROR] Installation failed. Exit code: %EXIT_CODE%
    pause
    exit /b %EXIT_CODE%
)

echo.
echo Installation complete.
pause
exit /b 0

:help
echo HopeFlow Toolbox command line installer
echo.
echo Usage:
echo   install.bat             Install or update
echo   install.bat -Uninstall  Uninstall
echo   install.bat -Check      Check package only
echo.
exit /b 0
