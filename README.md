# Portfel PRO v. 1.1 / 134 — naprawa magazynu: formatInventoryAction i edycja komórek

Wersja: **1.1 / 134**  
Data: **08.06.2026**

## Zmiany

- Usunięto edycję przez przycisk **Edytuj** w magazynie.
- Usunięto edycję przez dwuklik.
- Edycja magazynu działa tylko przez dłuższe przytrzymanie konkretnej komórki.
- Przytrzymanie nazwy edytuje tylko nazwę produktu.
- Przytrzymanie ilości edytuje tylko ilość.
- Przytrzymanie jednostki pokazuje wybór jednostki.
- Przytrzymanie średniego kosztu edytuje tylko koszt.
- Przytrzymanie kategorii pokazuje wybór kategorii.
- Poprawiono obsługę przycisku **Usuń** w magazynie.
- Usuwanie nadal działa bez potwierdzania, z krótkim przyciskiem **Cofnij**.
- Podbito cache PWA do wersji `v=134`.
- Zaktualizowano skrypt `upload_to_github.ps1` z wpisanym repozytorium:
  `https://github.com/tomalawsb/Bilans-PWA-.git`.

## Adres po wdrożeniu

```text
https://tomalawsb.github.io/Bilans-PWA-/?v=134
```

## Poprawka 1.1 / 134

- Naprawiono błąd `formatInventoryAction is not defined`, który zatrzymywał moduł magazynu.
- Po naprawie tabela magazynu, przycisk Usuń oraz edycja komórek przez dłuższe przytrzymanie powinny działać.
- Edycja magazynu odbywa się wyłącznie przez dłuższe przytrzymanie konkretnej komórki: nazwa, ilość, jednostka, średni koszt albo kategoria.
- Nie przywracano edycji przez przycisk Edytuj ani przez dwuklik.
