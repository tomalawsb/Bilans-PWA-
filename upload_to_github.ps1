# ============================================================
# Automatyczne wysylanie projektu na GitHub
# Uzytkownik: tomalawsb
# Repozytorium: Bilans-PWA-
# ============================================================

$RepoUrl = "https://github.com/tomalawsb/Bilans-PWA-.git"
$GitUserName = "Tomasz Wolak"
$GitUserEmail = "wolak82@gmail.com"
$BranchName = "main"
$CommitMessage = "Aktualizacja programu"

Write-Host "========================================"
Write-Host " Wysylanie projektu na GitHub"
Write-Host "========================================"

$ProjectPath = Get-Location
Write-Host "Folder projektu: $ProjectPath"
Write-Host "Repozytorium: $RepoUrl"

# Sprawdzenie Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "BLAD: Git nie jest zainstalowany albo nie jest dodany do PATH." -ForegroundColor Red
    exit 1
}

# Ustawienie autora commitow
Write-Host "Ustawiam autora Git..."
git config --global user.name "$GitUserName"
git config --global user.email "$GitUserEmail"

# Inicjalizacja repo, jesli potrzeba
if (-not (Test-Path ".git")) {
    Write-Host "Inicjalizuje repozytorium Git..."
    git init
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

# Ustawienie galezi main
Write-Host "Ustawiam galaz $BranchName..."
git branch -M $BranchName

# Ustawienie remote origin
$CurrentRemote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($CurrentRemote)) {
    Write-Host "Dodaje remote origin..."
    git remote add origin $RepoUrl
} else {
    Write-Host "Aktualizuje remote origin..."
    git remote set-url origin $RepoUrl
}
if ($LASTEXITCODE -ne 0) { exit 1 }

# Dodanie plikow
Write-Host "Dodaje pliki..."
git add -A
if ($LASTEXITCODE -ne 0) { exit 1 }

# Commit tylko jesli sa zmiany
$Status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($Status)) {
    Write-Host "Brak nowych zmian do wyslania." -ForegroundColor Yellow
} else {
    Write-Host "Tworze commit..."
    git commit -m "$CommitMessage"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "BLAD: Nie udalo sie utworzyc commita." -ForegroundColor Red
        exit 1
    }
}

# Push
Write-Host "Wysylam na GitHub..."
git push -u origin $BranchName
if ($LASTEXITCODE -ne 0) {
    Write-Host "BLAD: Nie udalo sie wyslac projektu na GitHub." -ForegroundColor Red
    Write-Host "Sprawdz, czy jestes zalogowany do GitHub w Git Credential Manager albo czy repozytorium istnieje." -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================"
Write-Host " Gotowe. Projekt zostal wyslany na GitHub."
Write-Host "========================================"
