# Funkcja: Konfigurowalna Nazwa Aplikacji

## 📋 Opis zmian
Dodano możliwość zmiany nazwy aplikacji "SiaSiek Budget" przez administratora w ustawieniach. Nazwa może mieć maksymalnie 30 znaków (15 × 2 z oryginalnej długości).

## ✨ Funkcjonalność
- **Domyślna nazwa**: "SiaSiek Budget" (bez konieczności konfiguracji)
- **Możliwość zmiany**: Tylko administrator może zmienić nazwę
- **Limit znaków**: Maksymalnie 30 znaków
- **Miejsce zmiany**: Ustawienia → Sekcja "🔒 Zabezpieczenia" → Pole "🏷️ Nazwa aplikacji"
- **Wyświetlanie**: Nazwa pojawia się w:
  - Ekranie logowania
  - Pierwszym uruchomieniu aplikacji
  - Nagłówku dashboardu (główne menu)
  - Oknie informacyjnym (modal Info)
  - Instrukcji użytkownika

## 🔧 Zmiany techniczne

### 1. **Baza danych** (`electron/database.js`)
- Dodano pole `app_name` do tabeli `settings` z wartością domyślną "SiaSiek Budget"
- Dodano migrację automatycznie dodającą pole dla istniejących baz danych

### 2. **TypeScript Types** (`src/types/index.ts`)
- Rozszerzono interfejs `Settings` o opcjonalne pole `app_name?: string`

### 3. **AuthContext** (`src/contexts/AuthContext.tsx`)
- Dodano `appName: string` do stanu kontekstu
- Dodano `refreshAppName()` - funkcję do odświeżenia nazwy po zapisie ustawień
- Nazwa ładowana automatycznie przy starcie aplikacji

### 4. **Settings Component** (`src/pages/Settings/Settings.tsx`)
- Dodano pole tekstowe do zmiany nazwy aplikacji (widoczne tylko dla admina)
- Walidacja: maksymalnie 30 znaków
- Licznik znaków pokazujący wykorzystanie (np. "15/30 znaków")
- Automatyczne wywołanie `refreshAppName()` po zapisie ustawień

### 5. **Komponenty UI** (zaktualizowane do użycia dynamicznej nazwy)
- `FirstRun.tsx` - ekran pierwszego uruchomienia
- `Login.tsx` - ekran logowania
- `Dashboard.tsx` - główny nagłówek i modal Info
- `UserManual.tsx` - instrukcja użytkownika

## 📸 Gdzie znajdę to w aplikacji?

### Zmiana nazwy (tylko Admin):
1. Zaloguj się jako administrator
2. Wejdź w **Ustawienia** (⚙️)
3. W sekcji **🔒 Zabezpieczenia** znajdziesz pole:
   ```
   🏷️ Nazwa aplikacji (max 30 znaków):
   [SiaSiek Budget           ]
   15/30 znaków
   ```
4. Wpisz nową nazwę (max 30 znaków)
5. Kliknij **💾 Zapisz ustawienia**
6. Nazwa zostanie natychmiast zaktualizowana w całej aplikacji

### Gdzie wyświetla się nazwa:
- **Ekran logowania** - wielki nagłówek na górze
- **Pierwszy start** - "Witaj w [Nazwa Aplikacji]"
- **Dashboard** - nagłówek obok logo
- **Info Modal** - tytuł w oknie informacyjnym
- **Instrukcja** - tytuł instrukcji użytkownika

## 🎯 Przykłady użycia
- Domyślnie: `SiaSiek Budget`
- Personalizacja: `Budget Rodziny Kowalskich`
- Firmowe: `Budżet Firmy XYZ 2025`
- Krótko: `Mój Budżet`

## ⚠️ Ważne uwagi
- Zmiana nazwy jest **globalna** - dotyczy wszystkich użytkowników
- Tylko **administrator** może zmienić nazwę
- Nazwa jest **zapisywana w bazie danych** i przetrwa restart aplikacji
- Maksymalna długość: **30 znaków** (automatycznie obcinane)

## 🔐 Bezpieczeństwo
- Pole widoczne i edytowalne **tylko dla administratora**
- Użytkownicy z rolą 'user' nie widzą tego pola
- Walidacja długości po stronie frontendu

## 🐛 Testowanie
Aby przetestować funkcjonalność:
1. Zaloguj się jako admin
2. Wejdź w Ustawienia
3. Zmień nazwę aplikacji
4. Zapisz ustawienia
5. Sprawdź czy nazwa zmieniła się w:
   - Nagłówku Dashboard
   - Oknie Info (kliknij przycisk Info w nagłówku)
6. Wyloguj się i sprawdź ekran logowania
7. Zrestartuj aplikację - nazwa powinna być zachowana

## 📝 Kod przykładowy

### Użycie w komponencie:
```typescript
import { useAuth } from '../../contexts/AuthContext';

const MyComponent = () => {
  const { appName } = useAuth();
  
  return (
    <h1>{appName}</h1>
  );
};
```

### Zmiana nazwy (Settings):
```typescript
const { refreshAppName } = useAuth();

// Po zapisie ustawień:
await window.electronAPI.updateSettings({
  ...settings,
  app_name: newAppName
});

// Odśwież nazwę w kontekście
await refreshAppName();
```

## ✅ Checklist implementacji
- [x] Dodanie pola `app_name` do bazy danych
- [x] Migracja dla istniejących baz
- [x] Rozszerzenie TypeScript types
- [x] Dodanie `appName` do AuthContext
- [x] Pole edycyjne w Settings (admin only)
- [x] Aktualizacja FirstRun component
- [x] Aktualizacja Login component
- [x] Aktualizacja Dashboard component
- [x] Aktualizacja UserManual component
- [x] Walidacja długości (max 30 znaków)
- [x] Automatyczne odświeżanie po zapisie
- [x] Testowanie działania

## 🚀 Wersja
Funkcjonalność dodana: **2025-12-06**
Wersja aplikacji: **1.0.0+**
