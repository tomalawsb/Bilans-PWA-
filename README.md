# Portfel PRO v. 1.2 / 156

Lokalna aplikacja PWA do prowadzenia bilansu, historii, raportów, kalendarza i magazynu. Dane są zapisywane w IndexedDB, opcjonalnie mogą być synchronizowane przez Dropbox.

## Najważniejsze zmiany wersji 156

- nowa nawigacja: na telefonie dolne menu Bilans · Historia · Raporty · Kalendarz · Więcej; „Więcej” zawiera Magazyn, Kopie, Kategorie i raport, Pomoc, Ustawienia; na tablecie górne menu z rozwijanym „Więcej”, na komputerze pełne menu w jednym wierszu;
- nowa sekcja „Kategorie i raport” (raport główny, kategorie, baza tagów, samouczenie) — przeniesiona z Ustawień bez zmiany danych; Ustawienia zawierają wyłącznie konfigurację programu (aplikacja, AI, wygląd);
- ustawienie rozmiaru czcionki: mała / standardowa / duża / bardzo duża (zapis lokalny, stosowane przed pierwszym renderowaniem);
- czytelniejsze pole „Paragon / szybkie AI” (białe tło, mocniejsza ramka, jaśniejszy placeholder, przykłady pod polem);
- po „Rozpoznaj” program czeka na wynik końcowy (także AI) i jednorazowo przewija do wyniku z uwzględnieniem przyklejonego menu;
- jawne słowa płatności (karta, gotówka, BLIK, przelew, z konta) i rodzaju (firmowe, do firmy, na firmę, służbowe / domowe, prywatne, prywatnie, do domu, dla domu) zawsze wygrywają z AI i z nauką;
- potok rozpoznawania: tekst → jawne polecenia → parser lokalny → AI → ponowne nałożenie jawnych poleceń → walidacja → wynik;
- kwoty bez „zł” (np. „Dino 13,50 karta”) i liczebniki słowne („dwóch routerów po 150”);
- usunięto przeskakiwanie strony przy starcie (stała wysokość linii daty/imienin, data wpisywana od razu, rezerwacja miejsca w kafelkach i podglądzie);
- nowa ikona programu we wszystkich rozmiarach (favicon, apple-touch-icon, PWA any/maskable, skróty), nowa wersja cache service workera;
- testy rozpoznawania: `node tests/parser.test.mjs`;
- `BUILD.cmd` i `URUCHOM.cmd` korzystają ze wspólnych narzędzi w `D:\Users\Admin\Środowiska\` (można nadpisać zmienną `SRODOWISKA_ROOT`).

## Zmiany wersji 155

- kafelek „Całość” zastąpiono „Wypłatą” z bieżącego miesiąca: przychody firmowe minus koszty firmowe, bez wydatków domowych;
- raport główny można konfigurować z pełnej listy kategorii, a kolejność widocznych kafelków zmieniać długim przytrzymaniem i przeciągnięciem;
- dodano zwykłe kategorie `Telewizja`, `Internetowe` i `Kamery`, bez usuwania dotychczasowych `TV` i `Monitoring`;
- raport kategorii i raport grup mają własny wybór miesiąca i nie dziedziczą filtrów Historii;
- Historia pozwala zaznaczyć interesujące lata, pobierając archiwalne lata dopiero wtedy, gdy są potrzebne;
- synchronizacja Dropbox używa osobnego pliku ustawień, ciągłego pliku magazynu i osobnego pliku wpisów dla każdego roku;
- starszy `bilans_dane.json` pozostaje nietkniętą kopią migracyjną, a nowe pliki są scalane z kontrolą rewizji Dropbox;
- poprawiono kafelki raportu na telefonach: opis zawija się po lewej, a kwota pozostaje widoczna po prawej bez poziomego przewijania.

## Zmiany odziedziczone z wersji 154

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

Uruchom `URUCHOM.cmd` (opcjonalnie z numerem portu, np. `URUCHOM.cmd 8080`). Skrypt użyje Pythona z `D:\Users\Admin\Środowiska\Python311`, systemowego Pythona albo — tylko gdy go brak — pobierze wspólną wersję do tego katalogu. Następnie otworzy:

```text
http://127.0.0.1:8000/?v=156
```

`BUILD.cmd` sprawdza/pobiera wspólny Node.js (`Środowiska\NodeJS`), uruchamia testy rozpoznawania, składa czystą paczkę strony w `Środowiska\Bilans\dist` i kopiuje gotowy `Bilans-1.2.157-www.zip` do katalogu projektu. Logi trafiają do `Środowiska\Bilans\logs`.

Nie otwieraj `index.html` bezpośrednio z dysku, jeśli chcesz testować PWA, cache, import lub instalację.

## Instalacja

- Portfel PRO: Więcej → Ustawienia → Aplikacja i skróty → Zainstaluj aplikację. Przycisk jest widoczny wyłącznie, kiedy instalacja jest dostępna.
- Mikrofon: Więcej → Ustawienia → Aplikacja i skróty → Zainstaluj mikrofon. Otwiera osobną aplikację z własną ikoną i manifestem.
- Kopie danych i import znajdują się w zakładce Kopie.

## Inteligentne rozpoznawanie

Bez klucza API działa parser lokalny i samouczenie. Po zapisaniu klucza w Ustawieniach tekst z sekcji „Paragon / szybkie AI” jest klasyfikowany przez wybranego dostawcę AI. Jawne określenia typu, np. „dochód” lub „wydatek”, zawsze mają pierwszeństwo przed sugestią modelu.

## Praca bez internetu

Po pierwszym uruchomieniu online aplikacja zapisuje swoje pliki na urządzeniu. Następne uruchomienia oraz wszystkie operacje na lokalnych danych działają offline. Jeśli włączono Dropbox, zmiany oczekują lokalnie i synchronizują się po powrocie internetu. Zewnętrzne AI oraz przeglądarkowe rozpoznawanie mowy mogą wymagać sieci, ale wpisywanie tekstu i parser lokalny działają bez niej.

## Kontrole techniczne

```text
node --check src/app.js
node --check service-worker.js
node tests/parser.test.mjs
```

Manifesty `manifest.webmanifest` i `manifest-voice.webmanifest` muszą pozostać poprawnym JSON-em, a wszystkie zasoby PWA powinny używać wersji `v=156`.
