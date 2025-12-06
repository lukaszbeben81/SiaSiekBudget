import React, { useState, useEffect, useMemo } from 'react';
import { FixedIncome, FixedExpense, Month } from '../../types';
import Modal from '../../components/Modal/Modal';
import IncomeForm, { IncomeFormData } from '../../components/IncomeForm';
import { clearZeroOnFocus } from '../../utils/helpers';
import './HistoricalMonth.css';
import { format, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';

interface HistoricalMonthProps {
  onBack: () => void;
  onMonthCreated: () => void;
}

interface IncomeItem {
  id?: number;
  name: string;
  category: string;
  amount: number;
  taxContribution?: number;
  isRecurring: boolean;
}

interface ExpenseItem {
  id?: number;
  name: string;
  category: string;
  totalAmount: number;
  paidAmount: number;
  isFixed: boolean;
  columnNumber?: number;
}

const HistoricalMonth: React.FC<HistoricalMonthProps> = ({ onBack, onMonthCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Month data - user selects the period
  const [monthName, setMonthName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [billingDay, setBillingDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [existingMonths, setExistingMonths] = useState<Month[]>([]);

  // Step 1: Incomes
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncomeIndex, setEditingIncomeIndex] = useState<number | null>(null);
  const [showIncomeCatalog, setShowIncomeCatalog] = useState(false);
  const [catalogIncomes, setCatalogIncomes] = useState<FixedIncome[]>([]);
  const [selectedCatalogIncome, setSelectedCatalogIncome] = useState<FixedIncome | null>(null);
  const [catalogIncomeAmount, setCatalogIncomeAmount] = useState('');

  // Step 2: Fixed expenses
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showExpenseCatalog, setShowExpenseCatalog] = useState(false);
  const [catalogExpenses, setCatalogExpenses] = useState<FixedExpense[]>([]);
  const [selectedCatalogExpense, setSelectedCatalogExpense] = useState<FixedExpense | null>(null);
  const [catalogExpenseAmount, setCatalogExpenseAmount] = useState('');
  const [newExpense, setNewExpense] = useState<ExpenseItem>({
    name: '',
    category: '',
    totalAmount: 0,
    paidAmount: 0,
    isFixed: true,
    columnNumber: 1
  });

  // Step 3: One-time expenses
  const [addOneTimeExpenses, setAddOneTimeExpenses] = useState(false);
  const [oneTimeExpenses, setOneTimeExpenses] = useState<ExpenseItem[]>([]);
  const [showOneTimeExpenseForm, setShowOneTimeExpenseForm] = useState(false);
  const [newOneTimeExpense, setNewOneTimeExpense] = useState<ExpenseItem>({
    name: '',
    category: '',
    totalAmount: 0,
    paidAmount: 0,
    isFixed: false,
    columnNumber: 1
  });

  useEffect(() => {
    initializeHistoricalMonth();
  }, []);

  useEffect(() => {
    if (billingDay > 0) {
      updatePeriodDates(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, billingDay]);

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const initializeHistoricalMonth = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      setBillingDay(settings.billing_day);
      
      // Load existing months to check for duplicates
      const months = await window.electronAPI.getMonths();
      setExistingMonths(months);
      
      // Default to previous month
      const lastMonth = subMonths(new Date(), 1);
      setSelectedYear(lastMonth.getFullYear());
      setSelectedMonth(lastMonth.getMonth());
      
      updatePeriodDates(lastMonth.getFullYear(), lastMonth.getMonth(), settings.billing_day);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing:', error);
      showModal('error', 'Błąd', 'Nie udało się zainicjować formularza');
      setLoading(false);
    }
  };

  const updatePeriodDates = (year: number, month: number, billing?: number) => {
    const billDay = billing || billingDay;
    
    const monthStart = new Date(year, month, billDay);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(billDay - 1);

    const startDateStr = format(monthStart, 'yyyy-MM-dd');
    const endDateStr = format(monthEnd, 'yyyy-MM-dd');
    
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    
    const name = format(monthStart, 'LLLL yyyy', { locale: pl });
    setMonthName(name.charAt(0).toUpperCase() + name.slice(1));
  };

  const handleOpenIncomeCatalog = async () => {
    try {
      const fixedIncomes = await window.electronAPI.getFixedIncomes();
      const availableIncomes = fixedIncomes.filter(
        (fi: FixedIncome) => !incomes.some(inc => inc.name.toLowerCase() === fi.name.toLowerCase())
      );
      setCatalogIncomes(availableIncomes);
      setShowIncomeCatalog(true);
    } catch (error) {
      console.error('Error loading income catalog:', error);
      showModal('error', 'Błąd', 'Nie udało się załadować katalogu dochodów');
    }
  };

  const handleSelectCatalogIncome = (income: FixedIncome) => {
    setSelectedCatalogIncome(income);
    setCatalogIncomeAmount(income.default_amount.toString());
  };

  const handleAddFromCatalog = () => {
    if (!selectedCatalogIncome) return;
    
    const amount = parseFloat(catalogIncomeAmount) || 0;
    if (amount <= 0) {
      showModal('warning', 'Uwaga', 'Podaj poprawną kwotę dochodu');
      return;
    }

    const incomeItem: IncomeItem = {
      name: selectedCatalogIncome.name,
      category: selectedCatalogIncome.category || 'Inne',
      amount: amount,
      taxContribution: 0,
      isRecurring: true
    };

    setIncomes([...incomes, incomeItem]);
    setCatalogIncomes(catalogIncomes.filter(ci => ci.id !== selectedCatalogIncome.id));
    setSelectedCatalogIncome(null);
    setCatalogIncomeAmount('');
  };

  const handleCloseCatalog = () => {
    setShowIncomeCatalog(false);
    setSelectedCatalogIncome(null);
    setCatalogIncomeAmount('');
  };

  const handleSaveIncome = async (incomeData: IncomeFormData) => {
    const incomeItem: IncomeItem = {
      name: incomeData.name,
      category: incomeData.category,
      amount: incomeData.amount,
      taxContribution: incomeData.taxContribution || 0,
      isRecurring: editingIncomeIndex !== null ? incomes[editingIncomeIndex].isRecurring : false
    };
    
    if (editingIncomeIndex !== null) {
      const updated = [...incomes];
      updated[editingIncomeIndex] = incomeItem;
      setIncomes(updated);
      setEditingIncomeIndex(null);
    } else {
      setIncomes([...incomes, incomeItem]);
    }
    setShowIncomeForm(false);
  };

  const handleEditIncome = (index: number) => {
    setEditingIncomeIndex(index);
    setShowIncomeForm(true);
  };

  const handleRemoveIncome = (index: number) => {
    setIncomes(incomes.filter((_, i) => i !== index));
  };

  const handleUpdateIncome = (index: number, field: keyof IncomeItem, value: any) => {
    const updated = [...incomes];
    updated[index] = { ...updated[index], [field]: value };
    setIncomes(updated);
  };

  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.category || newExpense.totalAmount <= 0) {
      showModal('warning', 'Uwaga', 'Wypełnij wszystkie pola wydatku');
      return;
    }
    // For historical data, paid = total (already paid)
    const expenseWithPaid = { ...newExpense, paidAmount: newExpense.totalAmount };
    setExpenses([...expenses, expenseWithPaid]);
    setNewExpense({ name: '', category: '', totalAmount: 0, paidAmount: 0, isFixed: true, columnNumber: 1 });
    setShowAddExpense(false);
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  // Expense catalog functions
  const handleOpenExpenseCatalog = async () => {
    try {
      const fixedExpenses = await window.electronAPI.getFixedExpenses();
      const availableExpenses = fixedExpenses.filter(
        (fe: FixedExpense) => fe.is_active && !expenses.some(exp => exp.name.toLowerCase() === fe.name.toLowerCase())
      );
      setCatalogExpenses(availableExpenses);
      setShowExpenseCatalog(true);
    } catch (error) {
      console.error('Error loading expense catalog:', error);
      showModal('error', 'Błąd', 'Nie udało się załadować katalogu wydatków');
    }
  };

  const handleSelectCatalogExpense = (expense: FixedExpense) => {
    setSelectedCatalogExpense(expense);
    setCatalogExpenseAmount(expense.default_amount.toString());
  };

  const handleAddExpenseFromCatalog = () => {
    if (!selectedCatalogExpense) return;
    
    const amount = parseFloat(catalogExpenseAmount) || 0;
    if (amount <= 0) {
      showModal('warning', 'Uwaga', 'Podaj poprawną kwotę wydatku');
      return;
    }

    const expenseItem: ExpenseItem = {
      name: selectedCatalogExpense.name,
      category: selectedCatalogExpense.category || 'Inne',
      totalAmount: amount,
      paidAmount: amount, // Historical = paid
      isFixed: true,
      columnNumber: 1
    };

    setExpenses([...expenses, expenseItem]);
    setCatalogExpenses(catalogExpenses.filter(ce => ce.id !== selectedCatalogExpense.id));
    setSelectedCatalogExpense(null);
    setCatalogExpenseAmount('');
  };

  const handleCloseExpenseCatalog = () => {
    setShowExpenseCatalog(false);
    setSelectedCatalogExpense(null);
    setCatalogExpenseAmount('');
  };

  const handleAddOneTimeExpense = () => {
    if (!newOneTimeExpense.name || !newOneTimeExpense.category || newOneTimeExpense.totalAmount <= 0) {
      showModal('warning', 'Uwaga', 'Wypełnij wszystkie pola wydatku');
      return;
    }
    // For historical data, paid = total
    const expenseWithPaid = { ...newOneTimeExpense, paidAmount: newOneTimeExpense.totalAmount };
    setOneTimeExpenses([...oneTimeExpenses, expenseWithPaid]);
    setNewOneTimeExpense({ name: '', category: '', totalAmount: 0, paidAmount: 0, isFixed: false, columnNumber: 1 });
    setShowOneTimeExpenseForm(false);
  };

  const handleCreateHistoricalMonth = async () => {
    try {
      setLoading(true);

      // Check if month already exists (by start date or overlapping dates)
      const exists = existingMonths.some((m: Month) => 
        m.start_date === startDate || 
        m.name === monthName ||
        (m.start_date <= startDate && m.end_date >= startDate) ||
        (m.start_date <= endDate && m.end_date >= endDate)
      );
      if (exists) {
        showModal('error', 'Błąd', `Miesiąc "${monthName}" lub okres ${startDate} - ${endDate} już istnieje w archiwum`);
        setLoading(false);
        return;
      }

      // Create month
      const monthData = {
        name: monthName,
        start_date: startDate,
        end_date: endDate
      };
      const createdMonth = await window.electronAPI.createMonth(monthData);
      const monthId = createdMonth.id;

      // Add incomes
      for (const income of incomes) {
        await window.electronAPI.createIncome({
          month_id: monthId,
          name: income.name,
          amount: income.amount,
          is_recurring: income.isRecurring ? 1 : 0
        });
      }

      // Add fixed expenses (all marked as paid)
      for (const expense of expenses) {
        await window.electronAPI.createExpense({
          month_id: monthId,
          name: expense.name,
          category: expense.category,
          total_amount: expense.totalAmount,
          paid_amount: expense.totalAmount, // Historical = fully paid
          is_fixed: 1,
          column_number: expense.columnNumber || 1
        });
      }

      // Add one-time expenses (all marked as paid)
      for (const expense of oneTimeExpenses) {
        await window.electronAPI.createExpense({
          month_id: monthId,
          name: expense.name,
          category: expense.category,
          total_amount: expense.totalAmount,
          paid_amount: expense.totalAmount, // Historical = fully paid
          is_fixed: 0,
          column_number: expense.columnNumber || 1
        });
      }

      showModal('success', 'Sukces', `Dane historyczne dla "${monthName}" zostały zapisane`);
      setTimeout(() => {
        onMonthCreated();
      }, 1500);

    } catch (error) {
      console.error('Error creating historical month:', error);
      showModal('error', 'Błąd', 'Nie udało się zapisać danych historycznych');
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && incomes.length === 0) {
      showModal('warning', 'Uwaga', 'Dodaj przynajmniej jeden dochód');
      return;
    }
    if (step === 2 && expenses.length === 0) {
      showModal('warning', 'Uwaga', 'Dodaj przynajmniej jeden wydatek');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Generate available months (up to 24 months ago, excluding existing)
  const getAvailableMonths = useMemo(() => {
    const available: { year: number; month: number; label: string; startDate: string }[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 24; i++) {
      const date = subMonths(today, i);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Calculate period dates for this month
      const periodStart = new Date(year, month, billingDay);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(billingDay - 1);
      
      const startDateStr = format(periodStart, 'yyyy-MM-dd');
      const endDateStr = format(periodEnd, 'yyyy-MM-dd');
      
      // Check if this month already exists
      const exists = existingMonths.some((m: Month) => 
        m.start_date === startDateStr || 
        (m.start_date <= startDateStr && m.end_date >= startDateStr) ||
        (m.start_date <= endDateStr && m.end_date >= endDateStr)
      );
      
      if (!exists) {
        const name = format(periodStart, 'LLLL yyyy', { locale: pl });
        available.push({
          year,
          month,
          label: name.charAt(0).toUpperCase() + name.slice(1),
          startDate: startDateStr
        });
      }
    }
    
    return available;
  }, [existingMonths, billingDay]);

  // Check if current selection is valid
  const isCurrentSelectionValid = useMemo(() => {
    return getAvailableMonths.some(m => m.year === selectedYear && m.month === selectedMonth);
  }, [getAvailableMonths, selectedYear, selectedMonth]);

  // Get available years from available months
  const availableYears = useMemo(() => {
    const years = [...new Set(getAvailableMonths.map(m => m.year))];
    return years.sort((a, b) => b - a);
  }, [getAvailableMonths]);

  // Get available months for selected year
  const availableMonthsForYear = useMemo(() => {
    return getAvailableMonths.filter(m => m.year === selectedYear);
  }, [getAvailableMonths, selectedYear]);

  // Month names in Polish
  const polishMonthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="historical-month-container">
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
      >
        <p>{modalMessage}</p>
      </Modal>

      <div className="historical-month-header">
        <button className="btn-secondary btn-sm" onClick={onBack}>
          ← Powrót
        </button>
        <h1>📜 Wprowadź dane historyczne</h1>
      </div>

      {/* Progress Banner */}
      <div className="historical-month-banner">
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step === 1 ? 'current' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step === 2 ? 'current' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step === 3 ? 'current' : ''}`}>3</div>
          <div className={`step ${step >= 4 ? 'active' : ''} ${step === 4 ? 'current' : ''}`}>4</div>
        </div>
        <div className="month-info">
          <span className="month-name">{monthName}</span>
          <span className="month-period">Okres: {startDate} - {endDate}</span>
        </div>
      </div>

      <div className="historical-month-content">

        {/* STEP 1: SELECT PERIOD + INCOMES */}
        {step === 1 && (
          <div className="step-content fade-in">
            <h2>Krok 1: Wybierz okres i wprowadź dochody</h2>
            
            <div className="period-selector">
              <label>Wybierz miesiąc do uzupełnienia:</label>
              
              {getAvailableMonths.length === 0 ? (
                <div className="no-months-warning">
                  <span className="warning-icon">⚠️</span>
                  <span>Wszystkie miesiące z ostatnich 24 miesięcy już istnieją w archiwum.</span>
                </div>
              ) : (
                <div className="month-year-picker">
                  <div className="picker-row">
                    <div className="picker-group">
                      <label>Rok:</label>
                      <select 
                        value={selectedYear}
                        onChange={(e) => {
                          const newYear = parseInt(e.target.value);
                          setSelectedYear(newYear);
                          // Auto-select first available month in new year
                          const monthsInYear = getAvailableMonths.filter(m => m.year === newYear);
                          if (monthsInYear.length > 0 && !monthsInYear.some(m => m.month === selectedMonth)) {
                            setSelectedMonth(monthsInYear[0].month);
                          }
                        }}
                        className="year-select"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="picker-group">
                      <label>Miesiąc:</label>
                      <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="month-select"
                      >
                        {availableMonthsForYear.map(m => (
                          <option key={m.month} value={m.month}>{polishMonthNames[m.month]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {!isCurrentSelectionValid && availableMonthsForYear.length > 0 && (
                    <div className="selection-warning">
                      <span className="warning-icon">⚠️</span>
                      <span>Ten miesiąc już istnieje. Wybierz inny.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="historical-notice">
              <span className="notice-icon">📜</span>
              <span>Wprowadzasz dane historyczne - wszystkie płatności zostaną oznaczone jako zapłacone.</span>
            </div>

            <h3 style={{ marginTop: '1rem' }}>Dochody</h3>
            <p className="text-secondary mb-2">
              Dodaj dochody otrzymane w wybranym okresie.
            </p>

            <div className="items-list">
              {incomes.map((income, index) => (
                <div key={index} className="item-card">
                  <div className="item-info">
                    <div className="item-name-row">
                      <strong>{income.name}</strong>
                      <span className="item-category">{income.category}</span>
                    </div>
                    <div className="item-amount">
                      {income.amount.toFixed(2)} PLN
                    </div>
                    <label className="checkbox-label-inline">
                      <input
                        type="checkbox"
                        checked={income.isRecurring}
                        onChange={(e) => handleUpdateIncome(index, 'isRecurring', e.target.checked)}
                      />
                      <span>Stały</span>
                    </label>
                  </div>
                  <div className="item-actions">
                    <button className="btn-secondary btn-xs" onClick={() => handleEditIncome(index)}>
                      Modyfikuj
                    </button>
                    <button className="btn-danger btn-xs" onClick={() => handleRemoveIncome(index)}>
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!showIncomeForm && !showIncomeCatalog && (
              <div className="flex" style={{ gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn-primary" onClick={() => setShowIncomeForm(true)}>
                  + Dodaj nowy dochód
                </button>
                <button className="btn-secondary" onClick={handleOpenIncomeCatalog}>
                  📋 Wybierz z katalogu
                </button>
              </div>
            )}

            {/* Income Catalog */}
            {showIncomeCatalog && (
              <div className="catalog-modal">
                <div className="catalog-header">
                  <h3>Katalog dochodów</h3>
                  <button className="btn-secondary btn-xs" onClick={handleCloseCatalog}>
                    ✕ Zamknij
                  </button>
                </div>
                
                {catalogIncomes.length === 0 ? (
                  <p className="text-secondary">Katalog jest pusty lub wszystkie dochody zostały już dodane.</p>
                ) : (
                  <div className="catalog-content">
                    <div className="catalog-list">
                      {catalogIncomes.map((income) => (
                        <div 
                          key={income.id} 
                          className={`catalog-item ${selectedCatalogIncome?.id === income.id ? 'selected' : ''}`}
                          onClick={() => handleSelectCatalogIncome(income)}
                        >
                          <div className="catalog-item-info">
                            <strong>{income.name}</strong>
                            <span className="item-category">{income.category}</span>
                          </div>
                          <div className="catalog-item-amount">
                            {income.default_amount.toFixed(2)} PLN
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedCatalogIncome && (
                      <div className="catalog-edit-panel">
                        <h4>{selectedCatalogIncome.name}</h4>
                        <div className="form-group">
                          <label>Kwota (PLN)</label>
                          <input
                            type="number"
                            value={catalogIncomeAmount}
                            onChange={(e) => setCatalogIncomeAmount(e.target.value)}
                            onFocus={clearZeroOnFocus}
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <button className="btn-primary" onClick={handleAddFromCatalog}>
                          Dodaj
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <IncomeForm
              isOpen={showIncomeForm}
              onClose={() => {
                setShowIncomeForm(false);
                setEditingIncomeIndex(null);
              }}
              onSave={handleSaveIncome}
              initialData={editingIncomeIndex !== null ? {
                name: incomes[editingIncomeIndex].name,
                category: incomes[editingIncomeIndex].category,
                amount: incomes[editingIncomeIndex].amount,
                taxContribution: incomes[editingIncomeIndex].taxContribution
              } : undefined}
            />

            <div className="step-navigation">
              <button className="btn-primary" onClick={nextStep}>
                Dalej →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FIXED EXPENSES */}
        {step === 2 && (
          <div className="step-content fade-in">
            <h2>Krok 2: Wydatki stałe</h2>
            <p className="text-secondary mb-2">
              Wprowadź wydatki stałe z wybranego okresu (rachunki, czynsz, subskrypcje itp.)
            </p>

            <div className="historical-notice">
              <span className="notice-icon">✅</span>
              <span>Wszystkie wydatki zostaną automatycznie oznaczone jako zapłacone.</span>
            </div>

            <div className="items-list">
              {expenses.map((expense, index) => (
                <div key={index} className="item-card">
                  <div className="item-info">
                    <div className="item-name-row">
                      <strong>{expense.name}</strong>
                      <span className="item-category">{expense.category}</span>
                      <span className="paid-badge">✅ Zapłacone</span>
                    </div>
                    <div className="item-amount">{expense.totalAmount.toFixed(2)} PLN</div>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn-secondary btn-xs"
                      onClick={() => {
                        setNewExpense(expense);
                        setShowAddExpense(true);
                        handleRemoveExpense(index);
                      }}
                    >
                      Modyfikuj
                    </button>
                    <button className="btn-danger btn-xs" onClick={() => handleRemoveExpense(index)}>
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!showAddExpense && !showExpenseCatalog && (
              <div className="flex" style={{ gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn-primary" onClick={() => setShowAddExpense(true)}>
                  + Dodaj nowy wydatek
                </button>
                <button className="btn-secondary" onClick={handleOpenExpenseCatalog}>
                  📋 Wybierz z katalogu
                </button>
              </div>
            )}

            {/* Expense Catalog */}
            {showExpenseCatalog && (
              <div className="catalog-modal">
                <div className="catalog-header">
                  <h3>Katalog wydatków stałych</h3>
                  <button className="btn-secondary btn-xs" onClick={handleCloseExpenseCatalog}>
                    ✕ Zamknij
                  </button>
                </div>
                
                {catalogExpenses.length === 0 ? (
                  <p className="text-secondary">Katalog jest pusty lub wszystkie wydatki zostały już dodane.</p>
                ) : (
                  <div className="catalog-content">
                    <div className="catalog-list">
                      {catalogExpenses.map((expense) => (
                        <div 
                          key={expense.id} 
                          className={`catalog-item ${selectedCatalogExpense?.id === expense.id ? 'selected' : ''}`}
                          onClick={() => handleSelectCatalogExpense(expense)}
                        >
                          <div className="catalog-item-info">
                            <strong>{expense.name}</strong>
                            <span className="item-category">{expense.category}</span>
                          </div>
                          <div className="catalog-item-amount">
                            {expense.default_amount.toFixed(2)} PLN
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedCatalogExpense && (
                      <div className="catalog-edit-panel">
                        <h4>{selectedCatalogExpense.name}</h4>
                        <div className="form-group">
                          <label>Kwota (PLN)</label>
                          <input
                            type="number"
                            value={catalogExpenseAmount}
                            onChange={(e) => setCatalogExpenseAmount(e.target.value)}
                            onFocus={clearZeroOnFocus}
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <button className="btn-primary" onClick={handleAddExpenseFromCatalog}>
                          Dodaj
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {showAddExpense && (
              <div className="add-item-form compact">
                <h3>Nowy wydatek stały</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nazwa wydatku</label>
                    <input
                      type="text"
                      value={newExpense.name}
                      onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                      placeholder="np. Czynsz"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategoria</label>
                    <input
                      type="text"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      placeholder="np. Mieszkanie"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Kwota (PLN)</label>
                    <input
                      type="number"
                      value={newExpense.totalAmount || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, totalAmount: parseFloat(e.target.value) || 0 })}
                      onFocus={clearZeroOnFocus}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kolumna</label>
                    <select
                      value={newExpense.columnNumber || 1}
                      onChange={(e) => setNewExpense({ ...newExpense, columnNumber: parseInt(e.target.value) })}
                    >
                      <option value={1}>Kolumna 1</option>
                      <option value={2}>Kolumna 2</option>
                      <option value={3}>Kolumna 3</option>
                    </select>
                  </div>
                </div>
                <div className="flex" style={{ gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setShowAddExpense(false);
                      setNewExpense({ name: '', category: '', totalAmount: 0, paidAmount: 0, isFixed: true, columnNumber: 1 });
                    }}
                  >
                    Anuluj
                  </button>
                  <button type="button" className="btn-primary btn-sm" onClick={handleAddExpense}>
                    Dodaj wydatek
                  </button>
                </div>
              </div>
            )}

            <div className="step-navigation">
              <button className="btn-secondary" onClick={prevStep}>
                ← Wstecz
              </button>
              <button className="btn-primary" onClick={nextStep}>
                Dalej →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ONE-TIME EXPENSES */}
        {step === 3 && (
          <div className="step-content fade-in">
            <h2>Krok 3: Wydatki jednorazowe</h2>
            <p className="text-secondary mb-2">
              Czy chcesz dodać wydatki jednorazowe?
            </p>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={addOneTimeExpenses}
                  onChange={(e) => setAddOneTimeExpenses(e.target.checked)}
                />
                <span>Tak, chcę dodać wydatki jednorazowe</span>
              </label>
            </div>

            {addOneTimeExpenses && (
              <>
                <div className="items-list">
                  {oneTimeExpenses.map((expense, index) => (
                    <div key={index} className="item-card">
                      <div className="item-info">
                        <div className="item-name-row">
                          <strong>{expense.name}</strong>
                          <span className="item-category">{expense.category}</span>
                          <span className="paid-badge">✅ Zapłacone</span>
                        </div>
                        <div className="item-amount">{expense.totalAmount.toFixed(2)} PLN</div>
                      </div>
                      <div className="item-actions">
                        <button
                          className="btn-danger btn-xs"
                          onClick={() => setOneTimeExpenses(oneTimeExpenses.filter((_, i) => i !== index))}
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!showOneTimeExpenseForm && (
                  <button className="btn-primary" onClick={() => setShowOneTimeExpenseForm(true)}>
                    + Dodaj wydatek jednorazowy
                  </button>
                )}

                {showOneTimeExpenseForm && (
                  <div className="add-item-form compact">
                    <h3>Nowy wydatek jednorazowy</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nazwa</label>
                        <input
                          type="text"
                          value={newOneTimeExpense.name}
                          onChange={(e) => setNewOneTimeExpense({ ...newOneTimeExpense, name: e.target.value })}
                          placeholder="np. AGD"
                        />
                      </div>
                      <div className="form-group">
                        <label>Kategoria</label>
                        <input
                          type="text"
                          value={newOneTimeExpense.category}
                          onChange={(e) => setNewOneTimeExpense({ ...newOneTimeExpense, category: e.target.value })}
                          placeholder="np. Inne"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Kwota (PLN)</label>
                        <input
                          type="number"
                          value={newOneTimeExpense.totalAmount || ''}
                          onChange={(e) => setNewOneTimeExpense({ ...newOneTimeExpense, totalAmount: parseFloat(e.target.value) || 0 })}
                          onFocus={clearZeroOnFocus}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label>Kolumna</label>
                        <select
                          value={newOneTimeExpense.columnNumber || 1}
                          onChange={(e) => setNewOneTimeExpense({ ...newOneTimeExpense, columnNumber: parseInt(e.target.value) })}
                        >
                          <option value={1}>Kolumna 1</option>
                          <option value={2}>Kolumna 2</option>
                          <option value={3}>Kolumna 3</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex" style={{ gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          setShowOneTimeExpenseForm(false);
                          setNewOneTimeExpense({ name: '', category: '', totalAmount: 0, paidAmount: 0, isFixed: false, columnNumber: 1 });
                        }}
                      >
                        Anuluj
                      </button>
                      <button type="button" className="btn-primary btn-sm" onClick={handleAddOneTimeExpense}>
                        Dodaj
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="step-navigation">
              <button className="btn-secondary" onClick={prevStep}>
                ← Wstecz
              </button>
              <button className="btn-primary" onClick={nextStep}>
                Dalej →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUMMARY */}
        {step === 4 && (
          <div className="step-content fade-in">
            <h2>Krok 4: Podsumowanie danych historycznych</h2>
            <p className="text-secondary mb-2">
              Sprawdź dane przed zapisaniem
            </p>

            <div className="historical-notice" style={{ marginBottom: '1rem' }}>
              <span className="notice-icon">📜</span>
              <span>Zapisujesz dane historyczne dla: <strong>{monthName}</strong></span>
            </div>

            <div className="summary-grid">
              <div className="summary-column">
                <h3>Dochody</h3>
                <div className="summary-list">
                  {incomes.map((income, index) => (
                    <div key={index} className="summary-item">
                      <div className="summary-item-name">{income.name}</div>
                      <div className="summary-item-amount text-success">
                        {income.amount.toFixed(2)} PLN
                      </div>
                    </div>
                  ))}
                  <div className="summary-total">
                    <strong>Suma:</strong>
                    <strong className="text-success">
                      {incomes.reduce((sum, inc) => sum + inc.amount, 0).toFixed(2)} PLN
                    </strong>
                  </div>
                </div>
              </div>

              <div className="summary-column">
                <h3>Wydatki stałe</h3>
                <div className="summary-list">
                  {expenses.map((expense, index) => (
                    <div key={index} className="summary-item">
                      <div className="summary-item-name">{expense.name}</div>
                      <div className="summary-item-details">
                        <span>{expense.totalAmount.toFixed(2)} PLN</span>
                      </div>
                    </div>
                  ))}
                  <div className="summary-total">
                    <strong>Suma:</strong>
                    <strong className="text-danger">
                      {expenses.reduce((sum, exp) => sum + exp.totalAmount, 0).toFixed(2)} PLN
                    </strong>
                  </div>
                </div>
              </div>

              <div className="summary-column">
                <h3>Wydatki jednorazowe</h3>
                <div className="summary-list">
                  {oneTimeExpenses.length > 0 ? (
                    <>
                      {oneTimeExpenses.map((expense, index) => (
                        <div key={index} className="summary-item">
                          <div className="summary-item-name">{expense.name}</div>
                          <div className="summary-item-details">
                            <span>{expense.totalAmount.toFixed(2)} PLN</span>
                          </div>
                        </div>
                      ))}
                      <div className="summary-total">
                        <strong>Suma:</strong>
                        <strong className="text-danger">
                          {oneTimeExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0).toFixed(2)} PLN
                        </strong>
                      </div>
                    </>
                  ) : (
                    <div className="summary-item text-muted" style={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                      Brak wydatków jednorazowych
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-column summary-balance">
                <h3>Bilans</h3>
                <div className="summary-list">
                  <div className="summary-item">
                    <div className="summary-item-name">Dochody</div>
                    <div className="summary-item-amount text-success">
                      {incomes.reduce((sum, inc) => sum + inc.amount, 0).toFixed(2)} PLN
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-item-name">Wydatki</div>
                    <div className="summary-item-amount text-danger">
                      {(expenses.reduce((sum, exp) => sum + exp.totalAmount, 0) +
                        oneTimeExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0)).toFixed(2)} PLN
                    </div>
                  </div>
                  <div className="summary-total balance-total">
                    <strong>Saldo:</strong>
                    <strong className={
                      incomes.reduce((sum, inc) => sum + inc.amount, 0) -
                      (expenses.reduce((sum, exp) => sum + exp.totalAmount, 0) +
                        oneTimeExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0)) >= 0
                        ? 'text-success'
                        : 'text-danger'
                    }>
                      {(incomes.reduce((sum, inc) => sum + inc.amount, 0) -
                        (expenses.reduce((sum, exp) => sum + exp.totalAmount, 0) +
                          oneTimeExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0))).toFixed(2)} PLN
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="step-navigation">
              <button className="btn-secondary" onClick={prevStep}>
                ← Wstecz
              </button>
              <button
                className="btn-primary btn-historical"
                onClick={handleCreateHistoricalMonth}
                disabled={loading}
              >
                {loading ? 'Zapisywanie...' : '📜 Zapisz dane historyczne'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalMonth;
