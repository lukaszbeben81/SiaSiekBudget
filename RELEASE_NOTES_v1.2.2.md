# 🎉 SiaSiek Budget v1.2.2

## 📋 Opis wydania

Wersja 1.2.2 to **aktualizacja krytyczna** naprawiająca trzyważne problemy: błędne obliczanie dni dla przyszłych okresów, pełną implementację automatycznych aktualizacji oraz poprawę wyświetlania ikony aplikacji. Dodatkowo zawiera wszystkie usprawnienia z wersji 1.2.1 (tooltips, skrócone napisy, zmaksymalizowane okno).

---

## ✨ Nowości

### 🔄 Automatyczne aktualizacje
- **Pełna integracja z electron-updater** - automatyczne pobieranie i instalacja aktualizacji
- **Sprawdzanie przy starcie** - aplikacja automatycznie sprawdza dostępność nowych wersji
- **Powiadomienia** - wyświetlanie informacji o dostępnych aktualizacjach
- **Automatyczna instalacja** - aktualizacja instaluje się przy zamykaniu aplikacji
- **Nie musisz już ręcznie pobierać z GitHub!**

### 🎨 Z wersji 1.2.1 - Ikona aplikacji
- Dodano własną ikonę `dolar.ico` dla aplikacji
- Ikona widoczna na pulpicie Windows i pasku zadań
- Profesjonalny wygląd aplikacji w systemie

### 💡 Z wersji 1.2.1 - Tooltips (podpowiedzi)
Dodano opisy podpowiedzi dla **wszystkich pól** w aplikacji:

**Strona miesiąca (MonthView):**
- Dni - "Liczba dni pozostałych do końca okresu rozliczeniowego"
- Zakupy/D - "Suma wydatków na zakupy dzienne do końca okresu"
- Dochody - "Suma wszystkich dochodów w bieżącym okresie"
- Pozostało - "Kwota pozostała po odliczeniu wszystkich wydatków i rezerw"
- Do zapłaty - "Suma wszystkich niezapłaconych wydatków"
- Zapłacono - "Suma wszystkich opłaconych wydatków"

**Górny pasek (TopBar):**
- Data, Dni, Pozostało, Do zapłaty, Wartość długu

**Formularze:**
- Wszystkie pola w formularzach dochodów i wydatków
- Wszystkie pola w kreatorze nowego miesiąca

---

## 🔧 Poprawki

### 🐛 Krytyczne naprawy

**1. Dni pozostało dla przyszłych okresów**
- Naprawiono błąd gdzie przyszłe okresy (np. grudzień przed 10. grudnia) pokazywały błędną liczbę dni
- Teraz dla okresów które się jeszcze nie rozpoczęły wyświetlana jest pełna liczba dni okresu
- Poprawia to również obliczenia "Do zapłaty" i "Zakupy/D"

**2. Automatyczne aktualizacje**
- Pełna implementacja przez `electron-updater`
- Aktualizacje pobierają się automatycznie w tle
- Instalacja następuje przy zamykaniu aplikacji
- Nie trzeba już ręcznie wchodzić na GitHub i pobierać plików!

**3. Ikona na pulpicie**
- Naprawiono wyświetlanie ikony React zamiast ikony dolar.ico
- Skrót na pulpicie teraz używa właściwej ikony aplikacji
- Poprawiono konfigurację NSIS installer

---

## 🎨 Usprawnienia interfejsu (z 1.2.1)

**Skrócone napisy:**
- "Dni pozostało" → **"Dni"**
- "Zakupy dzienne" → **"Zakupy/D"**

**Zmniejszona czcionka:**
- Pola "Dni" i "Zakupy/D" mają mniejszą czcionkę dla lepszego wykorzystania przestrzeni
- Label: 0.6rem (zamiast 0.7rem)
- Value: 0.85rem (zamiast 0.95rem)

**Okno aplikacji:**
- Aplikacja startuje w trybie **zmaksymalizowanym**
- Widoczny pasek tytułowy Windows z przyciskami:
  - ➖ Minimalizuj
  - 🗖 Maksymalizuj/Przywróć
  - ✖ Zamknij
- Menu nadal ukryte (klawisz **Alt** aby pokazać)

---

## 📦 Instalacja

### Nowa instalacja
1. Pobierz plik `SiaSiek Budget Setup 1.2.2.exe`
2. Uruchom instalator
3. Postępuj zgodnie z instrukcjami na ekranie

### Aktualizacja z wersji 1.2.0 lub 1.2.1
**Opcja 1 - Automatyczna (zalecane):**
1. Uruchom aplikację w starej wersji
2. Aplikacja automatycznie sprawdzi dostępność aktualizacji
3. Kliknij "Pobierz aktualizację" gdy się pojawi
4. Zamknij aplikację - aktualizacja zainstaluje się automatycznie

**Opcja 2 - Ręczna:**
1. Pobierz plik `SiaSiek Budget Setup 1.2.2.exe`
2. Uruchom instalator
3. Instalator zaktualizuje aplikację

**Uwaga:** Twoje dane są bezpieczne - baza danych nie zostanie usunięta podczas aktualizacji.

---

## 📝 Pliki do pobrania

Po utworzeniu release, dodaj następujące pliki:

- `SiaSiek Budget Setup 1.2.2.exe` - Instalator (ok. 92 MB)
- `SiaSiek Budget Setup 1.2.2.exe.blockmap` - Plik kontrolny dla auto-update
- `latest.yml` - Metadata dla auto-update

---

## 🔗 Pełna historia zmian

Zobacz plik [CHANGELOG.md](https://github.com/lukaszbeben81/SiaSiekBudget/blob/main/CHANGELOG.md) dla kompletnej historii zmian.

---

## 🐛 Zgłaszanie błędów

Jeśli znajdziesz błąd lub masz sugestię, utwórz [Issue](https://github.com/lukaszbeben81/SiaSiekBudget/issues) na GitHubie.

---

**Dziękujemy za korzystanie z SiaSiek Budget!** 🎯💰
