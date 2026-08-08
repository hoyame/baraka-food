@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 goto no_node

echo Installation des dependances...
call npm install --omit=dev --no-audit --no-fund
if errorlevel 1 goto npm_fail

echo Creation du raccourci sur le Bureau...
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Baraka Food.lnk');$s.TargetPath='%~dp0demarrer.bat';$s.WorkingDirectory='%~dp0';$s.Save()"

echo.
echo Installation terminee. Lance "Baraka Food" depuis le Bureau.
pause
exit /b 0

:no_node
echo ERREUR : Node.js n'est pas installe.
echo Telecharge-le sur https://nodejs.org (version LTS) puis relance cet installateur.
pause
exit /b 1

:npm_fail
echo ERREUR : installation des dependances impossible. Verifie la connexion internet.
pause
exit /b 1
