@echo off
echo Starting fixed Next.js server...
echo.
echo This script uses the completely rewritten server.js with proper static file handling
echo and works around both the app.serveStatic error and the redirect loop issues.
echo.
echo Press Ctrl+C to stop the server.
echo.

node server.js
