# Portfel PRO — Etap 21

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


## Etap 21 - poprawka usuwania danych
- Import JSON nie jest już realizowany przez label z ukrytym inputem, tylko przez osobne przyciski.
- Przycisk „Usuń wszystkie dane” ma własny handler z preventDefault/stopPropagation.
- Ujednolicono wersje cache, service workera, manifestu i plików JS/CSS do v20.


## Etap 21
- Zmieniono nazwę widoczną aplikacji na Portfel PRO.
- Usunięto przycisk „Dodaj głosem” z głównego nagłówka; tryb głosowy działa jako skrót PWA `?action=voice`.
- Pod nazwą aplikacji wyświetla się data oraz imieniny pobierane z API Abalin.
- Dodano motywy: złoty, rubinowy, bursztynowy i diamentowy.
