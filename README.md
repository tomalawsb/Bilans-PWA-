# Portfel PRO v. 1.1 / 154

Lokalna aplikacja PWA do prowadzenia bilansu, historii, raportów, kalendarza i magazynu. Dane są zapisywane w IndexedDB, opcjonalnie mogą być synchronizowane przez Dropbox.

## Najważniejsze zmiany wersji 154

- działanie local-first: uruchomienie, przeglądanie, dodawanie i edycja danych nie wymagają internetu;
- Dropbox nie blokuje startu, nie zgłasza błędu przy braku sieci i synchronizuje oczekujące zmiany automatycznie po odzyskaniu połączenia;
- pliki PWA są otwierane najpierw z pamięci urządzenia i aktualizowane w tle;
- zewnętrzne AI jest automatycznie pomijane offline, a parser lokalny nadal przygotowuje wpisy;
- mały status offline i wszystkie komunikaty są nakładkami, więc nie przesuwają interfejsu;
- poprawione samouczenie: nowsza korekta zastępuje sprzeczną starszą regułę dla tego samego sformułowania;
- naprawione końcowe reguły responsywności okna edycji i zakładki Kopie.

## Zmiany odziedziczone z wersji 153

- uproszczony ekran główny: bez ręcznego formularza, banerów skrótów i przycisków technicznych;
- dodawanie wpisów przez sekcję „Paragon / szybkie AI”, z możliwością poprawy wszystkich pól przed zapisem;
- osobna aplikacja PWA „Mikrofon”, instalowana z Ustawień;
- instalacja Portfel PRO jest proponowana tylko wtedy, gdy przeglądarka faktycznie udostępni zdarzenie instalacyjne;
- ciągły portfel gotówkowy, bez zerowania przy zmianie miesiąca;
- poprawiona obsługa słów oznaczających przychód, w tym „dochód”, „zysk”, „utarg”, „wynagrodzenie” i „pensja”;
- samouczenie typu, rodzaju, kategorii oraz metody płatności po zapisaniu poprawionego podglądu;
- opcjonalna klasyfikacja wpisów przez skonfigurowane Gemini lub OpenAI, z bezpiecznym powrotem do parsera lokalnego przy błędzie API;
- responsywny układ bez poziomego przepełnienia na telefonie, tablecie i komputerze;
- edycja istniejącego wpisu odbywa się w osobnym oknie otwieranym z Historii.
- rutynowa synchronizacja Dropbox nie wyświetla globalnego banera i nie przesuwa zawartości ekranu; jej stan jest widoczny tylko w zakładce Kopie, natomiast błędy nadal są pokazywane globalnie.

## Uruchomienie lokalne

Uruchom `run_local_windows.bat`, a następnie otwórz:

```text
http://localhost:8000/?v=154
```

Nie otwieraj `index.html` bezpośrednio z dysku, jeśli chcesz testować PWA, cache, import lub instalację.

## Instalacja

- Portfel PRO: Ustawienia → Aplikacja i skróty → Zainstaluj aplikację. Przycisk jest widoczny wyłącznie, kiedy instalacja jest dostępna.
- Mikrofon: Ustawienia → Aplikacja i skróty → Zainstaluj mikrofon. Otwiera osobną aplikację z własną ikoną i manifestem.
- Kopie danych i import znajdują się w zakładce Kopie.

## Inteligentne rozpoznawanie

Bez klucza API działa parser lokalny i samouczenie. Po zapisaniu klucza w Ustawieniach tekst z sekcji „Paragon / szybkie AI” jest klasyfikowany przez wybranego dostawcę AI. Jawne określenia typu, np. „dochód” lub „wydatek”, zawsze mają pierwszeństwo przed sugestią modelu.

## Praca bez internetu

Po pierwszym uruchomieniu online aplikacja zapisuje swoje pliki na urządzeniu. Następne uruchomienia oraz wszystkie operacje na lokalnych danych działają offline. Jeśli włączono Dropbox, zmiany oczekują lokalnie i synchronizują się po powrocie internetu. Zewnętrzne AI oraz przeglądarkowe rozpoznawanie mowy mogą wymagać sieci, ale wpisywanie tekstu i parser lokalny działają bez niej.

## Kontrole techniczne

```text
node --check src/app.js
node --check service-worker.js
```

Manifesty `manifest.webmanifest` i `manifest-voice.webmanifest` muszą pozostać poprawnym JSON-em, a wszystkie zasoby PWA powinny używać wersji `v=154`.
