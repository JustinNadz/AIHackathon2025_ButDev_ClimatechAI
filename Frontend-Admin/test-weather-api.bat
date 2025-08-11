@echo off
echo Testing Weather API Integration
echo ===============================
echo.
echo This script will test the weather API endpoints
echo and verify that data is being saved to MongoDB.
echo.
echo Make sure your Next.js server is running on port 3000
echo before running this test.
echo.

node test-weather-api.js
echo.
pause
