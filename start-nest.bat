@echo off
echo Starting ZLAGODA...

start "ZLAGODA Backend" cmd /k "cd backend-nest && npm run start:debug"

timeout /t 2 /nobreak >nul

cd frontend
npm run start
