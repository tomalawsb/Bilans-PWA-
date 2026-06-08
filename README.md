# Portfel PRO v. 1.1 / 137 — poprawka rozpoznawania kwot z dyktowania

Wersja: **1.1 / 137**  
Data: **08.06.2026**

## Zmiany w wersji 1.1 / 137

- Poprawiono parser dyktowanych kwot przed etapem dzielenia tekstu na osobne pozycje.
- Fraza typu `36 zł 43 zł makaron do domu` jest rozpoznawana jako jedna pozycja z kwotą `36,43 zł`, a nie jako dwa wpisy `36 zł` i `43 zł`.
- Poprawiono przypadki bez spacji przy walucie, np. `30zł 45zł` → `30,45 zł`.
- Poprawiono analogiczny przypadek z dwoma zapisami groszy, np. `30 groszy 80 groszy` → `30,80 zł`.
- Zachowano zmiany magazynu z poprzednich wersji: wyszukiwarka magazynu, synchronizacja magazynu przez Dropbox, edycja komórek przez dłuższe przytrzymanie, usuwanie bez potwierdzania z krótkim cofnięciem.
- Podbito wersję programu do **1.1 / 137** i cache PWA do **v=137**.
- `upload_to_github.ps1` ma wpisane repozytorium: `https://github.com/tomalawsb/Bilans-PWA-.git`.

## Adres po wdrożeniu

```text
https://tomalawsb.github.io/Bilans-PWA-/?v=137
```
