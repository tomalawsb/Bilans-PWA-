# upload_to_github.ps1
# Portfel PRO / Bilans-PWA-
# Skrypt bezpieczny: pobiera aktualne repo do katalogu tymczasowego, kopiuje paczke programu i wysyla zmiany.

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/tomalawsb/Bilans-PWA-.git"
$GitUserName = "Tomasz Wolak"
$GitUserEmail = "wolak82@gmail.com"
$DefaultCommitMessage = "Portfel PRO v1.1 132 - synchronizacja magazynu"

function Stop-WithMessage($Message) {
    Write-Host ""
    Write-Host "BLAD: $Message" -ForegroundColor Red
    Write-Host ""
    Set-Location $ProjectPath -ErrorAction SilentlyContinue
    exit 1
}

function Info($Message) { Write-Host $Message -ForegroundColor Cyan }
function Ok($Message) { Write-Host $Message -ForegroundColor Green }
function Warn($Message) { Write-Host $Message -ForegroundColor Yellow }

Write-Host "========================================"
Write-Host " Wysylanie projektu na GitHub"
Write-Host "========================================"

$ProjectPath = (Get-Location).Path
$TempRoot = Join-Path $env:TEMP "bilans_pwa_git_upload"
$RepoWorkPath = Join-Path $TempRoot "repo"

Info "Folder projektu: $ProjectPath"
Info "Repozytorium: $RepoUrl"

try { git --version | Out-Null } catch { Stop-WithMessage "Git nie jest zainstalowany albo nie jest dostepny w PATH." }

if (!(Test-Path (Join-Path $ProjectPath "index.html"))) { Stop-WithMessage "Brak index.html w folderze programu. Uruchom skrypt z glownego folderu paczki." }
if (!(Test-Path (Join-Path $ProjectPath "src\app.js"))) { Stop-WithMessage "Brak src\app.js w folderze programu. Nie wysylam niepelnej paczki." }
if (!(Test-Path (Join-Path $ProjectPath "src\config.js"))) { Stop-WithMessage "Brak src\config.js w folderze programu. Nie wysylam, zeby nie usunac konfiguracji z repo." }

Info "Ustawiam autora Git..."
git config --global user.name "$GitUserName"
git config --global user.email "$GitUserEmail"
Ok "Autor Git: $GitUserName <$GitUserEmail>"

Info "Czyszcze katalog tymczasowy..."
if (Test-Path $TempRoot) { Remove-Item $TempRoot -Recurse -Force }
New-Item -ItemType Directory -Path $TempRoot | Out-Null

Info "Pobieram aktualne repozytorium z GitHuba..."
git clone $RepoUrl $RepoWorkPath
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Nie udalo sie pobrac repozytorium." }

Info "Kopiuje aktualna paczke programu do repozytorium..."
$RoboArgs = @(
    $ProjectPath,
    $RepoWorkPath,
    "/MIR",
    "/XD", ".git", ".github", "node_modules", "__pycache__",
    "/XF", "*.pyc", ".DS_Store"
)
robocopy @RoboArgs | Out-Null
$RoboCode = $LASTEXITCODE
if ($RoboCode -gt 7) { Stop-WithMessage "Robocopy nie skopiowal poprawnie plikow. Kod: $RoboCode" }

Set-Location $RepoWorkPath

git config core.autocrlf false

git branch -M main

Info "Sprawdzam wymagane pliki po skopiowaniu..."
if (!(Test-Path "index.html")) { Stop-WithMessage "Po kopiowaniu brakuje index.html." }
if (!(Test-Path "src\app.js")) { Stop-WithMessage "Po kopiowaniu brakuje src\app.js." }
if (!(Test-Path "src\config.js")) { Stop-WithMessage "Po kopiowaniu brakuje src\config.js." }

Info "Dodaje pliki..."
git add -A

$Status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($Status)) {
    Warn "Brak zmian do wyslania. Repozytorium jest juz aktualne."
    Set-Location $ProjectPath
    exit 0
}

Info "Zmiany wykryte przez Git:"
git status --short

$CommitMessage = Read-Host "Opis commita [Enter = $DefaultCommitMessage]"
if ([string]::IsNullOrWhiteSpace($CommitMessage)) { $CommitMessage = $DefaultCommitMessage }

Info "Tworze commit..."
git commit -m "$CommitMessage"
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Nie udalo sie utworzyc commita." }

Info "Wysylam na GitHub..."
git push origin main
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Nie udalo sie wyslac projektu na GitHub. Sprawdz logowanie GitHub/Git Credential Manager." }

Set-Location $ProjectPath

Write-Host "========================================"
Ok "Gotowe. Projekt zostal wyslany na GitHub."
Write-Host "Adres strony: https://tomalawsb.github.io/Bilans-PWA-/?v=132"
Write-Host "========================================"
