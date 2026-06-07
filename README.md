# Portfel PRO v. 1.1 / 125 — jednorazowy zapis Dropbox po imporcie JSON

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
- cache PWA podbite do `v125`.

Test wykonany na podanym tekście z 2–7 marca 2026:

- rozpoznano 16 pozycji;
- daty zostały przypisane jako: 2026-03-02, 2026-03-03, 2026-03-04, 2026-03-05, 2026-03-06, 2026-03-07;
- nie wykryto błędu składni JavaScript w `src/app.js`.

Po wrzuceniu na GitHub Pages uruchom adres z dopiskiem `?v=125` albo użyj przycisku „Odśwież program”.


## Zmiany v. 1.1 / 125
- Portfel gotówkowy przeniesiony na górę raportów.
- Stan portfela dodany na ekran Start nad podsumowaniem dzisiejszych wydatków.
- Korekta ręczna działa jako dopisywana zmiana: dodatnia kwota zwiększa portfel, ujemna zmniejsza, a pole po zapisie jest czyszczone.
- Inteligentne wnioski liczą zawsze bieżący miesiąc.
- Import JSON/scalanie jest odporniejsze: ręczny import nie stosuje tombstone usunięć, lepiej rozpoznaje wpisy w zagnieżdżonych strukturach i skuteczniej pomija duplikaty.


## 1.1-125 — poprawka synchronizacji Dropbox/import JSON
- Usunięto 30-minutową blokadę pobierania z Dropboxa.
- Po imporcie JSON program wykonuje tylko jednorazowy zapis lokalnej bazy do Dropboxa jako aktualnego źródła danych.
- Po tym jednorazowym zapisie synchronizacja wraca od razu do normalnej pracy między telefonem i komputerem.
- Jeżeli Dropbox wykonuje poprzednią operację, zapis lokalnej bazy po imporcie trafia do kolejki i wykonuje się po zakończeniu synchronizacji.
- Import lokalny usuwa z listy `deletedEntries` znaczniki usunięcia dla wpisów, które są właśnie przywracane z pliku.
- W zakładce Synchronizacja przyciski Połącz/Odłącz/Synchronizuj są aktywne tylko wtedy, gdy dana operacja ma sens.
- Dodano widoczne komunikaty po imporcie, eksporcie, połączeniu, odłączeniu i synchronizacji Dropbox.


## 1.1-125 — imieniny i wydatki cykliczne
- Poprawiono adres API imienin na aktualny wariant `V2/today?timezone=Europe/Warsaw`.
- Dodano lokalną bazę imienin na cały rok, więc nagłówek nie pokazuje już „niedostępne”, gdy API nie odpowie.
- Powiększono i wyróżniono informację o dacie oraz imieninach w nagłówku.
- Poprawiono grupowanie wydatków cyklicznych: program usuwa z klucza miesiące, powtórzone kategorie, rodzaj wpisu i zbędne słowa, więc nie rozbija wpisów typu „dom lutego” i „dom marca” na osobne cykle.
- Skrócono opis cyklu, żeby zamiast tekstów typu „dom dom lutego domowe dom” pokazywał czytelne nazwy typu „Dom · Domowe”.
