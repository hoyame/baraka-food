@echo off
setlocal enabledelayedexpansion

if exist node_modules goto skip_install_main
echo Installation des dependances ecrans/admin...
call npm install
:skip_install_main

if exist dist goto skip_build_main
echo Build de l'application ecrans/admin...
call npm run build
:skip_build_main

if exist staff\node_modules goto skip_install_staff
echo Installation des dependances staff...
call npm --prefix staff install
:skip_install_staff

if exist staff\.next goto skip_build_staff
echo Build de l'application staff...
call npm --prefix staff run build
:skip_build_staff

echo Demarrage de Baraka Food...
start "BarakaFood-Ecrans" /min node server\index.js
start "BarakaFood-Staff" /min cmd /k "npm --prefix staff run start"

timeout /t 3 /nobreak >nul

set "LANIP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  if not defined LANIP set "LANIP=%%a"
)
set "LANIP=%LANIP: =%"

echo.
echo ================================================
echo   Baraka Food - accessible sur le reseau local
echo ================================================
echo   Ecrans  : http://%LANIP%:4000/1  /2  /3
echo   Admin   : http://%LANIP%:4000/admin
echo   Salle   : http://%LANIP%:4040/salle
echo   Cuisine : http://%LANIP%:4040/cuisine
echo ================================================
echo.

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

start "" "%CHROME%" --new-window --kiosk "%URL1%" --window-position=%X1%,%Y1% --user-data-dir="%P1%" --no-first-run --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required
timeout /t 2 /nobreak >nul

start "" "%CHROME%" --new-window --kiosk "%URL2%" --window-position=%X2%,%Y2% --user-data-dir="%P2%" --no-first-run --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required
timeout /t 2 /nobreak >nul

start "" "%CHROME%" --new-window --kiosk "%URL3%" --window-position=%X3%,%Y3% --user-data-dir="%P3%" --no-first-run --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required

echo Depuis une tablette sur le meme reseau Wi-Fi, ouvre les URLs Salle/Cuisine ci-dessus dans le navigateur.
echo.

endlocal
exit
