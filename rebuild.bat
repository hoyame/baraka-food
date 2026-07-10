@echo off
cd /d "%~dp0"
taskkill /f /fi "WINDOWTITLE eq BarakaFood*" >nul 2>&1
call npm install
call npm run build
start "BarakaFood" /min node server\index.js
echo Rebuild termine, serveur relance.
pause
