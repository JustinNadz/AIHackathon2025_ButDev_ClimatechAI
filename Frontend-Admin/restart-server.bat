@echo off
echo Checking for running Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
if %ERRORLEVEL% EQU 0 (
  echo Stopping running Next.js server...
  taskkill /F /IM node.exe /T >NUL 2>&1
) else (
  echo No Node.js processes found running.
)

echo Checking for .next directory...
if exist .next\ (
  echo Clearing Next.js cache...
  rmdir /s /q .next 2>NUL
) else (
  echo No .next directory found.
)

echo Starting Next.js server...
npm run dev
