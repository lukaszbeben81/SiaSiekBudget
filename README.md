# SiaSiek Budget

Aplikacja desktopowa do zarządzania budżetem domowym, stworzona z wykorzystaniem Electron, React i TypeScript.

## 📋 Opis

SiaSiek Budget to kompleksowa aplikacja do zarządzania finansami osobistymi, która pozwala na:
- Tworzenie i zarządzanie miesięcznymi budżetami
- Śledzenie stałych i jednorazowych wydatków oraz przychodów
- Zarządzanie długami i ich spłatami
- Prowadzenie skarbonki oszczędnościowej
- Generowanie wykresów i statystyk finansowych
- Tworzenie archiwalnych zestawień
- Zarządzanie wieloma użytkownikami z kontrolą dostępu (admin/użytkownik)

## ✨ Główne funkcje

### 📊 Dashboard
- Przegląd aktualnego miesiąca budżetowego
- Wykresy wydatków według kategorii
- Podsumowanie finansowe (przychody, wydatki, saldo)
- Cytaty motywacyjne

### 💰 Tworzenie miesięcy
- Kreator nowego miesiąca z automatycznym przenoszeniem danych
- Definicja stałych wydatków i przychodów
- Ustawienie skarbonki i codziennych wydatków
- Konfiguracja dnia rozliczeniowego

### 📁 Widok miesiąca
- Szczegółowy przegląd wybranego miesiąca
- Dodawanie jednorazowych wydatków/przychodów
- Edycja istniejących pozycji
- Podział wydatków według kategorii (3 kolumny konfigurowane w ustawieniach)

### 📚 Katalog
- Zarządzanie stałymi wydatkami i przychodami
- Kategorie chronione (nie można ich usunąć): Żywność, Spłata długu, Mieszkanie, Skarbonka, Rata
- Import podczas tworzenia nowego miesiąca

### 💳 Długi
- Rejestracja długów
- Śledzenie spłat
- Historia wpłat dla każdego długu

### 🐷 Skarbonka
- Tworzenie celów oszczędnościowych
- Wpłaty do skarbonki
- Historia transakcji

### 📈 Archiwum
- Generowanie zestawień historycznych
- Porównywanie okresów
- Analiza trendów finansowych

### ⚙️ Ustawienia
- Konfiguracja nazwy aplikacji (maksymalnie 30 znaków)
- Ustawienia dnia rozliczeniowego
- Procentowa wartość oszczędności
- Tygodniowy budżet na żywność
- Dzienne wydatki
- Personalizacja nazw i kategorii w kolumnach wydatków
- Zarządzanie użytkownikami (max 5 użytkowników)
- Tryb deweloperski


## 🚀 Instalacja

### Instalator Windows
1. Pobierz plik `SiaSiek Budget Setup 1.0.0.exe` z sekcji [Releases](../../releases)
2. Uruchom instalator
3. **Ostrzeżenie Windows Defender SmartScreen:**
   - Jeśli pojawi się komunikat "System Windows ochronił ten komputer"
   - Kliknij **"Więcej informacji"** → **"Uruchom mimo to"**
   - To normalne dla nowych aplikacji bez certyfikatu Microsoft (koszt ~$300/rok)
   - Aplikacja jest bezpieczna - możesz zweryfikować kod źródłowy na GitHubie
4. Aplikacja zostanie zainstalowana i automatycznie uruchomiona

### Budowanie ze źródeł

#### Wymagania
- Node.js (wersja 16 lub nowsza)
- npm

#### Kroki instalacji
```bash
# Klonowanie repozytorium
git clone https://github.com/[twoja-nazwa]/SiaSiekBudget.git
cd SiaSiekBudget

# Instalacja zależności
npm install

# Uruchomienie w trybie deweloperskim
npm start

# Budowanie aplikacji React
npm run build

# Budowanie instalatora Windows
npm run build:electron
```

## 🔐 Zarządzanie użytkownikami

Aplikacja wspiera dwa rodzaje użytkowników:
- **Administrator** - pełny dostęp do wszystkich funkcji (dodawanie, edycja, usuwanie)
- **Użytkownik** - tryb tylko do odczytu (przeglądanie danych bez możliwości ich modyfikacji)

Podczas pierwszego uruchomienia tworzony jest użytkownik administratora z domyślnym hasłem "admin".

## 📁 Struktura projektu

```
SiaSiekBudget/
├── electron/           # Kod Electron (główny proces)
│   ├── main.js        # Główny plik Electron
│   └── database.js    # Warstwa bazy danych (lowdb)
├── src/               # Kod React (proces renderowania)
│   ├── components/    # Komponenty React
│   ├── contexts/      # React Context API
│   ├── pages/         # Strony aplikacji
│   ├── types/         # Definicje TypeScript
│   └── assets/        # Zasoby statyczne
├── dist/              # Zbudowana aplikacja i instalator
└── package.json       # Zależności i skrypty
```

## 🛠️ Technologie

- **Frontend**: React 18, TypeScript, React Router
- **Backend**: Electron 28
- **Baza danych**: lowdb (JSON-based)
- **Wykresy**: Chart.js + react-chartjs-2
- **Build**: Vite, electron-builder
- **Styling**: CSS Modules

## 📝 Licencja

MIT License

## 👤 Autor

**SiaSiek**

## 🤝 Wkład w projekt

Chcesz pomóc w rozwoju projektu? Pull requesty są mile widziane!

1. Forkuj projekt
2. Utwórz branch z funkcjonalnością (`git checkout -b feature/AmazingFeature`)
3. Commituj zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 🐛 Zgłaszanie błędów

Jeśli znalazłeś błąd, otwórz [Issue](../../issues) z dokładnym opisem problemu.

## 🔄 Historia zmian

### Wersja 1.0.0 (2025-12-06)
- Pierwsze wydanie publiczne
- Pełna funkcjonalność zarządzania budżetem
- Zarządzanie użytkownikami (admin/user)
- Konfigurowalna nazwa aplikacji
- Optymalizacja wydajności formularzy
- Tryb tylko do odczytu dla użytkowników bez uprawnień administratora

4. Zaktualizuj typy w `src/types/index.ts`
5. Użyj w komponentach React przez `window.electronAPI`

## Licencja

MIT

## Autor

SiaSiek Team
