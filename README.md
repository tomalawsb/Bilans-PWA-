# Portfel PRO v. 1.0 — Etap 33

Poprawki:
- przycisk **Zainstaluj aplikację** jest widoczny także wtedy, gdy Chrome nie wysłał jeszcze automatycznego zdarzenia instalacji;
- po kliknięciu bez dostępnego instalatora program pokazuje instrukcję ręcznej instalacji z menu Chrome;
- konfiguracja Dropboxa została przeniesiona do `src/config.js`;
- użytkownik końcowy po wpisaniu App Key przez właściciela programu klika tylko **Połącz z Dropbox**;
- podbito cache do v33.

Ważne dla autora programu:
1. Otwórz `src/config.js`.
2. Wpisz publiczny Dropbox App Key w polu `dropboxAppKey`.
3. Wgraj całą paczkę na GitHub Pages.

Bez App Key Dropbox nie może uruchomić logowania OAuth — tego nie da się pominąć technicznie.

## Etap 33
- Poprawiono instalację osobnej ikony mikrofonu.
- Dodano osobny adres i manifest PWA dla mikrofonu: `voice/index.html`.
- Główna aplikacja i mikrofon mają teraz osobne `id`, `start_url` i `scope`, dzięki czemu Chrome może rozróżnić dwie instalacje.
