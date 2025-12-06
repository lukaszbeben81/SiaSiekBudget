import React, { useState, useEffect } from 'react';
import { Month, FixedExpense } from '../../types';
import { format, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { clearZeroOnFocus } from '../../utils/helpers';
import './Archive.css';

interface ArchiveProps {
  onBack: () => void;
  onSelectMonth: (month: Month) => void;
  onAddHistorical?: () => void;
  isAdmin?: boolean;
}

const Archive: React.FC<ArchiveProps> = ({ onBack, onSelectMonth, onAddHistorical, isAdmin = true }) => {
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [developerMode, setDeveloperMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [monthsToGenerate, setMonthsToGenerate] = useState('6');

  useEffect(() => {
    loadMonths();
    loadDeveloperMode();
  }, []);

  const loadDeveloperMode = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      setDeveloperMode(settings.developer_mode === 1);
    } catch (error) {
      console.error('Error loading developer mode:', error);
    }
  };

  const loadMonths = async () => {
    try {
      const data = await window.electronAPI.getMonths();
      setMonths(data);
    } catch (err) {
      console.error('Error loading months:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateHistoricalMonths = async () => {
    setShowGenerateModal(true);
  };

  const handleGenerateConfirm = async () => {
    const monthsCount = parseInt(monthsToGenerate);
    if (isNaN(monthsCount) || monthsCount <= 0 || monthsCount > 24) {
      alert('Podaj liczbę od 1 do 24');
      return;
    }

    setShowGenerateModal(false);
    setGenerating(true);

    try {
      // Load settings for billing_day
      const settings = await window.electronAPI.getSettings();
      const billingDay = settings.billing_day || 1;

      // Load existing categories
      const fixedExpenses = await window.electronAPI.getFixedExpenses();

      const expenseCategories = [...new Set(fixedExpenses.map((e: FixedExpense) => e.category).filter(Boolean))] as string[];

      // Default categories if none exist
      const defaultExpenseCategories = ['Mieszkanie', 'Media', 'Transport', 'Żywność', 'Rozrywka', 'Zdrowie'];

      const expenseCats = expenseCategories.length > 0 ? expenseCategories : defaultExpenseCategories;

      // Random expense names per category
      const expenseNamesByCategory: Record<string, string[]> = {
        'Mieszkanie': ['Czynsz', 'Wynajem', 'Ubezpieczenie mieszkania'],
        'Media': ['Prąd', 'Gaz', 'Internet', 'Telefon', 'Woda'],
        'Transport': ['Paliwo', 'Ubezpieczenie OC', 'Przegląd', 'Bilet miesięczny', 'Naprawa auta'],
        'Żywność': ['Zakupy spożywcze', 'Restauracja', 'Jedzenie na mieście'],
        'Rozrywka': ['Netflix', 'Spotify', 'Kino', 'Koncert', 'Gry'],
        'Zdrowie': ['Lekarz', 'Leki', 'Siłownia', 'Dentysta'],
        'Inne': ['Ubrania', 'Prezent', 'Fryzjer', 'Subskrypcje']
      };

      const incomeNames = ['Wypłata', 'Premia', 'Zlecenie', 'Zwrot podatku', 'Bonus', 'Freelance'];

      const now = new Date();

      for (let i = 1; i <= monthsCount; i++) {
        // Calculate billing period: billingDay of month X to billingDay-1 of month X+1
        // For month i periods ago:
        const periodMonth = subMonths(now, i);
        
        // If today is before billing day, we're in previous month's period
        // So "1 month ago" would actually be 2 calendar months back
        let adjustedMonth = periodMonth;
        if (now.getDate() < billingDay) {
          adjustedMonth = subMonths(periodMonth, 1);
        }
        
        // Start date: billingDay of that month
        const startDate = new Date(adjustedMonth.getFullYear(), adjustedMonth.getMonth(), billingDay);
        // End date: billingDay-1 of next month
        const endDate = new Date(adjustedMonth.getFullYear(), adjustedMonth.getMonth() + 1, billingDay - 1);

        // Month name based on start date (the main month of the period)
        const monthName = format(startDate, 'LLLL yyyy', { locale: pl });
        const capitalizedName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        // Create month
        const createdMonth = await window.electronAPI.createMonth({
          name: capitalizedName,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd')
        });

        // Generate 2-4 incomes
        const incomeCount = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < incomeCount; j++) {
          const name = incomeNames[Math.floor(Math.random() * incomeNames.length)];
          const amount = Math.floor(Math.random() * 8000) + 2000;

          await window.electronAPI.createIncome({
            month_id: createdMonth.id,
            name: name,
            amount: amount,
            is_recurring: Math.random() > 0.3 ? 1 : 0
          });
        }

        // Generate 5-12 expenses
        const expenseCount = Math.floor(Math.random() * 8) + 5;
        for (let j = 0; j < expenseCount; j++) {
          const category = expenseCats[Math.floor(Math.random() * expenseCats.length)];
          const categoryNames = expenseNamesByCategory[category] || ['Wydatek'];
          const name = categoryNames[Math.floor(Math.random() * categoryNames.length)];
          const totalAmount = Math.floor(Math.random() * 1500) + 50;
          // Historical months are fully paid
          const paidAmount = totalAmount;
          const isFixed = Math.random() > 0.3 ? 1 : 0;
          const columnNumber = Math.floor(Math.random() * 3) + 1;

          await window.electronAPI.createExpense({
            month_id: createdMonth.id,
            name: name,
            category: category,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            is_fixed: isFixed,
            column_number: columnNumber
          });
        }
      }

      await loadMonths();
      alert(`Wygenerowano ${monthsCount} miesięcy historycznych!`);
    } catch (error) {
      console.error('Error generating historical months:', error);
      alert('Błąd podczas generowania miesięcy');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="archive-container">
      <div className="archive-header">
        <button className="btn-secondary" onClick={onBack}>
          ← Powrót
        </button>
        <h1>Archiwum miesięcy</h1>
        <span className="months-count">({months.length} miesięcy)</span>
        
        {developerMode && isAdmin && (
          <button 
            className="btn-dev-generate"
            onClick={generateHistoricalMonths}
            disabled={generating}
            style={{
              marginLeft: 'auto',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: generating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: generating ? 0.7 : 1
            }}
          >
            🎲 {generating ? 'Generowanie...' : 'Generuj historię'}
          </button>
        )}
        {onAddHistorical && isAdmin && (
          <button 
            className="btn-add-historical"
            onClick={onAddHistorical}
            style={{
              backgroundColor: '#f97316',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📜 Dodaj dane historyczne
          </button>
        )}
      </div>

      <div className="archive-content">
        {months.length === 0 ? (
          <div className="empty-state">
            <p>Brak utworzonych miesięcy</p>
            {developerMode && isAdmin && (
              <button 
                className="btn-dev-generate"
                onClick={generateHistoricalMonths}
                disabled={generating}
                style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: generating ? 'wait' : 'pointer',
                  marginBottom: '1rem'
                }}
              >
                🎲 {generating ? 'Generowanie...' : 'Generuj historię miesięcy'}
              </button>
            )}
            {onAddHistorical && isAdmin && (
              <button 
                className="btn-add-historical"
                onClick={onAddHistorical}
                style={{
                  backgroundColor: '#f97316',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📜 Dodaj dane historyczne
              </button>
            )}
            <button className="btn-primary" onClick={onBack}>
              Wróć do strony głównej
            </button>
          </div>
        ) : (
          <div className="months-list">
            {months.map((month) => (
              <div
                key={month.id}
                className="month-bar"
                onClick={() => onSelectMonth(month)}
              >
                <span className="month-name">{month.name}</span>
                <span className="month-dates">
                  {format(new Date(month.start_date), 'd MMM', { locale: pl })} - {format(new Date(month.end_date), 'd MMM yyyy', { locale: pl })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="generate-modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="generate-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🎲 Generuj historię miesięcy</h3>
            <p>Ile miesięcy wstecz wygenerować?</p>
            <input
              type="number"
              min="1"
              max="24"
              value={monthsToGenerate}
              onChange={(e) => setMonthsToGenerate(e.target.value)}
              onFocus={clearZeroOnFocus}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.1rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowGenerateModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                Anuluj
              </button>
              <button
                onClick={handleGenerateConfirm}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#7c3aed',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Generuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archive;
