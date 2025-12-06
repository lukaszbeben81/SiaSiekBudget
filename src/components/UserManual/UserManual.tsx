import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserManual.css';

interface UserManualProps {
  onClose: () => void;
}

const UserManual: React.FC<UserManualProps> = ({ onClose }) => {
  const { appName } = useAuth();
  
  return (
    <div className="manual-overlay" onClick={onClose}>
      <div className="manual-content" onClick={(e) => e.stopPropagation()}>
        <button className="manual-close" onClick={onClose} aria-label="Zamknij">
          ✕
        </button>
        
        <div className="manual-header">
          <h1>📖 Instrukcja obsługi</h1>
          <p className="manual-subtitle">{appName} - Twój domowy budżet pod kontrolą</p>
        </div>

        <div className="manual-body">
          {/* Sekcja 1: Wprowadzenie */}
          <section className="manual-section">
            <h2>🎯 Wprowadzenie</h2>
            <p>
              {appName} to aplikacja do zarządzania budżetem domowym. 
              Pozwala śledzić wydatki, dochody, planować oszczędności i analizować finanse.
            </p>
          </section>

          {/* Sekcja 2: Pierwsze kroki */}
          <section className="manual-section">
            <h2>🚀 Pierwsze kroki</h2>
            <ol>
              <li><strong>Utwórz konto</strong> - przy pierwszym uruchomieniu utwórz konto administratora</li>
              <li><strong>Zaloguj się</strong> - użyj utworzonych danych logowania</li>
              <li><strong>Utwórz miesiąc</strong> - kliknij "Bieżący miesiąc" i utwórz nowy okres rozliczeniowy</li>
              <li><strong>Dodaj dochody i wydatki</strong> - wprowadź swoje transakcje</li>
            </ol>
          </section>

          {/* Sekcja 3: Bieżący miesiąc */}
          <section className="manual-section">
            <h2>📅 Bieżący miesiąc</h2>
            <p>Główny widok zarządzania finansami bieżącego okresu rozliczeniowego.</p>
            <ul>
              <li><strong>Dochody</strong> - lista wszystkich przychodów (wynagrodzenie, premie, inne)</li>
              <li><strong>Wydatki</strong> - wszystkie wydatki podzielone na kategorie</li>
              <li><strong>Podsumowanie</strong> - saldo, oszczędności, statystyki</li>
              <li><strong>Stałe wydatki/dochody</strong> - automatycznie dodawane co miesiąc</li>
            </ul>
          </section>

          {/* Sekcja 4: Kategorie wydatków */}
          <section className="manual-section">
            <h2>📂 Kategorie wydatków</h2>
            <p>Wydatki są automatycznie grupowane w kolumny według kategorii:</p>
            <ul>
              <li><strong>Kolumna 1</strong> - Mieszkanie, Media, Subskrypcje</li>
              <li><strong>Kolumna 2</strong> - Transport, Żywność</li>
              <li><strong>Kolumna 3</strong> - Rozrywka, Zdrowie, Inne</li>
            </ul>
            <p>Konfigurację kolumn można zmienić w Ustawieniach.</p>
          </section>

          {/* Sekcja 5: Skarbonki */}
          <section className="manual-section">
            <h2>🐷 Skarbonki</h2>
            <p>Funkcja oszczędzania na konkretne cele:</p>
            <ul>
              <li>Utwórz skarbonkę z nazwą i celem oszczędnościowym</li>
              <li>Regularnie wpłacaj środki</li>
              <li>Śledź postęp w osiąganiu celu</li>
              <li>Po osiągnięciu celu - świętuj! 🎉</li>
            </ul>
          </section>

          {/* Sekcja 6: Długi */}
          <section className="manual-section">
            <h2>💳 Długi</h2>
            <p>Zarządzaj zobowiązaniami finansowymi:</p>
            <ul>
              <li>Dodaj dług z kwotą i opisem</li>
              <li>Śledź postęp spłaty</li>
              <li>Rejestruj częściowe wpłaty</li>
              <li>Dług znika po pełnej spłacie</li>
            </ul>
          </section>

          {/* Sekcja 7: Archiwum */}
          <section className="manual-section">
            <h2>📦 Archiwum</h2>
            <p>Przeglądaj historyczne miesiące:</p>
            <ul>
              <li>Wszystkie zamknięte miesiące są archiwizowane</li>
              <li>Możesz przeglądać szczegóły każdego miesiąca</li>
              <li>Dane są tylko do odczytu</li>
              <li>Idealne do analizy trendów</li>
            </ul>
          </section>

          {/* Sekcja 8: Wykresy i statystyki */}
          <section className="manual-section">
            <h2>📊 Wykresy i statystyki</h2>
            <p>Analizuj swoje finanse wizualnie:</p>
            <ul>
              <li><strong>Wykres kołowy</strong> - podział wydatków według kategorii</li>
              <li><strong>Wykres słupkowy</strong> - porównanie miesięcy</li>
              <li><strong>Trend</strong> - jak zmieniają się Twoje finanse w czasie</li>
              <li><strong>Podsumowanie</strong> - kluczowe wskaźniki finansowe</li>
            </ul>
          </section>

          {/* Sekcja 9: Katalog */}
          <section className="manual-section">
            <h2>📋 Katalog wydatków i dochodów</h2>
            <p>Zarządzaj stałymi elementami:</p>
            <ul>
              <li><strong>Stałe wydatki</strong> - czynsz, rachunki, subskrypcje</li>
              <li><strong>Stałe dochody</strong> - wynagrodzenie, renty, inne</li>
              <li><strong>Zaplanowane wydatki</strong> - przyszłe zakupy i płatności</li>
              <li>Stałe elementy są automatycznie dodawane przy tworzeniu nowego miesiąca</li>
            </ul>
          </section>

          {/* Sekcja 10: Backup i przywracanie */}
          <section className="manual-section">
            <h2>💾 Backup i przywracanie</h2>
            <p>Zabezpiecz swoje dane:</p>
            <ul>
              <li><strong>Utwórz kopię zapasową</strong> - eksportuj wszystkie dane do pliku JSON</li>
              <li><strong>Przywróć kopię</strong> - zaimportuj dane z pliku backup</li>
              <li>Zalecamy regularne tworzenie kopii zapasowych</li>
              <li>Przechowuj kopie w bezpiecznym miejscu (np. chmura, pendrive)</li>
            </ul>
          </section>

          {/* Sekcja 11: Ustawienia */}
          <section className="manual-section">
            <h2>⚙️ Ustawienia</h2>
            <ul>
              <li><strong>Dzień rozliczenia</strong> - kiedy zaczyna się Twój miesiąc budżetowy</li>
              <li><strong>Procent oszczędności</strong> - ile odkładać z każdego dochodu</li>
              <li><strong>Limit tygodniowy na zakupy</strong> - kontroluj wydatki spożywcze</li>
              <li><strong>Limit dzienny</strong> - pilnuj codziennych wydatków</li>
              <li><strong>Konfiguracja kolumn</strong> - dostosuj wyświetlanie kategorii</li>
              <li><strong>Użytkownicy</strong> - zarządzaj kontami (tylko admin)</li>
            </ul>
          </section>

          {/* Sekcja 12: Skróty i porady */}
          <section className="manual-section">
            <h2>💡 Porady</h2>
            <ul>
              <li>🎯 Kliknij logo SiaSiek aby usłyszeć losowego suchara!</li>
              <li>📅 Ustaw dzień rozliczenia na dzień otrzymania wypłaty</li>
              <li>🐷 Utwórz skarbonkę na fundusz awaryjny (3-6 miesięcy wydatków)</li>
              <li>📊 Regularnie przeglądaj wykresy - znajdziesz obszary do optymalizacji</li>
              <li>💾 Rób backup co tydzień lub po większych zmianach</li>
              <li>📱 Dodawaj wydatki od razu - nie odkładaj na później!</li>
            </ul>
          </section>

          {/* Sekcja 13: Wsparcie */}
          <section className="manual-section">
            <h2>📞 Wsparcie</h2>
            <p>Masz pytania lub problemy?</p>
            <ul>
              <li>📧 Email: <strong>lukaszbeben@o2.pl</strong></li>
              <li>🐙 GitHub: <strong>github.com/SiaSiek/SiaSiekBudget</strong></li>
            </ul>
          </section>
        </div>

        <div className="manual-footer">
          <button className="manual-close-btn" onClick={onClose}>
            Zamknij instrukcję
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManual;
