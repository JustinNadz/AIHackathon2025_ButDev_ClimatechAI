@echo off
echo Rebuilding and starting the ClimaTech-AI Frontend
echo ==================================================
echo.

echo Step 1: Stopping any running servers...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% EQU 0 (
  echo Stopping Node.js processes...
  taskkill /F /IM node.exe /T >NUL 2>&1
) else (
  echo No Node.js processes found running.
)
echo.

echo Step 2: Cleaning existing build files...
if exist .next\ (
  echo Removing .next directory...
  rmdir /s /q .next 2>NUL
  echo Done.
) else (
  echo No .next directory found.
)
echo.

echo Step 3: Installing dependencies...
call npm install --save --legacy-peer-deps
echo.

echo Step 4: Building the Next.js application...
call npm run build
echo.

echo Step 5: Starting the application...
echo.
echo Application is starting at http://localhost:3000
echo.
node server.js
