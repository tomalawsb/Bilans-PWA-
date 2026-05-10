# Portfel PRO v. 1.1 — samouczenie kategorii

## Zmiany w wersji 1.1
- dodano lokalne samouczenie kategorii na podstawie poprawek użytkownika;
- program zapamiętuje poprawki z podglądu rozpoznania, np. `lody -> Jedzenie`;
- po dwóch potwierdzeniach podobne frazy są kategoryzowane automatycznie;
- dodano panel **Ustawienia -> Samouczenie kategorii** z listą nauczonych reguł;
- dodano usuwanie pojedynczych nauczonych reguł oraz czyszczenie całej nauki;
- nauczone reguły są eksportowane do JSON i synchronizowane przez Dropbox razem z wpisami;
- podbito cache PWA do `v111`;
- wersja widoczna w programie: `v. 1.1`.

## Jak działa nauka
1. Wpisujesz tekst i klikasz **Rozpoznaj**.
2. Program wybiera kategorię.
3. Jeżeli poprawisz kategorię w podglądzie i zapiszesz wpis, program zapisuje tę poprawkę jako regułę.
4. Po dwóch takich potwierdzeniach reguła staje się aktywna automatycznie.

Przykład: jeśli dwa razy poprawisz `lody` z `Inne` na `Jedzenie`, kolejne podobne wpisy z lodami dostaną kategorię `Jedzenie`.

## Ważne
Rdzeń zapisu wpisów, importu JSON i połączenia Dropbox nie został przebudowany. Dodano osobny magazyn `learningRules` w IndexedDB oraz eksport/import tych reguł w pliku JSON.

## Dropbox App Key
Jeżeli chcesz zaszyć własny Dropbox App Key, otwórz `src/config.js` i ustaw:

```js
dropboxAppKey: "WSTAW_TUTAJ_SWÓJ_DROPBOX_APP_KEY"
```

Nie wpisuj App Secret.


## Etap 47-48 — Portfel PRO v. 1.1

Dodano:
- inteligentne wnioski w zakładce Raporty,
- wykrywanie wydatków cyklicznych na podstawie podobnych opisów/grup,
- podbicie cache PWA do v111.


## Etap 49 — Portfel gotówkowy

Dodano w zakładce **Raporty** sekcję **Portfel gotówkowy**:
- ręczny stan początkowy gotówki dla wybranego miesiąca,
- automatyczne doliczanie tylko wpisów z płatnością **Gotówka**,
- ignorowanie płatności: karta, BLIK, bank/przelew i inne,
- ręczne korekty portfela, np. po fizycznym przeliczeniu gotówki,
- eksport/import `walletMonths` w JSON razem z wpisami, regułami tagów i samouczeniem,
- podbicie cache PWA do `v112`.
