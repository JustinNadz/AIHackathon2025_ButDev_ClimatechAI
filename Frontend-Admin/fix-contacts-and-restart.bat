@echo off
echo EMERGENCY CONTACTS FIX PROCEDURE
echo ================================
echo.
echo This script will:
echo 1. Verify and fix emergency contacts in MongoDB
echo 2. Stop any running Next.js server
echo 3. Clear cache (.next directory)
echo 4. Restart the Next.js server
echo.

echo Step 1: Verifying emergency contacts in MongoDB...
node verify-emergency-contacts.js
echo.

echo Step 2: Stopping any running Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% EQU 0 (
  taskkill /F /IM node.exe /T >NUL 2>&1
  echo Node.js processes stopped.
) else (
  echo No Node.js processes found.
)
echo.

echo Step 3: Clearing Next.js cache...
if exist .next\ (
  rmdir /s /q .next 2>NUL
  echo .next directory removed.
) else (
  echo No .next directory found.
)
echo.

echo Step 4: Starting Next.js server...
echo The server will start now. To test if the emergency contacts API is working:
echo 1. Wait for server to start ("Ready" message)
echo 2. Open a new terminal
echo 3. Run: test-api-contacts.bat
echo.
echo Press Ctrl+C to stop the server when done.
echo.
npm run dev
