import React, { useState, useEffect } from 'react';
import { Month, Expense, Income, Debt, Settings } from '../../types';
import {
  formatCurrency,
  formatDate,
  getDaysRemaining,
  getSaturdaysInPeriod,
  getDaysInPeriod,
  calculateRemaining,
  calculateToPay
} from '../../utils/helpers';
import './TopBar.css';

interface TopBarProps {
  currentMonth: Month | null;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddDebt: () => void;
  onPayDebt: () => void;
  onShowCharts: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentMonth,
  onAddIncome,
  onAddExpense,
  onAddDebt,
  onPayDebt,
  onShowCharts
}) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    if (!currentMonth) return;

    try {
      const [incomesData, expensesData, debtsData, settingsData] = await Promise.all([
        window.electronAPI.getIncomes(currentMonth.id),
        window.electronAPI.getExpenses(currentMonth.id),
        window.electronAPI.getDebts(),
        window.electronAPI.getSettings()
      ]);

      setIncomes(incomesData);
      setExpenses(expensesData);
      setDebts(debtsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading top bar data:', error);
    }
  };

  if (!currentMonth || !settings) {
    return (
      <div className="topbar">
        <div className="container">
          <div className="topbar-content">
            <h2 className="topbar-title">Ładowanie...</h2>
          </div>
        </div>
      </div>
    );
  }

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total_amount, 0);
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.total_amount - debt.paid_amount), 0);
  
  const saturdays = getSaturdaysInPeriod(currentMonth.start_date, currentMonth.end_date);
  const days = getDaysInPeriod(currentMonth.start_date, currentMonth.end_date);
  
  const remaining = calculateRemaining(
    totalIncome,
    totalExpenses,
    settings.weekly_groceries,
    saturdays,
    settings.daily_expenses,
    days
  );
  
  const toPay = calculateToPay(expenses);
  const daysRemaining = getDaysRemaining(currentMonth.end_date, currentMonth.start_date);

  const isToPayNegative = toPay > totalIncome;

  return (
    <div className="topbar">
      <div className="container">
        <div className="topbar-content">
          <div className="topbar-info">
            <div className="topbar-item" title="Dzisiejsza data">
              <span className="topbar-label">Data</span>
              <span className="topbar-value">{formatDate(new Date())}</span>
            </div>

            <div className="topbar-item" title="Liczba dni pozostałych do końca okresu rozliczeniowego">
              <span className="topbar-label">Dni</span>
              <span className="topbar-value text-info">{daysRemaining}</span>
            </div>

            <div className="topbar-item" title="Kwota pozostała po odliczeniu wszystkich wydatków i rezerw">
              <span className="topbar-label">Pozostało</span>
              <span className={`topbar-value ${remaining >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(remaining)}
              </span>
            </div>

            <div className="topbar-item" title="Suma wszystkich niezapłaconych wydatków">
              <span className="topbar-label">Do zapłaty</span>
              <span className={`topbar-value ${isToPayNegative ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(toPay)}
              </span>
            </div>

            <div className="topbar-item" title="Całkowita wartość wszystkich aktywnych długów">
              <span className="topbar-label">Wartość długu</span>
              <span className="topbar-value text-warning">{formatCurrency(totalDebt)}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="btn-icon btn-primary"
              onClick={() => setShowActions(!showActions)}
              title="Akcje"
            >
              {showActions ? '✕' : '☰'}
            </button>

            {showActions && (
              <div className="action-menu slide-in">
                <button className="action-btn" onClick={onAddIncome}>
                  <span className="action-icon text-success">+</span>
                  Dodaj dochód
                </button>
                <button className="action-btn" onClick={onAddExpense}>
                  <span className="action-icon text-danger">−</span>
                  Dodaj wydatek
                </button>
                <button className="action-btn" onClick={onAddDebt}>
                  <span className="action-icon text-warning">💳</span>
                  Dodaj dług
                </button>
                <button className="action-btn" onClick={onPayDebt}>
                  <span className="action-icon text-info">✓</span>
                  Spłać dług
                </button>
                <button className="action-btn" onClick={onShowCharts}>
                  <span className="action-icon">📊</span>
                  Wykresy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
