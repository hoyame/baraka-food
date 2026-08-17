@echo off
cd /d "%~dp0"
if not exist logs mkdir logs

:loop
echo. >> logs\ecrans.log
echo ================================================ >> logs\ecrans.log
echo [%date% %time%] DEMARRAGE ecrans >> logs\ecrans.log
echo ================================================ >> logs\ecrans.log
node server\index.js >> logs\ecrans.log 2>&1
echo [%date% %time%] ARRET INATTENDU - code de sortie %errorlevel% >> logs\ecrans.log
timeout /t 3 /nobreak >nul
goto loop
