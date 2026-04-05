@echo off
echo Building Fagi Errands for cPanel deployment...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Building production version...
npm run build

if errorlevel 1 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo Next steps:
echo 1. Navigate to the 'build' folder
echo 2. Select ALL contents of the build folder
echo 3. Upload to your cPanel domain root (e.g., public_html/fagierrand/)
echo 4. Ensure .htaccess file is included in the upload
echo 5. Set proper file permissions (folders: 755, files: 644)
echo.
echo Build location: %cd%\build
echo.

REM Open build folder in explorer
if exist "build" (
    echo Opening build folder...
    explorer "build"
)

pause