# Portfel PRO v. 1.1 / 115 — stabilna baza etap 40 + raporty i portfel gotówkowy

Ta paczka została zrobiona ponownie na bazie działającego etapu 40.

Dodane funkcje:

- inteligentne wnioski w raportach;
- wykrywanie wydatków cyklicznych;
- portfel gotówkowy z miesięcznym stanem początkowym i korektą ręczną;
- eksport/import oraz synchronizacja `walletMonths` razem z głównym JSON-em;
- cache PWA podbite do `v115`.

Portfel gotówkowy liczy tylko wpisy z płatnością `Gotówka`:

`stan początkowy + przychody gotówką - wydatki gotówką + korekta = stan portfela`.

Po wrzuceniu na GitHub Pages uruchom adres z dopiskiem `?v=115` albo użyj przycisku „Odśwież program”.
