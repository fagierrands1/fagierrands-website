# PowerShell script to build Fagi Errands for cPanel deployment

Write-Host "Building Fagi Errands for cPanel deployment..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Building production version..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Navigate to the 'build' folder" -ForegroundColor White
Write-Host "2. Select ALL contents of the build folder" -ForegroundColor White
Write-Host "3. Upload to your cPanel domain root (e.g., public_html/fagierrand/)" -ForegroundColor White
Write-Host "4. Ensure .htaccess file is included in the upload" -ForegroundColor White
Write-Host "5. Set proper file permissions (folders: 755, files: 644)" -ForegroundColor White
Write-Host ""
Write-Host "Build location: $PWD\build" -ForegroundColor Yellow
Write-Host ""

# Open build folder in explorer
if (Test-Path "build") {
    Write-Host "Opening build folder..." -ForegroundColor Green
    Invoke-Item "build"
}

Read-Host "Press Enter to exit"