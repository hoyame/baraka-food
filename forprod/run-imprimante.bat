@echo off
cd /d "%~dp0"
if not exist logs mkdir logs

:loop
echo. >> logs\imprimante.log
echo ================================================ >> logs\imprimante.log
echo [%date% %time%] DEMARRAGE imprimante >> logs\imprimante.log
echo ================================================ >> logs\imprimante.log
node server\print-listener.js >> logs\imprimante.log 2>&1
echo [%date% %time%] ARRET INATTENDU - code de sortie %errorlevel% >> logs\imprimante.log
timeout /t 3 /nobreak >nul
goto loop
