# Portfel PRO v. 1.1 / 117 — poprawka parsera wielu pozycji

Ta paczka jest rozwinięciem stabilnej wersji v. 1.1 / 115.

Dodane i poprawione:

- kalendarz miesięczny pokazuje teraz dodatkowo `Wypłata`;
- `Wypłata` jest liczona z wpisów tylko z aktualnie wybranego miesiąca;
- kalendarz roczny pokazuje wypłatę dla roku i osobno przy miesiącach;
- raport główny na stronie Start bez aktywnych filtrów liczy bieżący miesiąc, a nie całą bazę;
- dodano zarządzanie własnymi kategoriami w Ustawieniach;
- dodane kategorie trafiają do formularzy, filtrów, reguł tagów i podglądu rozpoznania;
- w Ustawieniach można zaznaczyć, które kategorie mają osobny kafelek na stronie Start;
- eksport/import JSON zapisuje własne kategorie i ustawienia raportu głównego;
- poprawiono parser wielu pozycji w jednym zdaniu: każda kwota jest teraz klasyfikowana z własnego lokalnego fragmentu tekstu;
- pełny tekst źródłowy nie jest już używany do tagowania każdej pozycji, więc np. `hot dog` nie nadpisuje wszystkich wpisów jako `Jedzenie`;
- poprawiono rozpoznawanie `wydatek firmowy` / `wydatek domowy` przy kilku kwotach w jednej linijce;
- cache PWA podbite do `v117`.

Zasada wypłaty:

`Wypłata = przychody firmowe z danego okresu - wydatki firmowe z danego okresu`

Wydatki domowe nie obniżają wypłaty.

Po wrzuceniu na GitHub Pages uruchom adres z dopiskiem `?v=117` albo użyj przycisku „Odśwież program”.
