@echo off
echo Initializing Database with Distinct Emergency Contacts
echo This will ensure we can distinguish between mock data and real database data
echo.

node initialize-db.js
echo.
echo If successful, please restart your Next.js server
echo You can do this by running: .\start-fixed-server.bat
echo.
