# Portfel PRO v. 1.0 — Etap 36

## Zmiany
- przygotowano prosty wariant Dropboxa z kluczem wpisanym przez autora w `src/config.js`;
- zwykły użytkownik nie wpisuje App Key — klika tylko **Połącz z Dropbox**;
- Tryb zaawansowany zostaje jako awaryjna konfiguracja, gdy klucz nie został wpisany w paczce;
- podbito cache do `v36`.

## Jak zaszyć Dropbox App Key
1. Otwórz plik `src/config.js`.
2. Zamień:

```js
dropboxAppKey: "WSTAW_TUTAJ_SWÓJ_DROPBOX_APP_KEY"
```

na swój publiczny App Key z Dropbox App Console, np.:

```js
dropboxAppKey: "abcd1234twojklucz"
```

3. Nie wpisuj App Secret.
4. Wgraj całą paczkę na GitHub Pages.
5. Użytkownik kliknie **Połącz z Dropbox** i zaloguje się na swoje konto Dropbox.

## Ważne
App Key jest publicznym identyfikatorem aplikacji. Nie daje dostępu do Twojego Dropboxa. Dane użytkownika zapisują się w Dropboxie użytkownika, po jego logowaniu i zgodzie.


## Etap 36

W tym wydaniu wpisano publiczny Dropbox App Key do `src/config.js`, dzięki czemu zwykły użytkownik klika tylko **Połącz z Dropbox** i loguje się na swoje konto Dropbox.
