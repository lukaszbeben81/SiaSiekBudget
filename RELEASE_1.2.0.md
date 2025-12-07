# Instrukcja wydania wersji 1.2.0

## 📦 Kroki przygotowania release

### 1. Build aplikacji

```powershell
# Przejdź do folderu projektu
cd "D:\Projekty visual studio\Budget domowy\SiaSiekBudget"

# Zainstaluj zależności (jeśli jeszcze nie)
npm install

# Zbuduj aplikację React
npm run build

# Zbuduj instalator Electron
npm run build:electron
```

Po wykonaniu powyższych kroków, w folderze `release/` znajdziesz:
- `SiaSiek Budget Setup 1.2.0.exe` - instalator dla Windows
- `SiaSiek Budget Setup 1.2.0.exe.blockmap` - plik dla auto-update
- `latest.yml` - plik konfiguracyjny dla auto-update

### 2. Weryfikacja przed publikacją

**Sprawdź czy wszystkie zmiany są zapisane:**
- ✅ `package.json` - wersja 1.2.0
- ✅ `electron/main.js` - APP_VERSION = '1.2.0'
- ✅ `CHANGELOG.md` - sekcja [1.2.0] z listą zmian
- ✅ Wszystkie pliki kodu źródłowego zapisane

**Przetestuj instalator:**
1. Zainstaluj aplikację z `release/SiaSiek Budget Setup 1.2.0.exe`
2. Sprawdź czy:
   - Aplikacja uruchamia się w trybie fullscreen ✅
   - Pasek menu jest ukryty (Alt aby pokazać) ✅
   - Przycisk "- Wydatek" jest mniejszy ✅
   - Nie ma "PLN0" tylko "PLN" ✅
   - Nazwy miesięcy są poprawne ✅
   - Kolumny wydatków z katalogu są zachowane ✅

### 3. Publikacja na GitHub

#### A. Przygotowanie repozytorium (jeśli pierwszy raz)

```powershell
# Inicjalizacja Git (jeśli nie zrobione)
git init
git add .
git commit -m "Release v1.2.0"

# Dodaj remote (zamień na swoje repo)
git remote add origin https://github.com/lukaszbeben81/SiaSiekBudget.git
git branch -M main
git push -u origin main
```

#### B. Commit i push zmian

```powershell
# Dodaj wszystkie zmiany
git add .

# Commit z opisem wersji
git commit -m "Release v1.2.0

- Dodano tryb fullscreen przy uruchomieniu
- Ukryto pasek menu (File, Edit, View, Window, Help)
- Zmniejszono przycisk - Wydatek o 10%
- Naprawiono wyświetlanie PLN0 -> PLN
- Naprawiono nazwy miesięcy w tworzeniu miesiąca
- Naprawiono pobieranie kolumn z katalogu wydatków"

# Push do GitHub
git push origin main
```

#### C. Utworzenie Release na GitHub

1. Przejdź do https://github.com/lukaszbeben81/SiaSiekBudget
2. Kliknij **"Releases"** w prawym menu
3. Kliknij **"Create a new release"** (lub "Draft a new release")
4. Wypełnij formularz:

**Tag version:** `v1.2.0`
**Release title:** `SiaSiek Budget v1.2.0`
**Description:**
```markdown
## 🎉 SiaSiek Budget v1.2.0

### ✨ Nowe funkcje
- **Tryb pełnoekranowy** - aplikacja uruchamia się automatycznie w trybie fullscreen
- **Ukryty pasek menu** - pasek menu można przywołać klawiszem Alt

### 🔧 Naprawione błędy
- Naprawiono wyświetlanie "PLN0" zamiast "PLN"
- Naprawiono nazwy miesięcy w procesie tworzenia (np. grudzień zamiast listopad)
- Naprawiono pobieranie ustawień kolumn z katalogu wydatków

### 🎨 Zmiany interfejsu
- Przycisk "- Wydatek" zmniejszony o 10%

### 📥 Instalacja

**Nowi użytkownicy:**
1. Pobierz `SiaSiek.Budget.Setup.1.2.0.exe`
2. Uruchom instalator
3. Postępuj zgodnie z instrukcjami

**Aktualizacja z wersji 1.0.0/1.1.0:**
- Aplikacja automatycznie wykryje nową wersję przy uruchomieniu
- Możesz też pobrać instalator ręcznie i zainstalować (dane nie zostaną utracone)

### ⚠️ Wymagania systemowe
- Windows 10/11 (64-bit)
- ~200 MB wolnego miejsca na dysku

### 📝 Pełny changelog
Zobacz [CHANGELOG.md](https://github.com/lukaszbeben81/SiaSiekBudget/blob/main/CHANGELOG.md)
```

5. **Dodaj pliki** (Attach binaries):
   - Przeciągnij `release/SiaSiek Budget Setup 1.2.0.exe`
   - Przeciągnij `release/latest.yml`
   - Przeciągnij `release/SiaSiek Budget Setup 1.2.0.exe.blockmap`

6. Zaznacz **"Set as the latest release"**
7. Kliknij **"Publish release"**

### 4. Auto-Update Configuration

Aplikacja automatycznie sprawdza aktualizacje przy uruchomieniu. Aby to działało:

1. **Upewnij się że `latest.yml` jest w release:**
   - Plik ten zawiera informacje o najnowszej wersji
   - electron-updater go automatycznie sprawdza

2. **Struktura `latest.yml`:**
```yaml
version: 1.2.0
files:
  - url: SiaSiek.Budget.Setup.1.2.0.exe
    sha512: [hash]
    size: [rozmiar]
path: SiaSiek.Budget.Setup.1.2.0.exe
sha512: [hash]
releaseDate: '2025-12-07T...'
```

3. **Weryfikacja auto-update:**
   - Użytkownik z wersją 1.0.0 lub 1.1.0 uruchamia aplikację
   - Aplikacja sprawdza GitHub releases
   - Jeśli znajdzie 1.2.0, pokaże powiadomienie
   - Użytkownik może pobrać i zainstalować

### 5. Po publikacji

**Poinformuj użytkowników:**
- Napisz post na social media
- Wyślij emaile (jeśli masz listę użytkowników)
- Zaktualizuj dokumentację na stronie

**Monitoruj:**
- Liczba pobrań w GitHub Releases
- Zgłoszenia błędów (Issues)
- Feedback od użytkowników

## 🔍 Checklist przed publikacją

- [ ] Wszystkie zmiany są w CHANGELOG.md
- [ ] Wersja zaktualizowana w package.json i electron/main.js
- [ ] Kod zbudowany bez błędów (`npm run build`)
- [ ] Instalator zbudowany (`npm run build:electron`)
- [ ] Instalator przetestowany lokalnie
- [ ] Wszystkie nowe funkcje działają poprawnie
- [ ] Commit i push do GitHub
- [ ] Release utworzony na GitHub z plikami binarnymi
- [ ] latest.yml dołączony do release
- [ ] Release oznaczony jako "latest"

## 📞 Wsparcie

Jeśli użytkownicy mają problemy:
1. Sprawdź Issues na GitHub
2. Dodaj FAQ w README.md
3. Rozważ utworzenie Discussions na GitHub

## 🚀 Kolejne kroki

Po udanej publikacji 1.2.0:
1. Zacznij planować wersję 1.3.0
2. Zbieraj feedback od użytkowników
3. Rozważ dodanie telemetrii (za zgodą użytkowników)
4. Planuj nowe funkcje na podstawie zgłoszeń

---

**Autor:** SiaSiek  
**Data:** 2025-12-07  
**Wersja:** 1.2.0
