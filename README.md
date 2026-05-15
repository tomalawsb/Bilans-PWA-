# Portfel PRO v. 1.1 / 118 — daty parsera, PDF i mapa cieplna

Ta paczka jest poprawką wersji v. 1.1 / 117.

Naprawione i dodane:

- parser wielu pozycji przypisuje teraz datę osobno do każdej kwoty / pozycji;
- tekst typu `2 marca ...`, `3 marca ...`, `4 marca ...` nie jest już zapisywany pod pierwszą znalezioną datą;
- eksport kalendarza do PDF otwiera szczegółowy widok do druku / zapisu jako PDF;
- PDF zawiera kalendarz, podsumowanie oraz tabelę wszystkich wpisów z wybranego miesiąca albo roku: data, dzień, typ, rodzaj, kategoria, opis, kwota, płatność i tagi;
- poprawiono otwieranie PDF: usunięto tryb `noopener`, który potrafił blokować dostęp do okna wydruku;
- dodano awaryjny eksport PDF przez ukryty iframe, gdy przeglądarka zablokuje nowe okno;
- mapa cieplna rozróżnia teraz przychody i wydatki innym tonem koloru;
- eksport PNG kalendarza rocznego również używa osobnych kolorów dla przychodów i wydatków;
- cache PWA podbite do `v118`.

Test wykonany na podanym tekście z 2–7 marca 2026:

- rozpoznano 16 pozycji;
- daty zostały przypisane jako: 2026-03-02, 2026-03-03, 2026-03-04, 2026-03-05, 2026-03-06, 2026-03-07;
- nie wykryto błędu składni JavaScript w `src/app.js`.

Po wrzuceniu na GitHub Pages uruchom adres z dopiskiem `?v=118` albo użyj przycisku „Odśwież program”.
