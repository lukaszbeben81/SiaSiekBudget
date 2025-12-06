# Changelog

Wszystkie istotne zmiany w projekcie SiaSiek Budget będą dokumentowane w tym pliku.

Format bazuje na [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
a projekt używa [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
