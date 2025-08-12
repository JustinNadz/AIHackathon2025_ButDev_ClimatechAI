@echo off
echo Verifying and fixing emergency contacts in MongoDB
echo =================================================
echo.
echo This script will check if the emergency contacts collection exists
echo and has data. If not, it will add test contacts to the database.
echo.

node verify-emergency-contacts.js
echo.
echo If successful, please restart your Next.js server
echo You can do this by running: npm run dev
echo.
pause
