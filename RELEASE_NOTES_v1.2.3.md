# SiaSiek Budget v1.2.3

## 📥 Nowa funkcjonalność: Eksport danych

Wersja 1.2.3 wprowadza kompleksowy system eksportu danych z aplikacji do różnych formatów plików.

### ✨ Co nowego

#### Eksport do Excel, CSV i TXT
Dodano możliwość eksportowania danych we wszystkich kluczowych sekcjach aplikacji:

- **📊 Bieżący miesiąc** - eksportuj przychody, wydatki i pełne podsumowanie finansowe miesiąca
- **💸 Wydatki stałe** - wyeksportuj katalog wszystkich wydatków stałych z kategoriami i kwotami
- **💰 Dochody stałe** - zapisz listę stałych przychodów do pliku
- **🐷 Skarbonki** - eksportuj cele oszczędnościowe wraz z postępem realizacji
- **💳 Długi** - wyeksportuj aktywne długi lub historię spłaconych zobowiązań

#### Formaty eksportu
Każda sekcja oferuje eksport do trzech formatów:
- **📊 Excel** (.xls) - format kompatybilny z Microsoft Excel i LibreOffice Calc
- **📄 CSV** (.csv) - uniwersalny format tekstowy z separatorem średnikiem
- **📝 TXT** (.txt) - plik tekstowy z formatowaniem tabelarycznym

#### Kodowanie UTF-8
Wszystkie eksporty zawierają prawidłowe kodowanie UTF-8 z BOM, co zapewnia poprawne wyświetlanie polskich znaków w Excel.

### 🔧 Poprawki

#### Wyświetlanie dni dla przyszłych okresów
Naprawiono wyświetlanie liczby dni dla okresów rozliczeniowych, które jeszcze się nie rozpoczęły. Teraz aplikacja pokazuje pełną liczbę dni okresu (np. 31 dni dla grudnia) zamiast błędnej wartości. Dzięki temu możesz planować przyszłe miesiące z pełną wiedzą o długości okresu rozliczeniowego.

## 📦 Instalacja

### Nowa instalacja

1. Pobierz plik `SiaSiek Budget Setup 1.2.3.exe`
2. Uruchom instalator
3. Postępuj zgodnie z instrukcjami kreatora instalacji
4. Aplikacja utworzy skrót na pulpicie i w menu Start

### Aktualizacja z poprzedniej wersji

**Automatyczna aktualizacja (dla użytkowników v1.2.2+)**:
- Aplikacja automatycznie powiadomi Cię o dostępnej aktualizacji
- Kliknij "Pobierz aktualizację" i zamknij aplikację
- Instalacja rozpocznie się automatycznie

**Ręczna aktualizacja**:
1. Zamknij aplikację SiaSiek Budget
2. Pobierz i uruchom `SiaSiek Budget Setup 1.2.3.exe`
3. Instalator zaktualizuje aplikację zachowując Twoje dane

⚠️ **Uwaga**: Twoje dane (baza danych) są przechowywane w folderze `%APPDATA%\siasiek-budget` i nie zostaną usunięte podczas aktualizacji.

## 🎯 Wymagania systemowe

- System operacyjny: Windows 10 lub nowszy (64-bit)
- Procesor: Dowolny x64
- RAM: 2 GB
- Miejsce na dysku: ~200 MB

## 📚 Jak korzystać z eksportu

1. Otwórz sekcję, którą chcesz wyeksportować (np. Bieżący miesiąc, Skarbonki)
2. Kliknij przycisk **📥 Eksport**
3. Wybierz format pliku: **Excel**, **CSV** lub **TXT**
4. Plik zostanie automatycznie pobrany do folderu Pobrane

## 🔄 Historia zmian

### v1.2.3 (2025-12-08)
- ✨ Dodano eksport danych do Excel/CSV/TXT we wszystkich sekcjach
- 🔧 Naprawiono wyświetlanie dni dla przyszłych okresów rozliczeniowych
- 📝 Dodano moduł `exportHelpers.ts` z uniwersalnymi funkcjami eksportu

### v1.2.2 (2025-12-07)
- ✨ Automatyczne aktualizacje przez electron-updater
- 🔧 Naprawiono obliczanie dni dla przyszłych okresów
- 🔧 Poprawiono ikonę na pulpicie (dolar.ico)

### v1.2.1 (2025-12-07)
- ✨ Dodano własną ikonę aplikacji (dolar.ico)
- ✨ Tooltips dla wszystkich pól w aplikacji
- 🎨 Skrócono napisy UI dla lepszej czytelności

## 🐛 Znane problemy

Brak znanych problemów w tej wersji.

## 💬 Wsparcie

W razie problemów z aplikacją:
1. Sprawdź plik `%APPDATA%\siasiek-budget\budget.json` (lokalizacja Twojej bazy danych)
2. Zgłoś problem w sekcji [Issues](https://github.com/lukaszbeben81/SiaSiekBudget/issues) na GitHubie
3. Dołącz informacje o wersji Windows i opisz kroki do odtworzenia problemu

---

**Autor**: Łukasz Beben  
**Licencja**: MIT  
**Repozytorium**: https://github.com/lukaszbeben81/SiaSiekBudget
