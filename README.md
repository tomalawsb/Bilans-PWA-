# Portfel PRO v. 1.1 / 153

Lokalna aplikacja PWA do prowadzenia bilansu, historii, raportów, kalendarza i magazynu. Dane są zapisywane w IndexedDB, opcjonalnie mogą być synchronizowane przez Dropbox.

## Najważniejsze zmiany wersji 153

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
http://localhost:8000/?v=153
```

Nie otwieraj `index.html` bezpośrednio z dysku, jeśli chcesz testować PWA, cache, import lub instalację.

## Instalacja

- Portfel PRO: Ustawienia → Aplikacja i skróty → Zainstaluj aplikację. Przycisk jest widoczny wyłącznie, kiedy instalacja jest dostępna.
- Mikrofon: Ustawienia → Aplikacja i skróty → Zainstaluj mikrofon. Otwiera osobną aplikację z własną ikoną i manifestem.
- Kopie danych i import znajdują się w zakładce Kopie.

## Inteligentne rozpoznawanie

Bez klucza API działa parser lokalny i samouczenie. Po zapisaniu klucza w Ustawieniach tekst z sekcji „Paragon / szybkie AI” jest klasyfikowany przez wybranego dostawcę AI. Jawne określenia typu, np. „dochód” lub „wydatek”, zawsze mają pierwszeństwo przed sugestią modelu.

## Kontrole techniczne

```text
node --check src/app.js
node --check service-worker.js
```

Manifesty `manifest.webmanifest` i `manifest-voice.webmanifest` muszą pozostać poprawnym JSON-em, a wszystkie zasoby PWA powinny używać wersji `v=153`.
