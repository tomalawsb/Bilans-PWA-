# Portfel PRO v. 1.1 / 130 — synchronizacja magazynu między urządzeniami

Wersja: **1.1 / 130**  
Data paczki: **08.06.2026**

## Co poprawiono w tej wersji

- Dane magazynu są teraz synchronizowane razem z resztą danych programu przez Dropbox.
- Synchronizowane są:
  - stany magazynowe,
  - historia ruchów magazynowych,
  - statusy analizy AI,
  - ostatnie pozycje do ręcznego sprawdzenia.
- Po ręcznej zmianie magazynu program uruchamia automatyczną synchronizację Dropbox tak jak przy innych danych programu.
- Przy imporcie z Dropbox program scala ruchy magazynowe po identyfikatorach, żeby nie dublować tych samych operacji.
- Po scaleniu ruchów magazynowych stan magazynu jest przeliczany z historii ruchów.
- Poprawiono skrypt `upload_to_github.ps1`:
  - ma na stałe wpisane repozytorium `https://github.com/tomalawsb/Bilans-PWA-.git`,
  - ma wpisanego autora `Tomasz Wolak <wolak82@gmail.com>`,
  - pobiera aktualne repo do katalogu tymczasowego,
  - kopiuje aktualną paczkę programu do pobranego repo,
  - sprawdza, czy istnieją wymagane pliki `index.html`, `src/app.js`, `src/config.js`,
  - dopiero wtedy wykonuje commit i `push`,
  - nie powinien już robić problemów typu `fetch first`, `non-fast-forward` albo `cannot rebase`.
- Dodano `.gitattributes`, żeby ograniczyć problemy z końcami linii LF/CRLF.
- Podbito cache PWA do wersji `v=130`.

## Adres po wysłaniu na GitHub Pages

Po wysłaniu paczki na GitHub otwieraj:

```text
https://tomalawsb.github.io/Bilans-PWA-/?v=130
```

Jeżeli przeglądarka pokaże starszą wersję, użyj w programie opcji odświeżenia aplikacji albo otwórz stronę z parametrem `?v=130`.

## Jak wysłać paczkę na GitHub

W głównym folderze programu uruchom:

```powershell
powershell -ExecutionPolicy Bypass -File .\upload_to_github.ps1
```

Skrypt nie pyta już o repozytorium. Używa od razu:

```text
https://github.com/tomalawsb/Bilans-PWA-.git
```

## Ważne zasady działania magazynu

- Magazyn zapisuje stany i ruchy lokalnie w przeglądarce.
- Jeżeli program jest połączony z Dropboxem, dane magazynu są dołączane do głównego pliku synchronizacji.
- Komputer i telefon muszą korzystać z tego samego pliku Dropbox ustawionego w programie.
- Ręczna edycja magazynu, usuwanie pozycji, korekty oraz zastosowanie wyników AI zapisują ruchy magazynowe i uruchamiają synchronizację.
- Stan magazynu jest liczony z historii ruchów, dzięki czemu łatwiej go odtworzyć po synchronizacji.

## Testy wykonane przed spakowaniem

- Sprawdzenie składni JavaScript:

```powershell
node --check src/app.js
```

- Sprawdzenie obecności wymaganych plików:
  - `index.html`,
  - `src/app.js`,
  - `src/config.js`,
  - `service-worker.js`,
  - `upload_to_github.ps1`.

## Lista najważniejszych plików

- `index.html` — główny interfejs programu.
- `src/app.js` — logika programu, magazynu, AI i synchronizacji.
- `src/styles.css` — wygląd programu.
- `src/config.js` — konfiguracja właściciela programu.
- `service-worker.js` — cache PWA.
- `upload_to_github.ps1` — wysyłka paczki na GitHub.
- `.gitattributes` — ustawienia końców linii dla Git.
