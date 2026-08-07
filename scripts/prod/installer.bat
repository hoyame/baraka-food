@echo off
setlocal

set "INSTALL_DIR=C:\BarakaFood"
set "REPO=https://github.com/hoyame/baraka-food-prod.git"

where node >nul 2>&1
if errorlevel 1 goto no_node
where git >nul 2>&1
if errorlevel 1 goto no_git

if exist "%INSTALL_DIR%" goto already

echo Telechargement de Baraka Food...
git clone "%REPO%" "%INSTALL_DIR%"
if errorlevel 1 goto clone_fail

cd /d "%INSTALL_DIR%"
echo Installation des dependances...
call npm install --omit=dev --no-audit --no-fund

echo.
echo Installation terminee dans %INSTALL_DIR%
echo Un raccourci vers demarrer.bat va etre cree sur le Bureau.
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Baraka Food.lnk');$s.TargetPath='%INSTALL_DIR%\demarrer.bat';$s.WorkingDirectory='%INSTALL_DIR%';$s.Save()"
echo.
echo Lance "Baraka Food" depuis le Bureau.
pause
exit /b 0

:no_node
echo ERREUR : Node.js n'est pas installe.
echo Telecharge-le sur https://nodejs.org (version LTS) puis relance cet installateur.
pause
exit /b 1

:no_git
echo ERREUR : Git n'est pas installe.
echo Telecharge-le sur https://git-scm.com/download/win puis relance cet installateur.
pause
exit /b 1

:already
echo Baraka Food est deja installe dans %INSTALL_DIR%.
echo Lance demarrer.bat, il se met a jour tout seul.
pause
exit /b 0

:clone_fail
echo ERREUR : telechargement impossible. Verifie la connexion internet et l'acces au depot.
pause
exit /b 1
