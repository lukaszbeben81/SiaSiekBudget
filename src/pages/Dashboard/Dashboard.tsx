import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Month } from '../../types';
import MonthView from '../MonthView/MonthView';
import Settings from '../Settings/Settings';
import Catalog from '../Catalog/Catalog';
import Charts from '../Charts/Charts';
import CreateMonth from '../CreateMonth/CreateMonth';
import HistoricalMonth from '../HistoricalMonth/HistoricalMonth';
import Archive from '../Archive/Archive';
import Debts from '../Debts/Debts';
import Piggybank from '../Piggybank/Piggybank';
import './Dashboard.css';

type ViewType = 'menu' | 'current' | 'previous' | 'archive' | 'archiveMonth' | 'charts' | 'catalog' | 'settings' | 'createMonth' | 'historicalMonth' | 'debts' | 'piggybank';

const Dashboard: React.FC = () => {
  const [view, setView] = useState<ViewType>('menu');
  const [months, setMonths] = useState<Month[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Month | null>(null);
  const [previousMonth, setPreviousMonth] = useState<Month | null>(null);
  const [selectedArchiveMonth, setSelectedArchiveMonth] = useState<Month | null>(null);
  const [isCurrentMonthMissing, setIsCurrentMonthMissing] = useState(false);
  const [hoverCurrentMonth, setHoverCurrentMonth] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [jokeModalOpen, setJokeModalOpen] = useState(false);
  const [joke, setJoke] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const { user, logout, isAdmin, appName } = useAuth();

  useEffect(() => {
    loadMonths();
    loadAppVersion();
  }, []);

  const loadAppVersion = async () => {
    try {
      const version = await window.electronAPI.getVersion();
      setAppVersion(version);
    } catch (error) {
      console.error('Error loading app version:', error);
    }
  };

  const loadMonths = async () => {
    try {
      const monthsData = await window.electronAPI.getMonths();
      const settings = await window.electronAPI.getSettings();
      const billingDay = settings.billing_day || 1;
      
      setDeveloperMode(settings.developer_mode === 1);
      setMonths(monthsData);

      // Calculate current billing period based on billing_day
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Determine which billing period we're in
      let periodStart: Date;
      
      if (today.getDate() >= billingDay) {
        // We're in the period that started this month
        periodStart = new Date(today.getFullYear(), today.getMonth(), billingDay);
      } else {
        // We're in the period that started last month
        periodStart = new Date(today.getFullYear(), today.getMonth() - 1, billingDay);
      }
      
      const periodStartStr = periodStart.toISOString().split('T')[0];

      // Find month that matches current billing period (by start_date)
      const current = monthsData.find(
        m => m.start_date === periodStartStr
      ) || monthsData.find(
        // Fallback: check if today falls within any month's range
        m => m.start_date <= todayStr && m.end_date >= todayStr
      );
      
      if (current) {
        // Check if month has any data (incomes or expenses)
        const [incomes, expenses] = await Promise.all([
          window.electronAPI.getIncomes(current.id),
          window.electronAPI.getExpenses(current.id)
        ]);
        
        const hasData = incomes.length > 0 || expenses.length > 0;
        
        if (hasData) {
          setCurrentMonth(current);
          setIsCurrentMonthMissing(false);
          
          // Find previous month - sort by start_date and get the one before current
          const sortedMonths = [...monthsData].sort((a, b) => 
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
          const currentIndex = sortedMonths.findIndex(m => m.id === current.id);
          const previous = currentIndex < sortedMonths.length - 1 ? sortedMonths[currentIndex + 1] : null;
          setPreviousMonth(previous);
        } else {
          // Month exists but has no data - delete it via cleanup and treat as missing
          await window.electronAPI.cleanupDatabase({ selectedMonths: [current.id] });
          const updatedMonths = monthsData.filter(m => m.id !== current.id);
          setMonths(updatedMonths);
          setCurrentMonth(null);
          setIsCurrentMonthMissing(true);
          // Previous is the most recent archived month
          if (updatedMonths.length > 0) {
            const sortedMonths = [...updatedMonths].sort((a, b) => 
              new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
            );
            setPreviousMonth(sortedMonths[0]);
          } else {
            setPreviousMonth(null);
          }
        }
      } else {
        setCurrentMonth(null);
        setIsCurrentMonthMissing(true);
        // If no current month, previous is the most recent one (sorted by start_date desc)
        if (monthsData.length > 0) {
          const sortedMonths = [...monthsData].sort((a, b) => 
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
          setPreviousMonth(sortedMonths[0]);
        } else {
          setPreviousMonth(null);
        }
      }
    } catch (error) {
      console.error('Error loading months:', error);
    }
  };

  const handleMonthSelect = (month: Month) => {
    setSelectedArchiveMonth(month);
    setView('archiveMonth');
  };

  const handleCreateMonth = () => {
    setView('createMonth');
  };

  const handleLogoClick = async () => {
    try {
      // Sprawdź tryb developera
      const settings = await window.electronAPI.getSettings();
      if (settings.developer_mode === 1) {
        setJoke('Nie masz neta lub masz tryb developera. Żartu nie będzie, a niech to jasna ch*lera!');
        setJokeModalOpen(true);
        return;
      }

      // Pobierz losowy suchar z API przez Electron (omija CORS)
      const result = await window.electronAPI.fetchJoke();
      
      if (result.success && result.joke) {
        setJoke(result.joke);
      } else {
        throw new Error(result.error || 'Brak żartu');
      }
      setJokeModalOpen(true);
    } catch (error) {
      console.error('Błąd pobierania żartu:', error);
      // Brak internetu lub błąd
      setJoke('Nie masz neta lub masz tryb developera. Żartu nie będzie, a niech to jasna ch*lera!');
      setJokeModalOpen(true);
    }
  };

  if (view === 'current') {
    return (
      <MonthView
        month={currentMonth}
        onBack={() => setView('menu')}
        onRefresh={loadMonths}
        onNavigateToDebts={() => setView('debts')}
        isAdmin={isAdmin}
      />
    );
  }

  if (view === 'archiveMonth') {
    return (
      <MonthView
        month={selectedArchiveMonth}
        onBack={() => {
          loadMonths();
          setView('archive');
        }}
        onRefresh={loadMonths}
        isArchive={true}
        isAdmin={isAdmin}
      />
    );
  }

  if (view === 'previous') {
    return (
      <MonthView
        month={previousMonth}
        onBack={() => setView('menu')}
        onRefresh={loadMonths}
        isArchive={true}
        isAdmin={isAdmin}
      />
    );
  }

  if (view === 'createMonth') {
    return (
      <CreateMonth
        onBack={() => setView('menu')}
        onMonthCreated={() => {
          loadMonths();
          setView('menu');
        }}
      />
    );
  }

  if (view === 'historicalMonth') {
    return (
      <HistoricalMonth
        onBack={() => setView('archive')}
        onMonthCreated={() => {
          loadMonths();
          setView('archive');
        }}
      />
    );
  }

  if (view === 'settings') {
    return <Settings onBack={() => {
      loadMonths();
      setView('menu');
    }} />;
  }

  if (view === 'catalog') {
    return <Catalog 
      onBack={() => {
        loadMonths();
        setView('menu');
      }} 
      isAdmin={isAdmin}
    />;
  }

  if (view === 'charts') {
    return <Charts onBack={() => {
      loadMonths();
      setView('menu');
    }} />;
  }

  if (view === 'debts') {
    return <Debts 
      onBack={() => {
        loadMonths();
        setView('menu');
      }} 
      isAdmin={isAdmin}
    />;
  }

  if (view === 'piggybank') {
    return <Piggybank 
      onBack={() => {
        loadMonths();
        setView('menu');
      }} 
      isAdmin={isAdmin}
    />;
  }

  if (view === 'archive') {
    return (
      <Archive
        onBack={() => {
          loadMonths();
          setView('menu');
        }}
        onSelectMonth={handleMonthSelect}
        onAddHistorical={() => setView('historicalMonth')}
        isAdmin={isAdmin}
      />);
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-brand">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="dashboard-logo" 
            onClick={handleLogoClick}
            title="Kliknij po losowego suchara!"
          />
          <h1>{appName}</h1>
        </div>
        <div className="user-info">
          <span className="text-secondary">
            {user?.username} ({user?.role})
          </span>
          <button 
            className="btn-info" 
            onClick={() => setInfoModalOpen(true)}
            title="Informacje o aplikacji"
          >
            ℹ️ Info
          </button>
          <button className="btn-secondary" onClick={logout}>
            Wyloguj
          </button>
        </div>
      </div>

      <div className="container">
        <div className="dashboard-menu">
          <button
            className="dashboard-card"
            onClick={() => {
              if (currentMonth) {
                setView('current');
              } else if (isAdmin) {
                handleCreateMonth();
              }
            }}
            onMouseEnter={() => setHoverCurrentMonth(true)}
            onMouseLeave={() => setHoverCurrentMonth(false)}
            disabled={!currentMonth && !isAdmin}
          >
            <div className="card-icon" style={{ color: 'var(--color-income)' }}>
              📅
            </div>
            <h2>Bieżący miesiąc</h2>
            {isCurrentMonthMissing && (
              <p className={hoverCurrentMonth ? 'text-success' : 'text-danger'}>
                {hoverCurrentMonth ? '✚ Utwórz nowy miesiąc' : 'Nie utworzono'}
              </p>
            )}
            {!isCurrentMonthMissing && currentMonth && (
              <p className="text-secondary">
                {currentMonth.name}
              </p>
            )}
          </button>

          <button
            className="dashboard-card"
            onClick={() => {
              if (previousMonth) {
                setView('previous');
              }
            }}
            disabled={!previousMonth}
          >
            <div className="card-icon" style={{ color: 'var(--color-savings)' }}>
              ⏮️
            </div>
            <h2>Poprzedni miesiąc</h2>
            <p className="text-secondary">
              {previousMonth ? previousMonth.name : 'Niedostępny'}
            </p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => setView('archive')}
            disabled={months.length === 0 && !developerMode}
          >
            <div className="card-icon" style={{ color: 'var(--color-bills)' }}>
              📦
            </div>
            <h2>Archiwum</h2>
            <p className="text-secondary">
              {months.length} {months.length === 1 ? 'miesiąc' : (months.length % 10 >= 2 && months.length % 10 <= 4 && (months.length < 10 || months.length > 20)) ? 'miesiące' : 'miesięcy'}
              {months.length === 0 && developerMode && ' (dev)'}
            </p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => setView('charts')}
          >
            <div className="card-icon" style={{ color: 'var(--color-debt)' }}>
              📊
            </div>
            <h2>Wykresy i statystyki</h2>
            <p className="text-secondary">Analizy finansowe</p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => setView('debts')}
          >
            <div className="card-icon" style={{ color: 'var(--color-expenses)' }}>
              💰
            </div>
            <h2>Długi</h2>
            <p className="text-secondary">Zarządzaj zobowiązaniami</p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => setView('piggybank')}
          >
            <div className="card-icon" style={{ color: 'var(--color-savings)' }}>
              🐷
            </div>
            <h2>Skarbonka</h2>
            <p className="text-secondary">Cele oszczędnościowe</p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => setView('catalog')}
          >
            <div className="card-icon" style={{ color: 'var(--color-savings)' }}>
              📋
            </div>
            <h2>Katalog wydatków i dochodów</h2>
            <p className="text-secondary">Zarządzaj kategoriami</p>
          </button>

          <button
            className="dashboard-card"
            onClick={() => setView('settings')}
          >
            <div className="card-icon" style={{ color: 'var(--text-secondary)' }}>
              ⚙️
            </div>
            <h2>Ustawienia</h2>
            <p className="text-secondary">Konfiguracja aplikacji</p>
          </button>
        </div>
      </div>

      {/* Modal z żartem */}
      {jokeModalOpen && (
        <div 
          className="joke-modal-overlay" 
          onClick={() => setJokeModalOpen(false)}
        >
          <div 
            className="joke-modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="joke-modal-close" 
              onClick={() => setJokeModalOpen(false)}
              aria-label="Zamknij"
            >
              ✕
            </button>
            <div className="joke-modal-emoji">😂</div>
            <div className="joke-modal-body">
              <p>{joke}</p>
            </div>
            <button 
              className="joke-modal-btn" 
              onClick={() => setJokeModalOpen(false)}
            >
              Super! 🎉
            </button>
          </div>
        </div>
      )}

      {/* Modal Info */}
      {infoModalOpen && (
        <div 
          className="info-modal-overlay" 
          onClick={() => setInfoModalOpen(false)}
        >
          <div 
            className="info-modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="info-modal-close" 
              onClick={() => setInfoModalOpen(false)}
              aria-label="Zamknij"
            >
              ✕
            </button>
            <div className="info-modal-header">
              <div className="info-logo-circle">
                <img src="/logo.png" alt="Logo" className="info-modal-logo" />
              </div>
              <h2>{appName}</h2>
              <span className="info-version">v{appVersion}</span>
            </div>
            <div className="info-modal-body">
              <div className="info-grid">
                <div className="info-section">
                  <h3>📱 O aplikacji</h3>
                  <p>Aplikacja do zarządzania budżetem domowym. Pozwala śledzić wydatki, dochody, oszczędności i planować finanse.</p>
                </div>
                <div className="info-section">
                  <h3>😈 Licencja</h3>
                  <p><strong>Całkowicie DARMOWA!</strong></p>
                  <p>Chulaj dusza, piekła nie ma! Używaj bez ograniczeń.</p>
                </div>
                <div className="info-section">
                  <h3>🔒 Prywatność</h3>
                  <p>Aplikacja <strong>nie wysyła żadnych danych do sieci</strong>. Wszystkie Twoje dane są przechowywane <strong>lokalnie na Twoim urządzeniu</strong>.</p>
                </div>
                <div className="info-section">
                  <h3>👨‍💻 Autor</h3>
                  <p><strong>Łukasz Bęben vel SiaSiek</strong></p>
                  <p>📧 lukaszbeben@o2.pl</p>
                </div>
              </div>
              <div className="info-section info-note">
                <p>📖 Pełna instrukcja obsługi dostępna jest w <strong>Ustawieniach</strong>.</p>
              </div>
            </div>
            <button 
              className="info-modal-btn" 
              onClick={() => setInfoModalOpen(false)}
            >
              Zamknij
            </button>
          </div>
        </div>
      )}

      {/* Footer quote */}
      <div className="dashboard-footer-quote">
        <span className="quote-short">"PINIONDZE TO NIE FSZYSKO..."</span>
        <span className="quote-full">"PINIONDZE TO NIE FSZYSKO, ALE FSZYSKO BEZ PINIENDZY TO CH*J!"</span>
      </div>
    </div>
  );
};

export default Dashboard;
