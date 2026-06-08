# upload_to_github.ps1
# Portfel PRO / Bilans-PWA-
# Wersja bezpieczna: klonuje repo do katalogu tymczasowego, kopiuje aktualny projekt i wysyla na GitHub.

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/tomalawsb/Bilans-PWA-.git"
$GitUserName = "Tomasz Wolak"
$GitUserEmail = "wolak82@gmail.com"
$DefaultCommitMessage = "Aktualizacja Portfel PRO"

Write-Host "========================================"
Write-Host " Wysylanie projektu na GitHub"
Write-Host "========================================"

$ProjectPath = (Get-Location).Path
$TempRoot = Join-Path $env:TEMP "bilans_pwa_git_upload"
$RepoWorkPath = Join-Path $TempRoot "repo"

Write-Host "Folder projektu: $ProjectPath"
Write-Host "Repozytorium: $RepoUrl"

try {
    git --version | Out-Null
} catch {
    Write-Host "BLAD: Git nie jest zainstalowany albo nie jest dostepny w PATH."
    exit 1
}

Write-Host "Ustawiam autora Git..."
git config --global user.name "$GitUserName"
git config --global user.email "$GitUserEmail"

Write-Host "Czyszcze katalog tymczasowy..."
if (Test-Path $TempRoot) {
    Remove-Item $TempRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $TempRoot | Out-Null

Write-Host "Pobieram aktualne repozytorium z GitHuba..."
git clone $RepoUrl $RepoWorkPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "BLAD: Nie udalo sie pobrac repozytorium."
    exit 1
}

Write-Host "Kopiuje aktualna paczke programu do repozytorium..."
$RoboArgs = @(
    $ProjectPath,
    $RepoWorkPath,
    "/MIR",
    "/XD", ".git", ".github", "node_modules", "__pycache__",
    "/XF", "*.pyc", ".DS_Store"
)

robocopy @RoboArgs | Out-Null
$RoboCode = $LASTEXITCODE

if ($RoboCode -gt 7) {
    Write-Host "BLAD: Robocopy nie skopiowal poprawnie plikow. Kod: $RoboCode"
    exit 1
}

Set-Location $RepoWorkPath

Write-Host "Ustawiam galaz main..."
git branch -M main

Write-Host "Dodaje pliki..."
git add -A

$Changes = git status --porcelain
if (-not $Changes) {
    Write-Host "Brak zmian do wyslania."
    Set-Location $ProjectPath
    exit 0
}

$CommitMessage = Read-Host "Opis commita [Enter = $DefaultCommitMessage]"
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = $DefaultCommitMessage
}

Write-Host "Tworze commit..."
git commit -m "$CommitMessage"
if ($LASTEXITCODE -ne 0) {
    Write-Host "BLAD: Nie udalo sie utworzyc commita."
    Set-Location $ProjectPath
    exit 1
}

Write-Host "Wysylam na GitHub..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "BLAD: Nie udalo sie wyslac projektu na GitHub."
    Write-Host "Sprawdz logowanie do GitHub / Git Credential Manager."
    Set-Location $ProjectPath
    exit 1
}

Set-Location $ProjectPath

Write-Host "========================================"
Write-Host "Gotowe. Projekt zostal wyslany na GitHub."
Write-Host "Adres strony:"
Write-Host "https://tomalawsb.github.io/Bilans-PWA-/"
Write-Host "========================================"
