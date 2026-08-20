@echo off
cd /d "%~dp0"
echo Uruchamiam lokalny serwer dla Portfel PRO v. 1.1 / 155...
echo Adres: http://127.0.0.1:8000/?v=155
echo.
python -m http.server 8000
pause
