@echo off
cd /d "%~dp0"

if not exist node_modules (
  echo Installation des dependances...
  call npm install
)

if not exist dist (
  echo Build de l'application...
  call npm run build
)

echo Demarrage de Baraka Food...
start "BarakaFood" /min node server\index.js
timeout /t 2 /nobreak >nul
start http://localhost:4000/admin
echo Serveur lance. Fermez cette fenetre, le serveur continue en arriere-plan.
pause
