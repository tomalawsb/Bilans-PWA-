@echo off
cd /d "%~dp0"
echo Uruchamiam lokalny serwer dla Portfel PRO v. 1.1 / 125...
echo Adres: http://127.0.0.1:8080
echo.
python -m http.server 8080
pause
