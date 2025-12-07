# SiaSiek Budget v1.2.0 - Release Notes

## 🎉 Pełna lista zmian

### ✨ Nowe funkcje

#### Wybór miesiąca przy tworzeniu
- **Nowy Krok 0** - wybór którego miesiąca chcesz utworzyć (bieżący, poprzedni lub własny okres)
- **Zabezpieczenie przed duplikatami** - system sprawdza czy miesiąc o danym okresie już istnieje
- **Przycisk "Utwórz nowy"** w topbarze aktualnego miesiąca - szybki dostęp do tworzenia następnego okresu
- **Opcja własnego okresu** - możliwość ręcznego określenia dat i nazwy miesiąca z kalendarzem
- Nie można wrócić do kroku wyboru miesiąca po załadowaniu danych (zapobiega pomyłkom)

#### Ulepszenia formularzy
- **Opcja "do kiedy"** w formularzu wydatków stałych - możliwość ustawienia daty końcowej wystąpienia wydatku
- **Checkbox "Wydatek bez daty końcowej"** - jasne oznaczenie wydatków bez końca
- Formularze dat na stronie Długi używają kalendarza (type="date") zamiast ręcznego wprowadzania

#### Funkcje edycji
- **Funkcja modyfikacji w Kroku 2** tworzenia miesiąca - przycisk "Modyfikuj" prawidłowo edytuje wydatek
- **Opcja modyfikacji długu** na stronie Długi - możliwość edycji wszystkich danych istniejącego długu

#### Interfejs użytkownika
- **Tryb pełnoekranowy** - aplikacja uruchamia się automatycznie w trybie fullscreen
- **Ukryty pasek menu** - pasek menu (File, Edit, View, Window, Help) jest domyślnie ukryty, można go przywołać klawiszem Alt
- **Przycisk "- Wydatek"** zmniejszony o 10% (lepsze proporcje interfejsu)

### 🔧 Naprawione błędy

#### Problemy z datami i okresami
- **Błąd obliczania dat okresów** - naprawiono algorytm obliczania dat końcowych okresów rozliczeniowych
  - Problem: używano mutacji Date (setMonth/setDate) co powodowało nieprzewidywalne rezultaty
  - Rozwiązanie: zmieniono na konstrukcję nowych obiektów Date(year, month, day)
- **Nieprawidłowe nazwy miesięcy** - system teraz poprawnie rozpoznaje bieżący miesiąc
  - Przykład: 7 grudnia z billing_day=10 pokazuje "grudzień 2025" zamiast "listopad 2025"
  - Naprawiono wyświetlanie nazw w Kroku 0 i Kroku 1 tworzenia miesiąca
- **Opóźnienie przy przełączaniu na "Własny okres"** - zoptymalizowano obsługę zmiany opcji (usunięto zbędne wywołania format())

#### Problemy z wyświetlaniem
- **Wyświetlanie "PLN0" zamiast "PLN"** - naprawiono błąd w warunkach JSX
  - Problem: `{value && value > 0 && (...)}` renderowało 0 jako tekst
  - Rozwiązanie: zmieniono na `{value !== undefined && value > 0 && (...)}`

#### Problemy z logiką biznesową
- **Przycisk "Modyfikuj" w Kroku 2** działał jak "Usuń" - naprawiono logikę edycji wydatków
- **Predefiniowany podział wydatków na 3 kolumny** nie działał przy tworzeniu miesiąca
  - Problem: ignorowano `column_number` z katalogu wydatków
  - Rozwiązanie: wydatki używają `column_number` z katalogu jako priorytet, kategoria jako fallback
- **Wydatki z poprzedniego miesiąca** nie zachowywały informacji o kolumnach - teraz są poprawnie przenoszone

### 🗑️ Usunięte funkcje

- **Pole procentowe oszczędności** z ustawień - było nieużywane i mylące
- **Opcja "Co rok"** z formularza wydatków - pozostawiono tylko "Co miesiąc" i "Inne..." z wyborem miesięcy

### 📝 Zmiany w działaniu aplikacji

#### Tworzenie miesiąca
- Proces rozpoczyna się od wyboru okresu (nowy Krok 0)
- Wydatki ładowane z poprzedniego miesiąca zachowują informację o przypisaniu do kolumn
- Wydatki z katalogu używają zdefiniowanego `column_number`
- Wydatki bez przypisanej kolumny są automatycznie przypisywane na podstawie kategorii z ustawień

#### Logika wyboru miesiąca
System sprawdza dzień rozliczeniowy z ustawień i na podstawie dzisiejszej daty określa okresy:

**Przykład z billing_day=10:**
- **7 grudnia** → bieżący: "grudzień 2025" (okres: 10.11 - 09.12)
- **12 grudnia** → bieżący: "grudzień 2025" (okres: 10.12 - 09.01)

Funkcje:
- Pozwala utworzyć poprzedni miesiąc jeśli nie istnieje
- Pozwala utworzyć bieżący miesiąc jeśli nie istnieje  
- Blokuje tworzenie już istniejących miesięcy
- Umożliwia utworzenie własnego okresu z dowolnymi datami

### 💡 Zmiany techniczne

- Zmieniono warunki w JSX z `{value && value > 0 && (...)}` na `{value !== undefined && value > 0 && (...)}`
- Dodano `fullscreen: true` i `autoHideMenuBar: true` w konfiguracji BrowserWindow (Electron)
- Priorytet pobierania `column_number`: katalog/poprzedni miesiąc → obliczenie z kategorii (fallback)
- Algorytm dat: używa `new Date(year, month, day)` zamiast mutacji `setMonth()`/`setDate()`
- Optymalizacja: cache nazw miesięcy zamiast wielokrotnego formatowania

### 📦 Informacje o wydaniu

- **Wersja**: 1.2.0
- **Data wydania**: 7 grudnia 2025
- **Wielkość instalatora**: ~91 MB
- **Kompatybilność**: Windows 10/11 (64-bit)

### 📥 Instalacja

#### Nowi użytkownicy:
1. Pobierz `SiaSiek Budget Setup 1.2.0.exe`
2. Uruchom instalator
3. Postępuj zgodnie z instrukcjami na ekranie

#### Aktualizacja z wersji 1.0.0:
- **Automatycznie**: Aplikacja wykryje nową wersję przy uruchomieniu
- **Ręcznie**: Pobierz instalator i zainstaluj (dane nie zostaną utracone)

### ⚠️ Ważne informacje dla użytkowników

- **Wszystkie dane pozostaną nienaruszone** po aktualizacji
- **Nowe funkcje dostępne natychmiast** po aktualizacji
- **Usuniętych pól nie trzeba już wypełniać** (procent oszczędności)
- **Przy tworzeniu nowego miesiąca** najpierw wybierz okres w Kroku 0

### 🐛 Znane problemy

Brak znanych problemów w tej wersji. Jeśli napotkasz problem:
1. Sprawdź [Issues na GitHub](https://github.com/lukaszbeben81/SiaSiekBudget/issues)
2. Zgłoś nowy problem z dokładnym opisem

### 🔄 Co dalej?

W następnych wersjach planowane są:
- Więcej opcji personalizacji interfejsu
- Rozszerzone raporty i analizy
- Eksport danych do różnych formatów
- Ulepszone wykresy i wizualizacje

### 📝 Pełna dokumentacja

- [CHANGELOG.md](https://github.com/lukaszbeben81/SiaSiekBudget/blob/main/CHANGELOG.md) - szczegółowy dziennik zmian
- [README.md](https://github.com/lukaszbeben81/SiaSiekBudget/blob/main/README.md) - kompletna dokumentacja projektu

---

**Podziękowania**: Dziękujemy za używanie SiaSiek Budget! Twój feedback jest dla nas cenny.

**Wsparcie**: [GitHub Issues](https://github.com/lukaszbeben81/SiaSiekBudget/issues)

**Autor**: SiaSiek  
**Licencja**: MIT
