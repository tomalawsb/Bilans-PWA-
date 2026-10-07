@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
rem ============================================================
rem  Portfel PRO (Bilans) - uruchomienie lokalnego serwera PWA
rem  Katalog projektu = katalog tego pliku (bez sztywnych sciezek).
rem  Wspolne narzedzia: D:\Users\Admin\Środowiska\ (lub SRODOWISKA_ROOT)
rem ============================================================
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
if not defined SRODOWISKA_ROOT set "SRODOWISKA_ROOT=D:\Users\Admin\Środowiska"
set "APP_NAME=Bilans"
set "APP_ENV=%SRODOWISKA_ROOT%\%APP_NAME%"
set "PY_DIR=%SRODOWISKA_ROOT%\Python311"
set "PY_VER=3.11.9"
set "PORT=8000"
if not "%~1"=="" set "PORT=%~1"

if not exist "%APP_ENV%\temp" mkdir "%APP_ENV%\temp" >nul 2>&1
if not exist "%APP_ENV%\logs" mkdir "%APP_ENV%\logs" >nul 2>&1
rem Python nie moze zostawiac __pycache__ w projekcie.
set "PYTHONDONTWRITEBYTECODE=1"
set "PYTHONPYCACHEPREFIX=%APP_ENV%\cache\pycache"
set "TEMP=%APP_ENV%\temp"
set "TMP=%APP_ENV%\temp"

echo [1/3] Szukam Pythona (wspolny: %PY_DIR%)...
set "PYTHON="
if exist "%PY_DIR%\python.exe" set "PYTHON=%PY_DIR%\python.exe"
if not defined PYTHON (
  for /f "delims=" %%P in ('where python 2^>nul') do (
    if not defined PYTHON (
      "%%P" -c "import sys; sys.exit(0 if sys.version_info>=(3,8) else 1)" >nul 2>&1 && set "PYTHON=%%P"
    )
  )
)
if not defined PYTHON (
  echo     Brak Pythona - pobieram wspolna wersje %PY_VER% do %PY_DIR% ...
  if not exist "%PY_DIR%" mkdir "%PY_DIR%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $z=Join-Path $env:TEMP 'python-embed.zip'; Invoke-WebRequest -UseBasicParsing 'https://www.python.org/ftp/python/%PY_VER%/python-%PY_VER%-embed-amd64.zip' -OutFile $z; Expand-Archive -Force $z '%PY_DIR%'; Remove-Item $z"
  if errorlevel 1 (
    echo BLAD: nie udalo sie pobrac Pythona. Sprawdz internet albo zainstaluj Pythona 3.11 w %PY_DIR%.
    pause
    exit /b 1
  )
  set "PYTHON=%PY_DIR%\python.exe"
)
echo     Python: !PYTHON!

echo [2/3] Katalog programu: %PROJECT_DIR%
echo [3/3] Start serwera: http://127.0.0.1:%PORT%/?v=156
echo       Zamknij to okno, aby zatrzymac program.
start "" "http://127.0.0.1:%PORT%/?v=156"
"!PYTHON!" -B -m http.server %PORT% --bind 127.0.0.1 --directory "%PROJECT_DIR%"
if errorlevel 1 (
  echo BLAD: serwer nie wystartowal. Port %PORT% moze byc zajety - uruchom: URUCHOM.cmd 8080
  pause
  exit /b 1
)
endlocal
