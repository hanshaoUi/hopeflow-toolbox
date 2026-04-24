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

powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File "%INSTALLER%" -Gui
exit /b %ERRORLEVEL%

:help
echo HopeFlow Toolbox GUI installer
echo.
echo Usage:
echo   HopeFlow-Installer.bat
echo.
exit /b 0
