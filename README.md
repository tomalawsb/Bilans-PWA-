# Bilans PWA — Etap 17

Lokalna aplikacja PWA do zapisywania przychodów, wydatków, raportów i kalendarza.

## Co dodano w Etapie 17

- szybkie dodawanie głosem,
- przycisk **Dodaj głosem** w nagłówku,
- tryb uruchamiany adresem:

```text
index.html?action=voice
```

- skrót PWA w `manifest.webmanifest`: **Dodaj głosem**,
- rozpoznany tekst trafia do dotychczasowego parsera,
- po rozpoznaniu można sprawdzić wpisy i zapisać je do historii,
- podbita wersja aplikacji, manifestu i cache do Etapu 17.

## Jak uruchomić lokalnie

Na Windows uruchom:

```bat
run_local_windows.bat
```

Potem otwórz adres pokazany w konsoli.

## Jak używać na telefonie

Najlepiej wrzucić katalog na GitHub Pages albo inny hosting HTTPS. Mikrofon w przeglądarce wymaga zwykle HTTPS albo lokalnego środowiska.

Po zainstalowaniu PWA na Androidzie przytrzymaj ikonę aplikacji. Powinien pojawić się skrót **Dodaj głosem**. Dostępność skrótów zależy od przeglądarki i launchera Androida.

## Dane

Dane są zapisywane lokalnie w IndexedDB przeglądarki. Import i eksport danych nadal działa przez pliki JSON.
