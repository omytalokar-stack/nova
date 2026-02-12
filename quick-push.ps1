#!/usr/bin/env pwsh

<#
Nova AI - Quick Push to GitHub & Auto-Deploy to Vercel
Run this script to push changes and trigger deployment pipeline
#>

Write-Host ""
Write-Host "🚀 Nova AI - Quick Push & Deploy" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if there are changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
    exit 0
}

Write-Host "📝 Changes detected:" -ForegroundColor Yellow
Write-Host $status
Write-Host ""

# Get commit message
Write-Host "Enter commit message (or press Enter for default):" -ForegroundColor Cyan
$message = Read-Host "Message"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Update: Nova AI changes"
}

try {
    # Build if needed
    $build = Read-Host "Build web assets? (y/n)"
    if ($build -eq "y" -or $build -eq "Y") {
        Write-Host ""
        Write-Host "[1/3] Building web assets..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        Write-Host "✓ Build complete" -ForegroundColor Green
    }

    # Git operations
    Write-Host ""
    Write-Host "[2/3] Committing and pushing..." -ForegroundColor Yellow
    git add .
    git commit -m $message
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        throw "Push failed"
    }
    Write-Host "✓ Pushed to GitHub" -ForegroundColor Green

    # Optional Vercel deploy
    Write-Host ""
    Write-Host "[3/3] Deploy to Vercel? (y/n)" -ForegroundColor Cyan
    $deploy = Read-Host "Deploy"
    if ($deploy -eq "y" -or $deploy -eq "Y") {
        Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
        vercel --prod --yes
        Write-Host "✓ Deployed to Vercel" -ForegroundColor Green
    } else {
        Write-Host "Note: Vercel will auto-deploy if GitHub is connected" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "✅ Complete!" -ForegroundColor Green
    Write-Host "🌐 Your app: https://nova-ai-gold.vercel.app" -ForegroundColor Cyan
    Write-Host "📦 GitHub: https://github.com/omytalokar-stack/nova" -ForegroundColor Cyan
    Write-Host "🤖 Android builds at: https://github.com/omytalokar-stack/nova/actions" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
