@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
rem ============================================================
rem  Portfel PRO (Bilans) - BUILD
rem  1) sprawdza/pobiera wspolny Node.js (D:\Users\Admin\Środowiska\NodeJS)
rem  2) uruchamia testy rozpoznawania (tests\parser.test.mjs)
rem  3) sklada czysta paczke strony PWA w Środowiska\Bilans\dist
rem  4) kopiuje gotowy wynik do katalogu projektu (obok BUILD.cmd)
rem ============================================================
set "VERSION=1.2.156"
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
if not defined SRODOWISKA_ROOT set "SRODOWISKA_ROOT=D:\Users\Admin\Środowiska"
set "APP_NAME=Bilans"
set "APP_ENV=%SRODOWISKA_ROOT%\%APP_NAME%"
set "NODE_DIR=%SRODOWISKA_ROOT%\NodeJS"
set "NODE_VER=v20.18.0"
set "DIST_DIR=%APP_ENV%\dist\%APP_NAME%-%VERSION%"
set "OUT_ZIP=%PROJECT_DIR%\%APP_NAME%-%VERSION%-www.zip"

for %%D in ("%APP_ENV%\temp" "%APP_ENV%\logs" "%APP_ENV%\dist" "%APP_ENV%\cache" "%SRODOWISKA_ROOT%\npm-cache") do if not exist "%%~D" mkdir "%%~D" >nul 2>&1
set "TEMP=%APP_ENV%\temp"
set "TMP=%APP_ENV%\temp"
set "npm_config_cache=%SRODOWISKA_ROOT%\npm-cache"

echo [1/4] Szukam Node.js (wspolny: %NODE_DIR%)...
set "NODE="
if exist "%NODE_DIR%\node.exe" set "NODE=%NODE_DIR%\node.exe"
if not defined NODE for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE set "NODE=%%N"
if not defined NODE (
  echo     Brak Node.js - pobieram %NODE_VER% do %NODE_DIR% ...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $z=Join-Path $env:TEMP 'node.zip'; $x=Join-Path $env:TEMP 'node-x'; Invoke-WebRequest -UseBasicParsing 'https://nodejs.org/dist/%NODE_VER%/node-%NODE_VER%-win-x64.zip' -OutFile $z; if (Test-Path $x) { Remove-Item $x -Recurse -Force }; Expand-Archive -Force $z $x; New-Item -ItemType Directory -Force '%NODE_DIR%' | Out-Null; Copy-Item (Join-Path $x 'node-%NODE_VER%-win-x64\*') '%NODE_DIR%' -Recurse -Force; Remove-Item $z, $x -Recurse -Force"
  if errorlevel 1 (
    echo BLAD: nie udalo sie pobrac Node.js.
    exit /b 1
  )
  set "NODE=%NODE_DIR%\node.exe"
)
"!NODE!" --version || (echo BLAD: Node.js nie dziala. & exit /b 1)

echo [2/4] Testy rozpoznawania wpisow...
"!NODE!" "%PROJECT_DIR%\tests\parser.test.mjs" > "%APP_ENV%\logs\testy.log" 2>&1
set "TEST_RC=!errorlevel!"
type "%APP_ENV%\logs\testy.log"
if not "!TEST_RC!"=="0" (
  echo BLAD: testy nie przeszly. Log: %APP_ENV%\logs\testy.log
  exit /b 1
)

echo [3/4] Skladam paczke strony w %DIST_DIR% ...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
mkdir "%DIST_DIR%"
for %%F in (index.html service-worker.js manifest.webmanifest manifest-voice.webmanifest .nojekyll) do copy /y "%PROJECT_DIR%\%%F" "%DIST_DIR%\" >nul
for %%D in (src icons voice) do xcopy "%PROJECT_DIR%\%%D" "%DIST_DIR%\%%D\" /e /i /q /y >nul
if errorlevel 1 (
  echo BLAD: kopiowanie plikow nie powiodlo sie.
  exit /b 1
)

echo [4/4] Tworze %OUT_ZIP% ...
if exist "%OUT_ZIP%" del /q "%OUT_ZIP%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%OUT_ZIP%' -Force"
if errorlevel 1 (
  echo BLAD: nie udalo sie utworzyc ZIP.
  exit /b 1
)
echo.
echo GOTOWE: %OUT_ZIP%
echo Zawartosc ZIP mozna wgrac na GitHub Pages / dowolny serwer HTTPS.
endlocal
