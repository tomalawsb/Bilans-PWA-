# Portfel PRO v. 1.1 / 141 — pełna przebudowa parsera i uczenia

Wersja: **1.1 / 141**  
Data: 2026-06-08

## Zmiany w wersji 1.1 / 141

- Przebudowano priorytet parsera: jawne słowa **przychód / wydatek** mają pierwszeństwo przed nauczonymi regułami.
- Dodano punktowanie kategorii zamiast wybierania pierwszego pasującego słowa.
- Moduł uczenia zapisuje teraz pełniejszą decyzję: typ wpisu, rodzaj, kategorię, płatność i grupę raportową.
- Nauczone reguły są dopasowywane z uwzględnieniem kontekstu: typ wpisu, rodzaj i podobieństwo frazy.
- Błędne reguły są osłabiane: jeżeli użytkownik poprawi wynik po zastosowaniu reguły, program zwiększa licznik błędów tej reguły.
- Reguły z dużą liczbą błędów są automatycznie wyłączane.
- W panelu nauczonych reguł pokazano: decyzję, potwierdzenia, błędy, pewność oraz stan aktywna/wyłączona.
- Dodano możliwość ręcznego włączenia/wyłączenia nauczonej reguły.
- Uczenie nadal ignoruje ogólne źródła typu „Wpis z tekstu”, żeby nie tworzyć błędnych reguł masowych.
- Podbito wersję programu do **1.1 / 141** i cache PWA do **v=141**.
- `upload_to_github.ps1` nie pyta o opis commita i ma wpisane repozytorium GitHub.

## Adres po wdrożeniu

```text
https://tomalawsb.github.io/Bilans-PWA-/?v=141
```
