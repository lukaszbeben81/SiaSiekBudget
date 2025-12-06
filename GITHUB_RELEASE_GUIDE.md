# Instrukcja publikacji na GitHub

## Przygotowanie do publikacji

### ✅ Pliki gotowe do publikacji

1. **Instalator aplikacji**
   - Lokalizacja: `dist/siasiek-budget Setup 1.0.0.exe`
   - Rozmiar: ~85 MB
   - Gotowy do dystrybucji

2. **Dokumentacja**
   - `README.md` - Kompletna dokumentacja projektu
   - `LICENSE` - Licencja MIT
   - `.gitignore` - Gotowa konfiguracja dla Git

### 📋 Kroki publikacji na GitHub

#### 1. Inicjalizacja repozytorium Git (jeśli nie zrobione)

```powershell
cd "D:\Projekty visual studio\Budget domowy\SiaSiekBudget"
git init
git add .
git commit -m "Initial commit - SiaSiek Budget v1.0.0"
```

#### 2. Utworzenie repozytorium na GitHub

1. Zaloguj się na https://github.com
2. Kliknij "+" w prawym górnym rogu → "New repository"
3. Nazwa repozytorium: `SiaSiekBudget`
4. Opis: "Aplikacja desktopowa do zarządzania budżetem domowym"
5. Wybierz: **Public** (lub Private jeśli chcesz)
6. **NIE** zaznaczaj "Initialize with README" (już masz)
7. Kliknij "Create repository"

#### 3. Połączenie lokalnego repozytorium z GitHub

```powershell
# Zastąp [twoja-nazwa] swoją nazwą użytkownika GitHub
git remote add origin https://github.com/[twoja-nazwa]/SiaSiekBudget.git
git branch -M main
git push -u origin main
```

#### 4. Utworzenie Release z instalatorem

1. Na GitHub przejdź do zakładki "Releases"
2. Kliknij "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `SiaSiek Budget v1.0.0 - Pierwsze wydanie`
5. Opis release (przykład):

```markdown
## 🎉 Pierwsze wydanie SiaSiek Budget!

Aplikacja desktopowa do zarządzania budżetem domowym.

### ✨ Główne funkcje:
- 📊 Dashboard z wykresami wydatków
- 💰 Zarządzanie miesięcznymi budżetami
- 📚 Katalog stałych wydatków i przychodów
- 💳 System zarządzania długami
- 🐷 Skarbonka oszczędnościowa
- 📈 Archiwum z analizą historyczną
- 👥 Zarządzanie użytkownikami (admin/user)
- 🎨 Konfigurowalna nazwa aplikacji
- 🔐 System autoryzacji z rolami

### 📥 Instalacja:
1. Pobierz plik `siasiek-budget Setup 1.0.0.exe`
2. Uruchom instalator
3. Aplikacja zostanie zainstalowana automatycznie

### 💻 Wymagania systemowe:
- Windows 10/11
- ~100 MB wolnego miejsca na dysku

### 🐛 Znane problemy:
Brak

### 📝 Pełna dokumentacja:
Zobacz [README.md](../README.md)
```

6. Przeciągnij plik `dist/siasiek-budget Setup 1.0.0.exe` do sekcji "Attach binaries"
7. Kliknij "Publish release"

#### 5. Aktualizacja README.md z linkiem do releases

Po utworzeniu release, link w README.md automatycznie będzie działał:
```markdown
[Releases](../../releases)
```

### 🔄 Przyszłe aktualizacje

Przy kolejnych wersjach:

```powershell
# 1. Wprowadź zmiany w kodzie
# 2. Zaktualizuj wersję w package.json
# 3. Zbuduj nowy instalator
npm run build
npm run build:electron

# 4. Commit i push
git add .
git commit -m "Update to v1.1.0 - [opis zmian]"
git push origin main

# 5. Utwórz nowy release na GitHub z nowym instalatorem
```

### 📁 Pliki NIE publikowane (w .gitignore):

- `node_modules/` - zależności (powinny być instalowane lokalnie)
- `dist/` - pliki budowane (tylko instalator wrzucany do releases)
- `*.db` - bazy danych użytkowników
- `.vscode/` - ustawienia IDE

### ✅ Checklist przed publikacją:

- [x] Aplikacja działa poprawnie
- [x] Wszystkie funkcje przetestowane
- [x] README.md kompletny i aktualny
- [x] LICENSE dodana
- [x] .gitignore skonfigurowany
- [x] Instalator wygenerowany
- [ ] Repozytorium utworzone na GitHub
- [ ] Kod opublikowany
- [ ] Release utworzony z instalatorem

### 🎯 Opcjonalne ulepszenia:

1. **GitHub Actions** - automatyczne budowanie przy każdym push
2. **Issues Templates** - szablony zgłoszeń błędów
3. **Contributing.md** - zasady kontrybucji
4. **Badges** - w README (build status, version, downloads)
5. **Screenshots** - zrzuty ekranu aplikacji w README
6. **CHANGELOG.md** - szczegółowa historia zmian

### 📞 Wsparcie

Po publikacji użytkownicy mogą:
- Zgłaszać błędy przez GitHub Issues
- Proponować funkcje przez GitHub Discussions
- Kontrybuować przez Pull Requests

---

**Gotowe! Aplikacja jest przygotowana do publikacji na GitHub! 🚀**
