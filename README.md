# Portfel PRO v. 1.1 — samouczenie kategorii

## Zmiany w wersji 1.1
- dodano lokalne samouczenie kategorii na podstawie poprawek użytkownika;
- program zapamiętuje poprawki z podglądu rozpoznania, np. `lody -> Jedzenie`;
- po dwóch potwierdzeniach podobne frazy są kategoryzowane automatycznie;
- dodano panel **Ustawienia -> Samouczenie kategorii** z listą nauczonych reguł;
- dodano usuwanie pojedynczych nauczonych reguł oraz czyszczenie całej nauki;
- nauczone reguły są eksportowane do JSON i synchronizowane przez Dropbox razem z wpisami;
- podbito cache PWA do `v110`;
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
