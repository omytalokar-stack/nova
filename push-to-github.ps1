#!/usr/bin/env pwsh

<#
Nova AI - Android Project Setup and Push to GitHub
This script prepares the project and pushes it to GitHub
#>

Write-Host ""
Write-Host "======================================"
Write-Host "Nova AI - Build and Push to GitHub" -ForegroundColor Cyan
Write-Host "======================================"
Write-Host ""

# Check if Git is installed
$gitExists = $null -ne (Get-Command git -ErrorAction SilentlyContinue)
if (-not $gitExists) {
    Write-Host "Error: Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

try {
    # Step 1: Build web assets
    Write-Host "[1/5] Building web assets..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Error building web assets"
    }
    Write-Host "✓ Web assets built successfully!" -ForegroundColor Green
    Write-Host ""

    # Step 2: Sync Capacitor
    Write-Host "[2/5] Syncing Capacitor..." -ForegroundColor Yellow
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        throw "Error syncing Capacitor"
    }
    Write-Host "✓ Capacitor synced successfully!" -ForegroundColor Green
    Write-Host ""

    # Step 3: Initialize git repository
    Write-Host "[3/5] Initializing Git repository..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -ne 0) {
        throw "Error initializing git"
    }
    Write-Host "✓ Git repository initialized!" -ForegroundColor Green
    Write-Host ""

    # Step 4: Add all files and commit
    Write-Host "[4/5] Adding files and creating first commit..." -ForegroundColor Yellow
    git add .
    git commit -m "Initial commit: Nova AI - Voice Assistant with Android"
    if ($LASTEXITCODE -ne 0) {
        throw "Error during commit"
    }
    Write-Host "✓ Files committed!" -ForegroundColor Green
    Write-Host ""

    # Step 5: Set main branch and add remote
    Write-Host "[5/5] Setting up remote repository..." -ForegroundColor Yellow
    git branch -M main
    if ($LASTEXITCODE -ne 0) {
        throw "Error setting main branch"
    }

    Write-Host ""
    Write-Host "Please enter your GitHub repository URL:" -ForegroundColor Cyan
    Write-Host "(e.g., https://github.com/YOUR_USERNAME/nova.git)"
    $githubRepo = Read-Host "GitHub URL"

    if ([string]::IsNullOrWhiteSpace($githubRepo)) {
        throw "GitHub URL is required"
    }

    git remote add origin $githubRepo
    git push -u origin main
    if ($LASTEXITCODE -ne 0) {
        throw "Error pushing to GitHub. Make sure you have push access to the repository"
    }
    Write-Host "✓ Pushed to GitHub successfully!" -ForegroundColor Green
    Write-Host ""

    Write-Host ""
    Write-Host "======================================"
    Write-Host "✓ Setup Complete!" -ForegroundColor Green
    Write-Host "======================================"
    Write-Host ""
    Write-Host "Your Nova AI project is now on GitHub!"
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. GitHub Actions will automatically build Android APK on push"
    Write-Host "  2. Check GitHub Actions tab to monitor builds"
    Write-Host "  3. Download APK artifacts from completed builds"
    Write-Host ""
    Write-Host "For local Android development:" -ForegroundColor Cyan
    Write-Host "  cd android"
    Write-Host "  ./gradlew build"
    Write-Host ""
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
