@echo off
echo Starting ZLAGODA...

start "ZLAGODA Backend" cmd /k "cd backend && python -m main"

timeout /t 2 /nobreak >nul

cd frontend
npm run start
