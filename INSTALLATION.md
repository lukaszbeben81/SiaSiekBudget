# Instrukcja instalacji Node.js i uruchomienia aplikacji

## Krok 1: Instalacja Node.js

### Pobierz Node.js:
1. Przejdź do: https://nodejs.org/
2. Pobierz wersję **LTS** (Long Term Support) - aktualnie 20.x lub 18.x
3. Uruchom instalator i postępuj zgodnie z instrukcjami
4. **WAŻNE**: Zaznacz opcję "Add to PATH" podczas instalacji

### Weryfikacja instalacji:
Po instalacji otwórz PowerShell i sprawdź:
```powershell
node --version
npm --version
```

Powinny wyświetlić się numery wersji (np. v20.10.0 i 10.2.3).

## Krok 2: Instalacja zależności projektu

```powershell
# Przejdź do folderu projektu
cd "d:\Projekty visual studio\Budget domowy\SiaSiekBudget"

# Zainstaluj wszystkie zależności
npm install
```

**Uwaga**: Instalacja może potrwać 3-5 minut. Pakiety będą pobierane z internetu.

### Jeśli wystąpią błędy podczas kompilacji better-sqlite3:

Windows wymaga narzędzi kompilacji:

```powershell
# Zainstaluj narzędzia kompilacji Windows (wymaga uprawnień administratora)
npm install --global windows-build-tools

# Lub zainstaluj Visual Studio Build Tools ręcznie:
# https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
```

## Krok 3: Uruchomienie aplikacji

### Tryb deweloperski (development):
```powershell
npm start
```

To uruchomi:
- Serwer Vite na http://localhost:3000
- Aplikację Electron w osobnym oknie

### Pierwsze uruchomienie:
1. Aplikacja wykryje, że to pierwsze uruchomienie
2. Poprowadzi Cię przez kreator konfiguracji
3. Utwórz konto administratora (nazwa użytkownika + hasło)
4. Skonfiguruj podstawowe ustawienia budżetu
5. Gotowe! Możesz zacząć korzystać z aplikacji

## Krok 4: Budowanie wersji produkcyjnej

```powershell
# Build aplikacji React
npm run build

# Build aplikacji Electron do dystrybucji
npm run build:electron
```

Gotowa aplikacja będzie w folderze `out/` lub `dist/`.

## Rozwiązywanie problemów

### Problem: "npm: The term 'npm' is not recognized"
**Rozwiązanie**: Node.js nie jest zainstalowany lub nie został dodany do PATH. Zainstaluj Node.js ponownie.

### Problem: Błąd kompilacji better-sqlite3
**Rozwiązanie**: Zainstaluj Windows Build Tools:
```powershell
npm install --global windows-build-tools
```

### Problem: Port 3000 jest zajęty
**Rozwiązanie**: Zmień port w `vite.config.ts`:
```typescript
server: {
  port: 3001  // Zmień na inny port
}
```

### Problem: Aplikacja się nie uruchamia
**Rozwiązanie**: 
```powershell
# Usuń node_modules i zainstaluj ponownie
Remove-Item -Recurse -Force node_modules
npm install
```

### Problem: Błędy TypeScript
**Rozwiązanie**: Zainstaluj brakujące typy:
```powershell
npm install --save-dev @types/react @types/react-dom @types/node
```

## Następne kroki po instalacji

1. **Zaloguj się** - Po pierwszym uruchomieniu użyj utworzonego konta admina
2. **Utwórz pierwszy miesiąc** - Aplikacja pomoże Ci w konfiguracji
3. **Dodaj dochody** - Wprowadź swoje źródła dochodu
4. **Dodaj wydatki** - Zacznij śledzić swoje wydatki
5. **Przeglądaj statystyki** - Zobacz podsumowanie w TopBar

## Lokalizacja danych

Baza danych SQLite jest przechowywana w:
```
C:\Users\[TwojaNazwa]\AppData\Roaming\SiaSiekBudget\budget.db
```

## Dodatkowe zasoby

- Dokumentacja Electron: https://www.electronjs.org/docs
- Dokumentacja React: https://react.dev/
- Dokumentacja Vite: https://vitejs.dev/

## Wsparcie

W przypadku problemów:
1. Sprawdź logi w konsoli DevTools (F12)
2. Sprawdź logi w terminalu, gdzie uruchomiłeś aplikację
3. Zobacz sekcję "Rozwiązywanie problemów" w README.md
