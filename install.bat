@echo off
setlocal EnableDelayedExpansion

echo ===========================================
echo   HopeFlow Toolbox Development Installer
echo   For Windows
echo ===========================================

:: 1. Install Dependencies
echo.
echo [1/4] Installing dependencies...
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed. Please check your Node.js installation.
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

:: 2. Build Project
echo.
echo [2/4] Building project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

:: 3. Enable Debug Mode (Registry)
echo.
echo [3/4] Enabling PlayerDebugMode in Registry...
echo Note: This requires Administrator privileges if writing to HKLM, but usually HKCU works for per-user.

:: Set Debug Mode for CSXS 9 to 16 (covering various versions)
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.13" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.14" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.15" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.16" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

echo Debug mode enabled.

:: 4. Create Symlink (or Copy)
echo.
echo [4/4] Deploying to Adobe Extensions folder...

set "EXTENSION_ID=com.hopeflow.toolbox"
set "DEST_DIR=%APPDATA%\Adobe\CEP\extensions\%EXTENSION_ID%"
set "SOURCE_DIR=%CD%"

:: Check if destination exists
if exist "%DEST_DIR%" (
    echo Removing existing extension link/folder...
    rmdir /s /q "%DEST_DIR%"
)

:: Create extensions directory if it doesn't exist
if not exist "%APPDATA%\Adobe\CEP\extensions" (
    mkdir "%APPDATA%\Adobe\CEP\extensions"
)

:: Create Symbolic Link (requires Admin usually) or Junction (no admin needed for local folders usually)
:: We use mklink /J (Junction) which links directories and works well without Admin in many cases
echo Creating junction point...
mklink /J "%DEST_DIR%" "%SOURCE_DIR%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===========================================
    echo   Installation Complete!
    echo   Please restart Adobe Illustrator.
    echo   Find plugin at: Window > Extensions > HopeFlow Toolbox
    echo ===========================================
) else (
    echo.
    echo [ERROR] Failed to create link.
    echo Try running this script as Administrator.
)

pause
