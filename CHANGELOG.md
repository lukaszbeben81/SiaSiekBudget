# Changelog

Wszystkie istotne zmiany w projekcie SiaSiek Budget będą dokumentowane w tym pliku.

Format bazuje na [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
a projekt używa [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3] - 2025-12-08

### ✨ Dodano
- **Eksport danych do Excel/CSV/TXT** - możliwość eksportu danych z aplikacji:
  - **Bieżący miesiąc** - eksport przychodów, wydatków i podsumowania miesiąca
  - **Wydatki stałe** - eksport katalogu wydatków stałych
  - **Dochody stałe** - eksport katalogu dochodów stałych
  - **Skarbonki** - eksport listy skarbonek z postępem oszczędzania
  - **Długi** - eksport aktywnych długów lub historii spłaconych długów
- **Przycisk eksportu** - dodano przyciski eksportu we wszystkich widokach z menu wyboru formatu (Excel/CSV/TXT)

### 🔧 Naprawiono
- **Wyświetlanie dni dla przyszłych okresów** - jeśli okres rozliczeniowy jeszcze się nie rozpoczął, aplikacja wyświetla pełną liczbę dni okresu (np. 31 dni dla grudnia) zamiast licznika odliczającego do początku okresu

### 📝 Zmiany techniczne
- Dodano moduł `exportHelpers.ts` z funkcjami eksportu do różnych formatów
- Eksport do Excel wykorzystuje format XML (Excel 2003) kompatybilny z większością wersji Excel
- Wszystkie eksporty zawierają BOM UTF-8 dla poprawnego kodowania polskich znaków
- Funkcja `getDaysRemaining()` już wspiera logikę przyszłych okresów (z wersji 1.2.2)

## [1.2.2] - 2025-12-07

### ✨ Dodano
- **Automatyczne aktualizacje** - integracja z electron-updater dla automatycznego pobierania i instalacji aktualizacji
- **Powiadomienia o aktualizacjach** - aplikacja automatycznie sprawdza dostępność nowych wersji przy starcie

### 🔧 Naprawiono
- **Dni pozostało dla przyszłych okresów** - dla okresów które się jeszcze nie rozpoczęły, wyświetlana jest pełna liczba dni okresu zamiast błędnej wartości
- **Ikona aplikacji na pulpicie** - naprawiono wyświetlanie ikony dolar.ico zamiast domyślnej ikony React na skrócie pulpitu
- **Auto-update** - pełna implementacja automatycznego systemu aktualizacji przez electron-updater

### 📝 Zmiany techniczne
- Dodano `electron-updater` do zależności
- Zaktualizowano `getDaysRemaining()` aby obsługiwać okresy przyszłe
- Dodano konfigurację `publish` w package.json dla GitHub releases
- Zaktualizowano installer.nsh dla poprawnego tworzenia skrótów z ikoną

## [1.2.1] - 2025-12-07

### ✨ Dodano
- **Własna ikona aplikacji** - dodano ikonę dolar.ico dla aplikacji (widoczna na pulpicie Windows i pasku zadań)
- **Tooltips (podpowiedzi)** - dodano opisy podpowiedzi dla wszystkich pól w aplikacji:
  - MonthView: Dni, Zakupy/D, Dochody, Pozostało, Do zapłaty, Zapłacono
  - TopBar: Data, Dni, Pozostało, Do zapłaty, Wartość długu
  - IncomeForm: wszystkie pola formularza dochodu
  - ExpenseForm: wszystkie pola formularza wydatku
  - CreateMonth: wszystkie pola w kreatorze miesiąca

### 🎨 Zmiany interfejsu
- **Skrócono napisy** dla lepszej czytelności:
  - "Dni pozostało" → "Dni"
  - "Zakupy dzienne" → "Zakupy/D"
- **Zmniejszono czcionkę** dla pól "Dni" i "Zakupy/D" (label: 0.6rem, value: 0.85rem)
- **Okno zmaksymalizowane** - aplikacja startuje w trybie zmaksymalizowanym z widocznym paskiem tytułowym Windows (przyciski minimalizuj/maksymalizuj/zamknij)

### 🔧 Naprawiono
- **Nazwa repozytorium GitHub** - poprawiono nazwę z 'SiaSiek/SiaSiekBudget' na 'lukaszbeben81/SiaSiekBudget' dla działania auto-update

## [1.2.0] - 2025-12-07

### ✨ Dodano
- **Tryb pełnoekranowy** - aplikacja uruchamia się automatycznie w trybie fullscreen
- **Ukryty pasek menu** - pasek menu (File, Edit, View, Window, Help) jest domyślnie ukryty, można go przywołać klawiszem Alt

### 🔧 Naprawiono
- **Wyświetlanie "PLN0" zamiast "PLN"** - naprawiono błąd w warunkach JSX, gdzie wartość 0 była renderowana jako tekst
- **Nieprawidłowa nazwa miesiąca w Kroku 1** - naprawiono aby po wybraniu "grudzień 2025" w Kroku 0, również Krok 1 wyświetlał "grudzień" zamiast "listopad"
- **Ignorowanie ustawień kolumn z katalogu wydatków** - system teraz poprawnie pobiera `column_number` z katalogu wydatków zamiast obliczać je na podstawie kategorii

### 🎨 Zmiany interfejsu
- **Przycisk "- Wydatek"** zmniejszony o 10% (padding z 0.5rem/1rem na 0.45rem/0.9rem, font-size z 0.9rem na 0.81rem)

### 📝 Zmiany techniczne
- Zmieniono warunki w JSX z `{value && value > 0 && (...)}` na `{value !== undefined && value > 0 && (...)}`
- Dodano `fullscreen: true` i `autoHideMenuBar: true` w konfiguracji BrowserWindow
- Priorytet pobierania `column_number`: najpierw z katalogu/poprzedniego miesiąca, potem obliczenie z kategorii jako fallback

## [1.1.0] - 2025-12-07

### ✨ Dodano
- **Wybór miesiąca przy tworzeniu** - nowy Krok 0 pozwala wybrać który miesiąc utworzyć (bieżący, poprzedni lub własny okres)
- **Zabezpieczenie przed duplikatami** - system sprawdza czy miesiąc o danym okresie już istnieje
- **Przycisk "Utwórz nowy"** w topbarze aktualnego miesiąca - szybki dostęp do tworzenia następnego okresu
- **Opcja własnego okresu** - możliwość ręcznego określenia dat i nazwy miesiąca
- **Opcja "do kiedy"** w formularzu wydatków stałych - możliwość ustawienia daty końcowej wystąpienia wydatku
- **Funkcja modyfikacji** w Kroku 2 tworzenia miesiąca - teraz przycisk "Modyfikuj" prawidłowo edytuje wydatek zamiast go usuwać
- **Opcja modyfikacji długu** na stronie Długi - możliwość edycji wszystkich danych istniejącego długu

### 🔧 Naprawiono
- Przycisk "Modyfikuj" w Kroku 2 tworzenia miesiąca działał jak "Usuń" - naprawiono logikę edycji
- **Błąd obliczania dat okresów** - naprawiono algorytm obliczania dat końcowych okresów rozliczeniowych
- **Nieprawidłowe nazwy miesięcy** - system teraz poprawnie rozpoznaje bieżący miesiąc (np. 7 grudnia = okres "grudzień 2025")
- Predefiniowany podział wydatków na 3 kolumny nie działał przy tworzeniu miesiąca - wydatki są teraz automatycznie przypisywane do odpowiednich kolumn na podstawie kategorii z ustawień
- Wydatki z poprzedniego miesiąca nie zachowywały informacji o kolumnach - teraz są poprawnie przenoszone
- **Opóźnienie przy przełączaniu na "Własny okres"** - zoptymalizowano obsługę zmiany opcji
- Formularze dat na stronie Długi już używają kalendarza (type="date") zamiast ręcznego wprowadzania

### 🗑️ Usunięto
- **Pole procentowe oszczędności** z ustawień (było nieużywane)
- **Opcja "Co rok"** z formularza wydatków - pozostawiono tylko "Co miesiąc" i "Inne..." z wyborem miesięcy

### 📝 Zmiany
- Proces tworzenia miesiąca rozpoczyna się teraz od wyboru okresu (Krok 0)
- Wydatki ładowane z poprzedniego miesiąca zachowują teraz informację o przypisaniu do kolumn
- Wydatki bez przypisanej kolumny są automatycznie przypisywane na podstawie kategorii
- Formularz wydatków zawiera teraz checkbox "Wydatek bez daty końcowej" oraz pole daty końcowej
- Nie można wrócić do kroku wyboru miesiąca po załadowaniu danych (zapobiega pomyłkom)

### 💡 Logika działania wyboru miesiąca
- System sprawdza dzień rozliczeniowy z ustawień (np. 10)
- Na podstawie dzisiejszej daty określa bieżący okres:
  - Jeśli dziś jest 7 grudnia i billing_day=10 → bieżący: **grudzień 2025** (10.12 - 09.01)
  - Jeśli dziś jest 12 grudnia i billing_day=10 → bieżący: **grudzień 2025** (10.12 - 09.01)
  - Jeśli dziś jest 8 grudnia i billing_day=10 → bieżący: **listopad 2025** (10.11 - 09.12)
- Pozwala utworzyć poprzedni miesiąc jeśli nie istnieje
- Pozwala utworzyć bieżący miesiąc jeśli nie istnieje
- Blokuje tworzenie już istniejących miesięcy
- Umożliwia utworzenie własnego okresu z dowolnymi datami (z kalendarzem)
- **Kalendarze dla dat** - pola "Data początkowa" i "Data końcowa" używają natywnego selektora dat

### ⚠️ Uwaga dla użytkowników
- Po aktualizacji wszystkie dane pozostaną nienaruszone
- Nowe funkcje będą dostępne natychmiast po aktualizacji
- Usuniętych pól nie trzeba już wypełniać
- Przy tworzeniu nowego miesiąca najpierw wybierz okres w Kroku 0

## [1.0.0] - 2025-12-06

### ✨ Dodano
- Kompletny system zarządzania budżetem domowym
- Dashboard z wykresami i statystykami wydatków (Chart.js)
- Kreator tworzenia nowych miesięcy z automatycznym przenoszeniem danych
- Widok szczegółowy miesiąca z możliwością edycji
- Katalog stałych wydatków i przychodów
- System zarządzania długami z historią spłat
- Skarbonka oszczędnościowa z celami finansowymi
- Moduł archiwum z analizą historyczną
- System autoryzacji użytkowników (admin/user)
- Zarządzanie użytkownikami (maksymalnie 5)
- Tryb tylko do odczytu dla użytkowników bez uprawnień administratora
- Konfigurowalna nazwa aplikacji (maks. 30 znaków)
- Kategorie chronione (Żywność, Spłata długu, Mieszkanie, Skarbonka, Rata)
- Kreator pierwszego uruchomienia
- TopBar z podsumowaniem finansowym
- Modale informacyjne z logo aplikacji
- Cytaty motywacyjne na Dashboard
- Tryb deweloperski w ustawieniach
- Instrukcja użytkownika (User Manual)

### 🔧 Naprawiono
- Optymalizacja wydajności formularzy wydatków (debouncing 300ms)
- Redukcja zapytań do bazy danych podczas wprowadzania danych
- Poprawki w logice wylogowania użytkownika
- Przywracanie chronionych kategorii po czyszczeniu bazy
- Problemy z zamrażaniem pól tekstowych podczas wpisywania

### 🎨 Zmiany interfejsu
- Ciemny motyw z neonowymi akcentami
- Spójna paleta kolorów w całej aplikacji
- Dwukolumnowy układ w modalach informacyjnych
- Responsywne wykresy i statystyki
- Liczniki znaków w polach tekstowych z limitami

### 🛠️ Techniczne
- Baza danych: lowdb (JSON-based)
- Frontend: React 18 + TypeScript
- Backend: Electron 28
- Wykresy: Chart.js + react-chartjs-2
- Routing: React Router v6
- Build: Vite + electron-builder
- Bezpieczeństwo: bcryptjs dla haszowania haseł

### 📦 Instalator
- Wygenerowany instalator Windows (.exe)
- Rozmiar: ~85 MB
- Automatyczna instalacja i uruchomienie

---

## Legenda typów zmian

- **Dodano** - nowe funkcje
- **Zmieniono** - zmiany w istniejącej funkcjonalności
- **Naprawiono** - poprawki błędów
- **Usunięto** - usunięte funkcje
- **Bezpieczeństwo** - zmiany związane z bezpieczeństwem
- **Zdeprecjonowano** - funkcje do usunięcia w przyszłości
