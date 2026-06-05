# Portfel PRO v. 1.1 / 119 — daty parsera, PDF i mapa cieplna

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
- cache PWA podbite do `v119`.

Test wykonany na podanym tekście z 2–7 marca 2026:

- rozpoznano 16 pozycji;
- daty zostały przypisane jako: 2026-03-02, 2026-03-03, 2026-03-04, 2026-03-05, 2026-03-06, 2026-03-07;
- nie wykryto błędu składni JavaScript w `src/app.js`.

Po wrzuceniu na GitHub Pages uruchom adres z dopiskiem `?v=119` albo użyj przycisku „Odśwież program”.


## Zmiany v. 1.1 / 119
- Portfel gotówkowy przeniesiony na górę raportów.
- Stan portfela dodany na ekran Start nad podsumowaniem dzisiejszych wydatków.
- Korekta ręczna działa jako dopisywana zmiana: dodatnia kwota zwiększa portfel, ujemna zmniejsza, a pole po zapisie jest czyszczone.
- Inteligentne wnioski liczą zawsze bieżący miesiąc.
- Import JSON/scalanie jest odporniejsze: ręczny import nie stosuje tombstone usunięć, lepiej rozpoznaje wpisy w zagnieżdżonych strukturach i skuteczniej pomija duplikaty.
