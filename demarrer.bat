@echo off
setlocal

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

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

set "URL1=http://localhost:4000/1"
set "URL2=http://localhost:4000/2"
set "URL3=http://localhost:4000/3"

set "X1=0"
set "Y1=0"

set "X2=1366"
set "Y2=0"

set "X3=2732"
set "Y3=0"

set "P1=%TEMP%\chrome-screen-1"
set "P2=%TEMP%\chrome-screen-2"
set "P3=%TEMP%\chrome-screen-3"

start "" "%CHROME%" --new-window --kiosk "%URL1%" --window-position=%X1%,%Y1% --user-data-dir="%P1%" --no-first-run --disable-session-crashed-bubble
timeout /t 2 /nobreak >nul

start "" "%CHROME%" --new-window --kiosk "%URL2%" --window-position=%X2%,%Y2% --user-data-dir="%P2%" --no-first-run --disable-session-crashed-bubble
timeout /t 2 /nobreak >nul

start "" "%CHROME%" --new-window --kiosk "%URL3%" --window-position=%X3%,%Y3% --user-data-dir="%P3%" --no-first-run --disable-session-crashed-bubble

endlocal
exit
