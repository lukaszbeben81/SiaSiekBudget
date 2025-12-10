import React, { useState, useEffect } from 'react';
import { Month, Income, Expense, Settings, Debt, PlannedExpense } from '../../types';
import { formatCurrency, getDaysRemaining, getSaturdaysInPeriod, getDaysInPeriod } from '../../utils/helpers';
import { exportToCSV, exportToTXT, exportToExcel } from '../../utils/exportHelpers';
import Modal from '../../components/Modal/Modal';
import IncomeForm, { IncomeFormData } from '../../components/IncomeForm';
import ExpenseForm, { ExpenseFormData } from '../../components/ExpenseForm';
import './MonthView.css';

interface MonthViewProps {
  month: Month | null;
  onBack: () => void;
  onRefresh: () => void;
  isArchive?: boolean;
  onNavigateToDebts?: () => void;
  isAdmin?: boolean;
  onCreateMonth?: () => void;
  canCreateNextMonth?: boolean;
}

const MonthView: React.FC<MonthViewProps> = ({ month, onBack, onRefresh, isArchive = false, onNavigateToDebts, isAdmin = true, onCreateMonth, canCreateNextMonth = false }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [expandedExpense, setExpandedExpense] = useState<number | null>(null);
  const [expandedIncome, setExpandedIncome] = useState<number | null>(null);
  
  // Income form
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  
  // Expense form for adding and editing
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  
  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Planned expenses
  const [plannedExpenses, setPlannedExpenses] = useState<PlannedExpense[]>([]);
  const [showPlannedExpenseForm, setShowPlannedExpenseForm] = useState(false);
  const [plannedExpenseName, setPlannedExpenseName] = useState('');
  const [plannedExpenseAmount, setPlannedExpenseAmount] = useState('');
  const [plannedExpenseMonth, setPlannedExpenseMonth] = useState('');
  const [plannedExpenseDescription, setPlannedExpenseDescription] = useState('');
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (month) {
      loadData();
    }
  }, [month]);

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string, action?: () => void) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action);
    setModalOpen(true);
  };

  const loadData = async () => {
    if (!month) return;

    try {
      const [incomesData, expensesData, settingsData, debtsData, plannedData] = await Promise.all([
        window.electronAPI.getIncomes(month.id),
        window.electronAPI.getExpenses(month.id),
        window.electronAPI.getSettings(),
        window.electronAPI.getDebts(),
        window.electronAPI.getPlannedExpenses()
      ]);

      setIncomes(incomesData);
      setExpenses(expensesData);
      setSettings(settingsData);
      setDebts(debtsData.filter((d: Debt) => d.is_paid === 0));
      setPlannedExpenses(plannedData);
    } catch (error) {
      console.error('Error loading month data:', error);
    }
  };

  const handlePayExpense = (expense: Expense) => {
    const remaining = expense.total_amount - expense.paid_amount;
    setPayingExpense(expense);
    setPaymentAmount(remaining.toFixed(2));
    setShowPaymentForm(true);
  };

  const handleSubmitPayment = async () => {
    if (!payingExpense) return;

    const payAmount = parseFloat(paymentAmount);
    if (isNaN(payAmount) || payAmount <= 0) {
      showModal('error', 'Błąd', 'Wprowadź poprawną kwotę');
      return;
    }

    const remaining = payingExpense.total_amount - payingExpense.paid_amount;
    if (payAmount > remaining) {
      showModal('error', 'Błąd', `Maksymalna kwota do zapłaty to ${formatCurrency(remaining)}`);
      return;
    }

    const newPaid = payingExpense.paid_amount + payAmount;

    try {
      await window.electronAPI.updateExpense(payingExpense.id, {
        paid_amount: newPaid
      });
      loadData();
      onRefresh();
      setShowPaymentForm(false);
      setPayingExpense(null);
      showModal('success', 'Sukces', `Zapłacono ${formatCurrency(payAmount)}`);
    } catch (error) {
      console.error('Error paying expense:', error);
      showModal('error', 'Błąd', 'Nie udało się zapisać płatności');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddingExpense(false);
    setShowExpenseForm(true);
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsAddingExpense(true);
    setShowExpenseForm(true);
  };

  const handleSaveExpense = async (expenseData: ExpenseFormData, addToCurrentMonth: boolean) => {
    if (!month) return;

    try {
      if (isAddingExpense) {
        // Adding new expense
        if (addToCurrentMonth) {
          await window.electronAPI.createExpense({
            month_id: month.id,
            name: expenseData.name,
            category: expenseData.category,
            total_amount: expenseData.amount,
            paid_amount: 0,
            is_fixed: expenseData.isFixed ? 1 : 0,
            column_number: expenseData.columnNumber || 1
          });
        }
        // Also save to catalog if it's a fixed expense
        if (expenseData.isFixed) {
          await window.electronAPI.createFixedExpense({
            name: expenseData.name,
            category: expenseData.category,
            default_amount: expenseData.amount,
            column_number: expenseData.columnNumber || 1
          });
        }
        loadData();
        onRefresh();
        showModal('success', 'Sukces', addToCurrentMonth ? 'Wydatek został dodany' : 'Wydatek został zapisany do katalogu');
      } else if (editingExpense) {
        // Editing existing expense
        await window.electronAPI.updateExpense(editingExpense.id, {
          name: expenseData.name,
          category: expenseData.category,
          total_amount: expenseData.amount,
          column_number: expenseData.columnNumber || 1,
          is_fixed: expenseData.isFixed ? 1 : 0
        });
        loadData();
        onRefresh();
        showModal('success', 'Sukces', 'Wydatek został zaktualizowany');
      }
      setEditingExpense(null);
      setIsAddingExpense(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      showModal('error', 'Błąd', 'Nie udało się zapisać wydatku');
    }
  };

  const handleDeleteExpense = async (expenseId: number, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć wydatek "${name}"?`)) return;

    try {
      await window.electronAPI.deleteExpense(expenseId);
      loadData();
      onRefresh();
      showModal('success', 'Sukces', 'Wydatek został usunięty');
    } catch (error) {
      console.error('Error deleting expense:', error);
      showModal('error', 'Błąd', 'Nie udało się usunąć wydatku');
    }
  };

  const handleSaveIncome = async (incomeData: IncomeFormData, addToCurrentMonth: boolean) => {
    if (!month) return;

    try {
      // Always save to catalog first
      await window.electronAPI.createFixedIncome({
        name: incomeData.name,
        category: incomeData.category,
        default_amount: incomeData.amount
      });

      // If requested, also add to current month
      if (addToCurrentMonth) {
        await window.electronAPI.createIncome({
          month_id: month.id,
          name: incomeData.name,
          amount: incomeData.amount,
          is_recurring: 0
        });
      }

      loadData();
      onRefresh();
      showModal('success', 'Sukces', addToCurrentMonth ? 'Dochód został dodany' : 'Dochód został zapisany do katalogu');
    } catch (error) {
      console.error('Error saving income:', error);
      throw error;
    }
  };

  const handleDeleteIncome = async (incomeId: number, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć dochód "${name}"?`)) return;

    try {
      await window.electronAPI.deleteIncome(incomeId);
      loadData();
      onRefresh();
      showModal('success', 'Sukces', 'Dochód został usunięty');
    } catch (error) {
      console.error('Error deleting income:', error);
      showModal('error', 'Błąd', 'Nie udało się usunąć dochodu');
    }
  };

  // Planned Expenses handlers
  const handleAddPlannedExpense = async () => {
    if (!plannedExpenseName.trim() || !plannedExpenseAmount || !plannedExpenseMonth) {
      showModal('warning', 'Uwaga', 'Wypełnij wszystkie wymagane pola');
      return;
    }

    const amount = parseFloat(plannedExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      showModal('warning', 'Uwaga', 'Podaj poprawną kwotę');
      return;
    }

    try {
      await window.electronAPI.createPlannedExpense({
        name: plannedExpenseName.trim(),
        amount: amount,
        target_month: plannedExpenseMonth,
        description: plannedExpenseDescription.trim() || undefined
      });
      
      // Reset form
      setPlannedExpenseName('');
      setPlannedExpenseAmount('');
      setPlannedExpenseMonth('');
      setPlannedExpenseDescription('');
      setShowPlannedExpenseForm(false);
      
      loadData();
      showModal('success', 'Sukces', 'Zaplanowany wydatek został dodany');
    } catch (error) {
      console.error('Error creating planned expense:', error);
      showModal('error', 'Błąd', 'Nie udało się dodać zaplanowanego wydatku');
    }
  };

  const handleDeletePlannedExpense = async (expenseId: number, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć zaplanowany wydatek "${name}"?`)) return;

    try {
      await window.electronAPI.deletePlannedExpense(expenseId);
      loadData();
      showModal('success', 'Sukces', 'Zaplanowany wydatek został usunięty');
    } catch (error) {
      console.error('Error deleting planned expense:', error);
      showModal('error', 'Błąd', 'Nie udało się usunąć zaplanowanego wydatku');
    }
  };

  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

  const formatTargetMonth = (targetMonth: string) => {
    const [year, month] = targetMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  };

  const handleExportMonth = (format: 'csv' | 'txt' | 'excel') => {
    if (!month) return;

    // Przygotuj sekcje danych
    const incomesData = incomes.map(inc => ({
      'Sekcja': 'DOCHODY',
      'Nazwa': inc.name,
      'Kwota': inc.amount.toFixed(2) + ' PLN',
      'Stały': inc.is_recurring === 1 ? 'Tak' : 'Nie',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }));

    const expensesData = expenses.map(exp => ({
      'Sekcja': 'WYDATKI',
      'Nazwa': exp.name,
      'Kwota': exp.total_amount.toFixed(2) + ' PLN',
      'Stały': '',
      'Kategoria': exp.category || '',
      'Zapłacono': exp.paid_amount.toFixed(2) + ' PLN',
      'Pozostało': (exp.total_amount - exp.paid_amount).toFixed(2) + ' PLN',
      'Typ': exp.is_fixed === 1 ? 'Stały' : 'Jednorazowy'
    }));

    const summaryData = [{
      'Sekcja': 'PODSUMOWANIE',
      'Nazwa': 'Suma dochodów',
      'Kwota': totalIncome.toFixed(2) + ' PLN',
      'Stały': '',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }, {
      'Sekcja': 'PODSUMOWANIE',
      'Nazwa': 'Suma wydatków',
      'Kwota': totalExpenses.toFixed(2) + ' PLN',
      'Stały': '',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }, {
      'Sekcja': 'PODSUMOWANIE',
      'Nazwa': 'Zapłacono',
      'Kwota': totalPaid.toFixed(2) + ' PLN',
      'Stały': '',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }, {
      'Sekcja': 'PODSUMOWANIE',
      'Nazwa': 'Do zapłaty',
      'Kwota': totalToPay.toFixed(2) + ' PLN',
      'Stały': '',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }, {
      'Sekcja': 'PODSUMOWANIE',
      'Nazwa': 'Pozostało',
      'Kwota': remaining.toFixed(2) + ' PLN',
      'Stały': '',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }, {
      'Sekcja': 'PODSUMOWANIE',
      'Nazwa': 'Zakupy tygodniowe',
      'Kwota': weeklyTotal.toFixed(2) + ' PLN',
      'Stały': '',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }, {
      'Sekcja': 'PODSUMOWANIE',
      'Nazwa': 'Zakupy dzienne',
      'Kwota': dailyTotal.toFixed(2) + ' PLN',
      'Stały': '',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }, {
      'Sekcja': 'PODSUMOWANIE',
      'Nazwa': 'Dni pozostało',
      'Kwota': daysRemaining.toString(),
      'Stały': '',
      'Kategoria': '',
      'Zapłacono': '',
      'Pozostało': '',
      'Typ': ''
    }];

    const allData = [...incomesData, ...expensesData, ...summaryData];

    const timestamp = new Date().toISOString().slice(0, 10);
    const monthName = month.name.replace(/\s+/g, '_');

    if (format === 'csv') {
      exportToCSV(allData, `${monthName}_${timestamp}.csv`);
    } else if (format === 'txt') {
      exportToTXT(allData, `${monthName}_${timestamp}.txt`, `Raport miesiąca: ${month.name}`);
    } else if (format === 'excel') {
      exportToExcel(allData, `${monthName}_${timestamp}.xls`, month.name);
    }
  };

  const totalPlannedExpenses = plannedExpenses.reduce((sum, pe) => sum + pe.amount, 0);

  if (!month) {
    return (
      <div className="month-view-container">
        <div className="month-view-content">
          <h2>Brak wybranego miesiąca</h2>
          <button className="btn-primary" onClick={onBack}>
            ← Powrót
          </button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="month-view-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total_amount, 0);
  const totalPaid = expenses.reduce((sum, expense) => sum + expense.paid_amount, 0);
  
  const saturdays = getSaturdaysInPeriod(month.start_date, month.end_date);
  const days = getDaysInPeriod(month.start_date, month.end_date);
  const weeklyTotal = settings.weekly_groceries * saturdays;
  const dailyTotal = settings.daily_expenses * days;
  
  const daysRemaining = isArchive ? 0 : getDaysRemaining(month.end_date, month.start_date);
  console.log('🔍 DEBUG getDaysRemaining:', {
    monthName: month.name,
    startDate: month.start_date,
    endDate: month.end_date,
    isArchive,
    daysRemaining
  });
  const dailyExpensesRemaining = daysRemaining * (settings?.daily_expenses || 0);
  
  // totalToPay includes unpaid expenses + remaining daily expenses (not for archive)
  const totalToPay = (totalExpenses - totalPaid) + dailyExpensesRemaining;
  
  const zakupyD = daysRemaining * (settings?.daily_expenses || 0);
  const remaining = totalIncome - totalExpenses - zakupyD;

  // Helper function to generate tooltip for expense
  const getExpenseTooltip = (expense: Expense): string => {
    const lines = [
      `Nazwa: ${expense.name}`,
      `Kategoria: ${expense.category || 'Brak'}`,
      `Kwota całkowita: ${formatCurrency(expense.total_amount)}`,
      `Zapłacono: ${formatCurrency(expense.paid_amount)}`,
      `Pozostało: ${formatCurrency(expense.total_amount - expense.paid_amount)}`,
      `Typ: ${expense.is_fixed === 1 ? 'Stały' : 'Jednorazowy'}`,
      expense.due_date ? `Termin płatności: ${expense.due_date}` : null
    ].filter(Boolean);
    return lines.join('\n');
  };

  // Parse column categories from settings
  const column1Categories = (settings.column1_categories || 'Mieszkanie,Media').split(',').map(c => c.trim());
  const column2Categories = (settings.column2_categories || 'Transport,Żywność').split(',').map(c => c.trim());

  // Filter expenses by column - column_number takes priority over category
  const column1 = expenses.filter(e => {
    if (e.column_number) return e.column_number === 1;
    return e.category && column1Categories.includes(e.category);
  });
  const column2 = expenses.filter(e => {
    if (e.column_number) return e.column_number === 2;
    return e.category && column2Categories.includes(e.category);
  });
  const column3 = expenses.filter(e => {
    if (e.column_number) return e.column_number === 3;
    // Not in column 1 or 2 by category
    if (e.category) {
      return !column1Categories.includes(e.category) && !column2Categories.includes(e.category);
    }
    // No column and no category - default to column 3
    return true;
  });

  return (
      <div className={`month-view-container ${isArchive ? 'archive-mode' : ''}`}>
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (modalAction) {
            modalAction();
            setModalAction(null);
          }
        }}
        title={modalTitle}
        type={modalType}
      >
        <p>{modalMessage}</p>
      </Modal>

      {/* Compact Top Bar */}
      <div className="month-topbar">
        <button className="btn-back" onClick={onBack}>
          ← Powrót
        </button>
        
        <div className="topbar-stats">
          <div className="stat-item">
            <span className="stat-label">Miesiąc</span>
            <span className="stat-value">
              {isArchive && <span className="archive-badge">ARCHIWUM</span>}
              <span className="month-name">{month.name}</span>
              {!isArchive && canCreateNextMonth && isAdmin && onCreateMonth && (
                <button 
                  className="btn-create-next"
                  onClick={onCreateMonth}
                  title="Utwórz następny miesiąc"
                  style={{
                    marginLeft: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--color-income)',
                    color: 'var(--bg-primary)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  + Utwórz nowy
                </button>
              )}
            </span>
          </div>
          
          <div className="stat-item" title="Liczba dni pozostałych do końca okresu rozliczeniowego">
            <span className="stat-label stat-label-small">Dni</span>
            <span className="stat-value stat-value-small text-info">{isArchive ? '-' : daysRemaining}</span>
          </div>
          
          <div className="stat-item" title="Suma wydatków na zakupy dzienne do końca okresu (dni pozostałe × dzienny limit zakupów)">
            <span className="stat-label stat-label-small">Zakupy/D</span>
            <span className="stat-value stat-value-small text-white">
              {isArchive ? '-' : formatCurrency(daysRemaining * (settings?.daily_expenses || 0))}
            </span>
          </div>
          
          <div className="stat-item" title="Suma wszystkich dochodów w bieżącym okresie">
            <span className="stat-label">Dochody</span>
            <span className="stat-value text-success">{formatCurrency(totalIncome)}</span>
          </div>
          
          <div className="stat-item" title="Kwota pozostała po odliczeniu wszystkich wydatków i rezerw">
            <span className="stat-label">Pozostało</span>
            <span className={`stat-value ${remaining >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
          
          <div className="stat-item" title="Suma wszystkich niezapłaconych wydatków">
            <span className="stat-label">Do zapłaty</span>
            <span className={`stat-value ${totalToPay > totalIncome ? 'text-danger' : 'text-success'}`}>
              {formatCurrency(totalToPay)}
            </span>
          </div>
          
          <div className="stat-item" title="Suma wszystkich opłaconych wydatków">
            <span className="stat-label">Zapłacono</span>
            <span className="stat-value text-muted">{formatCurrency(totalPaid)}</span>
          </div>
          
          {!isArchive && debts.length > 0 && (
            <div 
              className="stat-item stat-clickable"
              onClick={onNavigateToDebts}
              title="Kliknij, aby przejść do strony długów"
            >
              <span className="stat-label">Długi</span>
              <span className="stat-value text-warning">
                {formatCurrency(debts.reduce((sum, d) => sum + (d.total_amount - d.paid_amount), 0))}
              </span>
            </div>
          )}
          
          {plannedExpenses.length > 0 && (
            <div 
              className="stat-item stat-planned"
              title={plannedExpenses.map(pe => 
                `${pe.name}: ${formatCurrency(pe.amount)} - ${formatTargetMonth(pe.target_month)}`
              ).join('\n')}
            >
              <span className="stat-label">📅 Zaplanowane</span>
              <span className="stat-value text-planned">
                {formatCurrency(totalPlannedExpenses)}
              </span>
            </div>
          )}
        </div>
        
        {isAdmin && !isArchive && (
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-secondary" 
              title="Pokaż menu akcji"
              onClick={() => {
                const menu = document.getElementById('actions-menu');
                if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
              }}
              style={{ fontSize: '1.2rem', padding: '0.5rem 0.75rem' }}
            >
              ⋮
            </button>
            <div 
              id="actions-menu" 
              style={{
                display: 'none',
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                marginTop: '0.25rem',
                zIndex: 1000,
                minWidth: '180px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}
            >
              <button 
                onClick={() => { 
                  handleAddExpense(); 
                  document.getElementById('actions-menu')!.style.display = 'none'; 
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ➖ Dodaj wydatek
              </button>
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }}></div>
              <div style={{ padding: '0.25rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Eksportuj dane:
              </div>
              <button 
                onClick={() => { 
                  handleExportMonth('excel'); 
                  document.getElementById('actions-menu')!.style.display = 'none'; 
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                📊 Excel
              </button>
              <button 
                onClick={() => { 
                  handleExportMonth('csv'); 
                  document.getElementById('actions-menu')!.style.display = 'none'; 
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                📄 CSV
              </button>
              <button 
                onClick={() => { 
                  handleExportMonth('txt'); 
                  document.getElementById('actions-menu')!.style.display = 'none'; 
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                📝 TXT
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expenses in 3 Columns */}
      <div className="month-content">
        <div className="expenses-columns">
          {/* Column 1 */}
          <div className="expense-column">
            <h3 className="column-title">{settings.column1_name || 'Kolumna 1'}</h3>
            {column1.map(expense => (
              <div key={expense.id} className={`expense-bar ${expense.paid_amount >= expense.total_amount ? 'paid' : ''}`} title={getExpenseTooltip(expense)}>
                <div 
                  className="expense-bar-main"
                  onClick={() => setExpandedExpense(expandedExpense === expense.id ? null : expense.id)}
                >
                  <div className="expense-bar-info">
                    <span className="expense-name">{expense.name}</span>
                    {expense.category && (
                      <span className={`expense-category-badge ${expense.is_fixed === 0 ? 'one-time' : ''}`}>{expense.category}</span>
                    )}
                  </div>
                  <div className="expense-bar-amounts">
                    <span className="expense-topay text-danger">
                      {formatCurrency(expense.total_amount - expense.paid_amount)}
                    </span>
                    <span className="expense-paid text-muted">
                      {expense.paid_amount >= expense.total_amount && <span className="paid-check">✓ </span>}
                      {formatCurrency(expense.paid_amount)}
                    </span>
                  </div>
                </div>
                
                {isAdmin && !isArchive && expandedExpense === expense.id && (
                  <div className="expense-bar-actions">
                    <button
                      className="btn-action btn-success"
                      onClick={() => handlePayExpense(expense)}
                    >
                      💳 Zapłać
                    </button>
                    <button
                      className="btn-action btn-secondary"
                      onClick={() => handleEditExpense(expense)}
                    >
                      ✏️ Edytuj
                    </button>
                    <button
                      className="btn-action btn-danger"
                      onClick={() => handleDeleteExpense(expense.id, expense.name)}
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="expense-column">
            <h3 className="column-title">{settings.column2_name || 'Kolumna 2'}</h3>
            {column2.map(expense => (
              <div key={expense.id} className={`expense-bar ${expense.paid_amount >= expense.total_amount ? 'paid' : ''}`} title={getExpenseTooltip(expense)}>
                <div 
                  className="expense-bar-main"
                  onClick={() => setExpandedExpense(expandedExpense === expense.id ? null : expense.id)}
                >
                  <div className="expense-bar-info">
                    <span className="expense-name">{expense.name}</span>
                    {expense.category && (
                      <span className={`expense-category-badge ${expense.is_fixed === 0 ? 'one-time' : ''}`}>{expense.category}</span>
                    )}
                  </div>
                  <div className="expense-bar-amounts">
                    <span className="expense-topay text-danger">
                      {formatCurrency(expense.total_amount - expense.paid_amount)}
                    </span>
                    <span className="expense-paid text-muted">
                      {expense.paid_amount >= expense.total_amount && <span className="paid-check">✓ </span>}
                      {formatCurrency(expense.paid_amount)}
                    </span>
                  </div>
                </div>
                
                {isAdmin && !isArchive && expandedExpense === expense.id && (
                  <div className="expense-bar-actions">
                    <button
                      className="btn-action btn-success"
                      onClick={() => handlePayExpense(expense)}
                    >
                      💳 Zapłać
                    </button>
                    <button
                      className="btn-action btn-secondary"
                      onClick={() => handleEditExpense(expense)}
                    >
                      ✏️ Edytuj
                    </button>
                    <button
                      className="btn-action btn-danger"
                      onClick={() => handleDeleteExpense(expense.id, expense.name)}
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Column 3 */}
          <div className="expense-column">
            <h3 className="column-title">{settings.column3_name || 'Kolumna 3'}</h3>
            {column3.map(expense => (
              <div key={expense.id} className={`expense-bar ${expense.paid_amount >= expense.total_amount ? 'paid' : ''}`} title={getExpenseTooltip(expense)}>
                <div 
                  className="expense-bar-main"
                  onClick={() => setExpandedExpense(expandedExpense === expense.id ? null : expense.id)}
                >
                  <div className="expense-bar-info">
                    <span className="expense-name">{expense.name}</span>
                    {expense.category && (
                      <span className={`expense-category-badge ${expense.is_fixed === 0 ? 'one-time' : ''}`}>{expense.category}</span>
                    )}
                  </div>
                  <div className="expense-bar-amounts">
                    <span className="expense-topay text-danger">
                      {formatCurrency(expense.total_amount - expense.paid_amount)}
                    </span>
                    <span className="expense-paid text-muted">
                      {expense.paid_amount >= expense.total_amount && <span className="paid-check">✓ </span>}
                      {formatCurrency(expense.paid_amount)}
                    </span>
                  </div>
                </div>
                
                {isAdmin && !isArchive && expandedExpense === expense.id && (
                  <div className="expense-bar-actions">
                    <button
                      className="btn-action btn-success"
                      onClick={() => handlePayExpense(expense)}
                    >
                      💳 Zapłać
                    </button>
                    <button
                      className="btn-action btn-secondary"
                      onClick={() => handleEditExpense(expense)}
                    >
                      ✏️ Edytuj
                    </button>
                    <button
                      className="btn-action btn-danger"
                      onClick={() => handleDeleteExpense(expense.id, expense.name)}
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Income Section at Bottom */}
        <div className="income-section">
          <div className="section-header">
            <h3>Dochody ({incomes.length})</h3>
            {isAdmin && !isArchive && (
              <button className="btn-add" onClick={() => setShowIncomeForm(true)}>
                + Dodaj dochód
              </button>
            )}
          </div>
          
          <div className="income-list-compact">
            {incomes.map(income => (
              <div key={income.id} className="income-bar">
                <div 
                  className="income-bar-main"
                  onClick={() => setExpandedIncome(expandedIncome === income.id ? null : income.id)}
                >
                  <span className="income-name">{income.name}</span>
                  <span className="income-amount text-success">{formatCurrency(income.amount)}</span>
                </div>
                
                {isAdmin && !isArchive && expandedIncome === income.id && (
                  <div className="income-bar-actions">
                    <button
                      className="btn-action btn-danger"
                      onClick={() => handleDeleteIncome(income.id, income.name)}
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Planned Expenses Section */}
        <div className="planned-expenses-section">
          <div className="section-header">
            <h3>📅 Zaplanowane wydatki ({plannedExpenses.length})</h3>
            <div className="planned-expenses-header-right">
              <div 
                className="planned-total-badge"
                title={plannedExpenses.map(pe => 
                  `${pe.name}: ${formatCurrency(pe.amount)} - ${formatTargetMonth(pe.target_month)}${pe.description ? ` (${pe.description})` : ''}`
                ).join('\n')}
              >
                Suma: {formatCurrency(totalPlannedExpenses)}
              </div>
              {isAdmin && !isArchive && (
                <button className="btn-add" onClick={() => setShowPlannedExpenseForm(true)}>
                  + Dodaj zaplanowany wydatek
                </button>
              )}
            </div>
          </div>
          
          {showPlannedExpenseForm && (
            <div className="planned-expense-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nazwa wydatku *</label>
                  <input
                    type="text"
                    value={plannedExpenseName}
                    onChange={(e) => setPlannedExpenseName(e.target.value)}
                    placeholder="np. Ubezpieczenie samochodu"
                  />
                </div>
                <div className="form-group">
                  <label>Kwota (PLN) *</label>
                  <input
                    type="number"
                    value={plannedExpenseAmount}
                    onChange={(e) => setPlannedExpenseAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Miesiąc docelowy *</label>
                  <select
                    value={plannedExpenseMonth}
                    onChange={(e) => setPlannedExpenseMonth(e.target.value)}
                  >
                    <option value="">Wybierz miesiąc</option>
                    {getAvailableMonths().map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Opis (opcjonalnie)</label>
                  <input
                    type="text"
                    value={plannedExpenseDescription}
                    onChange={(e) => setPlannedExpenseDescription(e.target.value)}
                    placeholder="np. OC + AC"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setShowPlannedExpenseForm(false);
                    setPlannedExpenseName('');
                    setPlannedExpenseAmount('');
                    setPlannedExpenseMonth('');
                    setPlannedExpenseDescription('');
                  }}
                >
                  Anuluj
                </button>
                <button className="btn-primary" onClick={handleAddPlannedExpense}>
                  Dodaj wydatek
                </button>
              </div>
            </div>
          )}

          {plannedExpenses.length > 0 && (
            <div className="planned-expenses-list">
              {plannedExpenses.map(expense => (
                <div key={expense.id} className="planned-expense-item">
                  <div className="planned-expense-info">
                    <span className="planned-expense-name">{expense.name}</span>
                    <span className="planned-expense-month">{formatTargetMonth(expense.target_month)}</span>
                    {expense.description && (
                      <span className="planned-expense-desc">{expense.description}</span>
                    )}
                  </div>
                  <div className="planned-expense-actions">
                    <span className="planned-expense-amount">{formatCurrency(expense.amount)}</span>
                    {isAdmin && !isArchive && (
                      <button 
                        className="btn-danger btn-xs"
                        onClick={() => handleDeletePlannedExpense(expense.id, expense.name)}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <IncomeForm
        isOpen={showIncomeForm}
        onClose={() => setShowIncomeForm(false)}
        onSave={handleSaveIncome}
        monthId={month.id}
      />
      
      <ExpenseForm
        isOpen={showExpenseForm}
        onClose={() => {
          setShowExpenseForm(false);
          setEditingExpense(null);
          setIsAddingExpense(false);
        }}
        onSave={handleSaveExpense}
        monthId={month.id}
        initialData={editingExpense ? {
          name: editingExpense.name,
          category: editingExpense.category || '',
          amount: editingExpense.total_amount,
          isFixed: editingExpense.is_fixed === 1,
          columnNumber: editingExpense.column_number || 1
        } : undefined}
        allowOneTimeExpenses={true}
      />
      
      {/* Payment Form Modal */}
      {showPaymentForm && payingExpense && (
        <div className="payment-form-overlay" onClick={() => setShowPaymentForm(false)}>
          <div className="payment-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-form-header">
              <h3>💳 Zapłać za wydatek</h3>
              <button className="btn-close-icon" onClick={() => setShowPaymentForm(false)}>×</button>
            </div>
            <div className="payment-form-content">
              <div className="payment-info">
                <p><strong>{payingExpense.name}</strong></p>
                <p>Kwota całkowita: <span className="text-primary">{formatCurrency(payingExpense.total_amount)}</span></p>
                <p>Już zapłacono: <span className="text-muted">{formatCurrency(payingExpense.paid_amount)}</span></p>
                <p>Pozostało do zapłaty: <span className="text-danger">{formatCurrency(payingExpense.total_amount - payingExpense.paid_amount)}</span></p>
              </div>
              <div className="payment-input">
                <label htmlFor="payment-amount">Kwota do zapłaty (PLN)</label>
                <input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={payingExpense.total_amount - payingExpense.paid_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="payment-actions">
                <button className="btn-secondary" onClick={() => setShowPaymentForm(false)}>
                  Anuluj
                </button>
                <button className="btn-primary" onClick={handleSubmitPayment}>
                  Zapłać
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthView;
