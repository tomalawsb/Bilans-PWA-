# Bilans PWA — Etap 19

Lokalna aplikacja PWA do zapisywania przychodów, wydatków, raportów i kalendarza.

## Co dodano w Etapie 19

- ekran pierwszego uruchomienia: **Lokalnie** albo **Dropbox**,
- zakładka Synchronizacja zawiera wybór trybu danych,
- możliwość podania Dropbox App key i ścieżki pliku JSON,
- logowanie Dropbox przez OAuth/PKCE, bez wpisywania hasła Dropbox w aplikacji,
- pobieranie i wysyłanie jednego pliku `bilans_dane.json`,
- przycisk **Synchronizuj teraz**,
- automatyczne dosyłanie zmian do Dropboxa po dodaniu, edycji, usunięciu, imporcie albo przeniesieniu wpisu,
- poprawka mapy cieplnej w kalendarzu rocznym — kolory dni nie są już nadpisywane przez ogólne tło komórek,
- podbita wersja aplikacji, manifestu i cache do Etapu 19.

## Ważne

Dropbox nie prosi o hasło wewnątrz aplikacji. Aplikacja przekierowuje do oficjalnego logowania Dropbox i zapisuje token dostępu w pamięci tej przeglądarki.

Do działania Dropboxa potrzebny jest hosting HTTPS, np. GitHub Pages, oraz App key z aplikacji utworzonej w Dropbox Developers.

## Jak uruchomić lokalnie

Na Windows uruchom:

```bat
run_local_windows.bat
```

Potem otwórz adres pokazany w konsoli.

## Dane

Tryb lokalny zapisuje dane w IndexedDB przeglądarki. Tryb Dropbox używa jednego pliku JSON, domyślnie:

```text
/Apps/Bilans/bilans_dane.json
```
