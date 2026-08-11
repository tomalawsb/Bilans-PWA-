# Portfel PRO v. 1.1 / 151 — Finalny test i paczka końcowa

Wersja: **1.1 / 151**  
Etap: **9 — finalny test i paczka końcowa**

## Zakres wersji finalnej

Ta paczka zawiera komplet poprawek z etapów 1–8 oraz podbicie wersji końcowej do **v151**.

Zawarte obszary:

- Magazyn: ręczna kontrola, historia ruchów, ręczne dodawanie pozycji.
- Migracja danych: bezpieczne struktury dla starych danych i starych kopii.
- PWA/cache: ujednolicona wersja, odświeżanie i czyszczenie starego cache.
- Mikrofon: poprawiony skrót i aktualny widok głosowy.
- Audyt UI: spójność elementów HTML i obsługi JS.
- Kopie: import, eksport, podgląd i potwierdzenie zastąpienia danych.
- Ręczne dodawanie wpisu: uproszczony formularz.
- AI/paragony: uporządkowany wynik, standardowe kategorie i możliwość korekty przed zapisem.
- Wygląd: poprawiony układ, czytelność i ekspozycja najważniejszych informacji.

## Testy wykonane technicznie

- `node --check src/app.js` — OK.
- `node --check service-worker.js` — OK.
- Walidacja `manifest.webmanifest` — OK.
- Walidacja `manifest-voice.webmanifest` — OK.
- Kontrola zdublowanych `id` w `index.html` — OK.
- Kontrola statycznych `document.getElementById(...)` z JS względem `index.html` — OK.
- Kontrola statycznych selektorów `#id` z JS względem `index.html` — OK.
- Kontrola zakładek `data-tab` względem `data-tab-page` — OK.
- Kontrola wpisów cache i `?v=151` — OK.
- Test archiwum ZIP — OK.

## Czego nie da się potwierdzić bez ręcznego uruchomienia w przeglądarce

- Kliknięcie każdego przycisku na telefonie i komputerze.
- Faktyczne działanie mikrofonu w Android/PWA.
- Faktyczny import/eksport na urządzeniu użytkownika.
- Faktyczne rozpoznanie paragonu przez zewnętrzne API AI.

## Uruchomienie lokalne

```txt
run_local_windows.bat
```

Adres lokalny:

```txt
http://localhost:8000/?v=151
```

## GitHub Pages

Po wgraniu na GitHub otwieraj z parametrem:

```txt
https://tomalawsb.github.io/Bilans-PWA-/?v=151
```

Jeżeli telefon dalej pokazuje starą wersję, użyj w aplikacji przycisku **Odśwież program** albo usuń dane strony/PWA w ustawieniach przeglądarki.
