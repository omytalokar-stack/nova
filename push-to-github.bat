@echo off
REM Nova AI - Android Project Setup and Push to GitHub
REM This script prepares the project and pushes it to GitHub

setlocal enabledelayedexpansion

echo.
echo ======================================
echo Nova AI - Build and Push to GitHub
echo ======================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not in PATH
    exit /b 1
)

REM Step 1: Build web assets
echo [1/5] Building web assets...
call npm run build
if %errorlevel% neq 0 (
    echo Error building web assets
    exit /b 1
)
echo ✓ Web assets built successfully!
echo.

REM Step 2: Sync Capacitor
echo [2/5] Syncing Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Error syncing Capacitor
    exit /b 1
)
echo ✓ Capacitor synced successfully!
echo.

REM Step 3: Initialize git repository
echo [3/5] Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo Error initializing git
    exit /b 1
)
echo ✓ Git repository initialized!
echo.

REM Step 4: Add all files and commit
echo [4/5] Adding files and creating first commit...
git add .
git commit -m "Initial commit: Nova AI - Voice Assistant with Android"
if %errorlevel% neq 0 (
    echo Error during commit
    exit /b 1
)
echo ✓ Files committed!
echo.

REM Step 5: Set main branch and add remote
echo [5/5] Setting up remote repository...
git branch -M main
if %errorlevel% neq 0 (
    echo Error setting main branch
    exit /b 1
)

REM User needs to provide the GitHub URL
echo.
echo Please enter your GitHub repository URL:
echo (e.g., https://github.com/YOUR_USERNAME/nova.git)
set /p GITHUB_REPO="GitHub URL: "

if "!GITHUB_REPO!"=="" (
    echo Error: GitHub URL is required
    exit /b 1
)

git remote add origin !GITHUB_REPO!
git push -u origin main
if %errorlevel% neq 0 (
    echo Error pushing to GitHub
    echo Make sure you have push access to the repository
    exit /b 1
)
echo ✓ Pushed to GitHub successfully!
echo.

echo.
echo ======================================
echo ✓ Setup Complete!
echo ======================================
echo.
echo Your Nova AI project is now on GitHub!
echo Next steps:
echo 1. GitHub Actions will automatically build Android APK on push
echo 2. Check GitHub Actions tab to monitor builds
echo 3. Download APK artifacts from completed builds
echo.
echo For local Android development:
echo   cd android
echo   ./gradlew build
echo.

endlocal
