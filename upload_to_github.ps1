# upload_to_github_fixed.ps1
# Wysylanie aktualnego folderu projektu na GitHub
# Uruchom w glownym folderze projektu:
# powershell -ExecutionPolicy Bypass -File .\upload_to_github_fixed.ps1

$ErrorActionPreference = "Stop"

function Stop-WithMessage($Message) {
    Write-Host ""
    Write-Host "BLAD: $Message" -ForegroundColor Red
    Write-Host ""
    exit 1
}

function Info($Message) {
    Write-Host $Message -ForegroundColor Cyan
}

function Ok($Message) {
    Write-Host $Message -ForegroundColor Green
}

function Warn($Message) {
    Write-Host $Message -ForegroundColor Yellow
}

Write-Host "========================================"
Write-Host " Wysylanie projektu na GitHub"
Write-Host "========================================"

# 1. Sprawdzenie Git
try {
    git --version | Out-Null
} catch {
    Stop-WithMessage "Git nie jest zainstalowany albo nie jest dodany do PATH. Zainstaluj Git for Windows i uruchom terminal ponownie."
}

$ProjectFolder = Get-Location
Info "Folder projektu: $ProjectFolder"

# 2. Dane autora commita
$GitName = git config --global user.name
$GitEmail = git config --global user.email

if ([string]::IsNullOrWhiteSpace($GitName)) {
    $GitName = Read-Host "Podaj nazwe autora commitow, np. Tomasz Wolak"
    if ([string]::IsNullOrWhiteSpace($GitName)) {
        Stop-WithMessage "Nie podano nazwy autora."
    }
    git config --global user.name "$GitName"
}

if ([string]::IsNullOrWhiteSpace($GitEmail)) {
    $GitEmail = Read-Host "Podaj email autora commitow, np. twoj-mail@gmail.com"
    if ([string]::IsNullOrWhiteSpace($GitEmail)) {
        Stop-WithMessage "Nie podano emaila autora."
    }
    git config --global user.email "$GitEmail"
}

Ok "Autor Git: $GitName <$GitEmail>"

# 3. Repozytorium
$RepoUrl = Read-Host "Wklej adres repozytorium GitHub, np. https://github.com/login/repo.git"
if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
    Stop-WithMessage "Nie podano adresu repozytorium."
}

# Poprawka czestego bledu: uzytkownik wkleja adres /upload/main z przegladarki
if ($RepoUrl -match "/upload/main") {
    $RepoUrl = $RepoUrl -replace "/upload/main", ".git"
    Warn "Wykryto adres strony /upload/main. Poprawiam na adres repo: $RepoUrl"
}

# Jesli ktos poda adres bez .git, dopisz .git tylko dla github.com/login/repo
if ($RepoUrl -match "^https://github\.com/[^/]+/[^/]+/?$" -and $RepoUrl -notmatch "\.git$") {
    $RepoUrl = $RepoUrl.TrimEnd('/') + ".git"
    Warn "Dopisuje koncowke .git: $RepoUrl"
}

if ($RepoUrl -notmatch "^https://github\.com/.+/.+\.git$" -and $RepoUrl -notmatch "^git@github\.com:.+/.+\.git$") {
    Stop-WithMessage "Adres repozytorium wyglada niepoprawnie. Uzyj formatu: https://github.com/login/repo.git"
}

# 4. Inicjalizacja repo lokalnego
if (!(Test-Path ".git")) {
    Info "Inicjalizuje repozytorium Git..."
    git init
}

# 5. Galaz main
try {
    git branch -M main
} catch {
    Warn "Nie udalo sie przelaczyc/utworzyc galezi main. Kontynuuje."
}

# 6. Remote origin
$ExistingOrigin = ""
try {
    $ExistingOrigin = git remote get-url origin 2>$null
} catch {}

if ([string]::IsNullOrWhiteSpace($ExistingOrigin)) {
    Info "Dodaje remote origin: $RepoUrl"
    git remote add origin $RepoUrl
} else {
    Info "Aktualizuje remote origin: $RepoUrl"
    git remote set-url origin $RepoUrl
}

# 7. Dodanie plikow
Info "Dodaje pliki do commita..."
git add -A

$Status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($Status)) {
    Warn "Brak nowych zmian do commita. Sprobuje wykonac push obecnego stanu."
} else {
    $DefaultCommit = "Aktualizacja programu"
    $CommitMessage = Read-Host "Opis commita [Enter = $DefaultCommit]"
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $CommitMessage = $DefaultCommit
    }

    Info "Tworze commit..."
    git commit -m "$CommitMessage"
}

# 8. Push
Info "Wysylam na GitHub..."
git push -u origin main

Write-Host "========================================"
Ok "Gotowe. Projekt zostal wyslany na GitHub."
Write-Host "========================================"
