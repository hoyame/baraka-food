@echo off
cd /d "%~dp0"
if not exist logs mkdir logs

set PORT=4040
set HOSTNAME=0.0.0.0

:loop
echo. >> logs\staff.log
echo ================================================ >> logs\staff.log
echo [%date% %time%] DEMARRAGE staff (port %PORT%) >> logs\staff.log
echo ================================================ >> logs\staff.log
node staff\server.js >> logs\staff.log 2>&1
echo [%date% %time%] ARRET INATTENDU - code de sortie %errorlevel% >> logs\staff.log
timeout /t 3 /nobreak >nul
goto loop
