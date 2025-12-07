import React, { useState, useEffect } from 'react';
import { FixedIncome, Settings, Debt, Piggybank } from '../../types';
import Modal from '../../components/Modal/Modal';
import IncomeForm, { IncomeFormData } from '../../components/IncomeForm';
import ExpenseForm, { ExpenseFormData } from '../../components/ExpenseForm';
import { clearZeroOnFocus } from '../../utils/helpers';
import './CreateMonth.css';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { getSaturdaysInPeriod } from '../../utils/helpers';

interface CreateMonthProps {
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
  isLocked?: boolean;
}

const CreateMonth: React.FC<CreateMonthProps> = ({ onBack, onMonthCreated }) => {
  const [step, setStep] = useState(0); // Changed from 1 to 0 for month selection
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Month selection (Step 0)
  const [availableMonths, setAvailableMonths] = useState<{value: string; label: string; startDate: string; endDate: string}[]>([]);
  const [selectedMonthOption, setSelectedMonthOption] = useState<string>('');
  const [customDates, setCustomDates] = useState(false);

  // Month data
  const [monthName, setMonthName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 1: Incomes
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncomeIndex, setEditingIncomeIndex] = useState<number | null>(null);
  const [showIncomeCatalog, setShowIncomeCatalog] = useState(false);
  const [catalogIncomes, setCatalogIncomes] = useState<FixedIncome[]>([]);
  const [selectedCatalogIncome, setSelectedCatalogIncome] = useState<FixedIncome | null>(null);
  const [catalogIncomeAmount, setCatalogIncomeAmount] = useState('');
  const [catalogIncomeTax, setCatalogIncomeTax] = useState('');
  const [catalogIncomeTaxNA, setCatalogIncomeTaxNA] = useState(true);

  // Step 2: Fixed expenses
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);
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

  useEffect(() => {
    initializeMonth();
  }, []);

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const initializeMonth = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      const billingDay = settings.billing_day;
      const existingMonths = await window.electronAPI.getMonths();
      
      // Calculate available month options
      const today = new Date();
      const options: {value: string; label: string; startDate: string; endDate: string}[] = [];
      
      // Calculate current period
      let currentPeriodStart: Date;
      if (today.getDate() >= billingDay) {
        // We're past billing day, so current period started this month
        currentPeriodStart = new Date(today.getFullYear(), today.getMonth(), billingDay);
      } else {
        // We're before billing day, so current period started last month
        currentPeriodStart = new Date(today.getFullYear(), today.getMonth() - 1, billingDay);
      }
      
      // Calculate end date: one day before next billing day
      const currentPeriodEnd = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, billingDay - 1);
      
      const currentPeriodStartStr = format(currentPeriodStart, 'yyyy-MM-dd');
      const currentPeriodEndStr = format(currentPeriodEnd, 'yyyy-MM-dd');
      // Use today's month for the name (not period start), as users think of it by current calendar month
      const currentMonthName = format(today, 'LLLL yyyy', { locale: pl });
      
      // Check if current period exists
      const currentExists = existingMonths.some(m => 
        m.start_date === currentPeriodStartStr && m.end_date === currentPeriodEndStr
      );
      
      if (!currentExists) {
        options.push({
          value: 'current',
          label: `${currentMonthName} (bieżący)`,
          startDate: currentPeriodStartStr,
          endDate: currentPeriodEndStr
        });
      }
      
      // Calculate previous period
      const previousPeriodStart = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() - 1, billingDay);
      
      // Calculate end date for previous period
      const previousPeriodEnd = new Date(previousPeriodStart.getFullYear(), previousPeriodStart.getMonth() + 1, billingDay - 1);
      
      const previousPeriodStartStr = format(previousPeriodStart, 'yyyy-MM-dd');
      const previousPeriodEndStr = format(previousPeriodEnd, 'yyyy-MM-dd');
      // Use the calendar month before today for the name
      const previousCalendarMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const previousMonthName = format(previousCalendarMonth, 'LLLL yyyy', { locale: pl });
      
      // Check if previous period exists
      const previousExists = existingMonths.some(m => 
        m.start_date === previousPeriodStartStr && m.end_date === previousPeriodEndStr
      );
      
      if (!previousExists) {
        options.push({
          value: 'previous',
          label: previousMonthName,
          startDate: previousPeriodStartStr,
          endDate: previousPeriodEndStr
        });
      }
      
      // Add custom option
      options.push({
        value: 'custom',
        label: 'Własny okres...',
        startDate: currentPeriodStartStr,
        endDate: currentPeriodEndStr
      });
      
      setAvailableMonths(options);
      
      // Auto-select first available option (not custom)
      const firstNonCustomOption = options.find(o => o.value !== 'custom');
      if (firstNonCustomOption) {
        setSelectedMonthOption(firstNonCustomOption.value);
        setStartDate(firstNonCustomOption.startDate);
        setEndDate(firstNonCustomOption.endDate);
        // Extract month name from the label (already formatted correctly)
        const labelParts = firstNonCustomOption.label.split(' (');
        setMonthName(labelParts[0]);
      } else {
        // Only custom option available
        setSelectedMonthOption('custom');
        setCustomDates(true);
        setStartDate(currentPeriodStartStr);
        setEndDate(currentPeriodEndStr);
        setMonthName(currentMonthName);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing month:', error);
      showModal('error', 'Błąd', 'Nie udało się zainicjować nowego miesiąca');
      setLoading(false);
    }
  };

  const handleMonthSelection = async () => {
    if (!selectedMonthOption) {
      showModal('warning', 'Uwaga', 'Wybierz miesiąc do utworzenia');
      return;
    }
    
    if (selectedMonthOption === 'custom' && (!startDate || !endDate)) {
      showModal('warning', 'Uwaga', 'Wprowadź daty okresu rozliczeniowego');
      return;
    }
    
    // Check for duplicates
    try {
      const existingMonths = await window.electronAPI.getMonths();
      const duplicate = existingMonths.find(m => 
        m.start_date === startDate && m.end_date === endDate
      );
      
      if (duplicate) {
        showModal('error', 'Błąd', `Miesiąc ${duplicate.name} z tym okresem już istnieje!`);
        return;
      }
      
      // Load data for selected period
      setLoading(true);
      const settings = await window.electronAPI.getSettings();
      await loadPreviousMonthData(startDate, endDate, settings);
      setLoading(false);
      setStep(1); // Move to income step
    } catch (error) {
      console.error('Error loading month data:', error);
      showModal('error', 'Błąd', 'Nie udało się załadować danych miesiąca');
      setLoading(false);
    }
  };

  const handleMonthOptionChange = (value: string) => {
    setSelectedMonthOption(value);
    
    if (value === 'custom') {
      setCustomDates(true);
      // Don't change dates when switching to custom - keep current values
    } else {
      setCustomDates(false);
      const option = availableMonths.find(m => m.value === value);
      if (option) {
        setStartDate(option.startDate);
        setEndDate(option.endDate);
        // Use cached label instead of recalculating
        const labelParts = option.label.split(' (');
        setMonthName(labelParts[0]);
      }
    }
  };

  const loadPreviousMonthData = async (periodStartDate: string, periodEndDate: string, settings: Settings) => {
    try {
      // Calculate weekly groceries expense
      const saturdays = getSaturdaysInPeriod(periodStartDate, periodEndDate);
      const weeklyGroceriesAmount = saturdays * (settings.weekly_groceries || 0);
      
      // Get column categories from settings
      const column1Categories = (settings.column1_categories || 'Mieszkanie,Media').split(',').map(c => c.trim());
      const column2Categories = (settings.column2_categories || 'Transport,Żywność').split(',').map(c => c.trim());
      const column3Categories = (settings.column3_categories || 'Rozrywka,Zdrowie,Inne').split(',').map(c => c.trim());
      
      // Helper function to get column number based on category
      const getColumnNumber = (category: string): number => {
        if (column1Categories.includes(category)) return 1;
        if (column2Categories.includes(category)) return 2;
        if (column3Categories.includes(category)) return 3;
        return 1; // Default to column 1
      };
      
      // Create the locked weekly groceries expense
      const weeklyGroceriesExpense: ExpenseItem = {
        name: 'Zakupy tygodniowe',
        category: 'Żywność',
        totalAmount: weeklyGroceriesAmount,
        paidAmount: 0,
        isFixed: true,
        isLocked: true,
        columnNumber: getColumnNumber('Żywność')
      };
      
      // Load debts with due date in this period and add as locked expenses
      const debts = await window.electronAPI.getDebts();
      const debtExpenses: ExpenseItem[] = debts
        .filter((d: Debt) => {
          if (d.is_paid === 1) return false;
          if (!d.due_date) return false;
          // Check if due_date falls within the billing period
          return d.due_date >= periodStartDate && d.due_date <= periodEndDate;
        })
        .map((d: Debt) => ({
          name: `💰 ${d.name}${d.creditor ? ` (${d.creditor})` : ''}`,
          category: 'Długi',
          totalAmount: d.total_amount - d.paid_amount,
          paidAmount: 0,
          isFixed: true,
          isLocked: true,
          columnNumber: getColumnNumber('Długi')
        }));
      
      // Load active piggybanks and add as locked expenses (replaces savings from settings)
      const piggybanks = await window.electronAPI.getPiggybanks();
      const piggybankExpenses: ExpenseItem[] = piggybanks
        .filter((p: Piggybank) => p.is_active === 1)
        .map((p: Piggybank) => ({
          name: `🐷 ${p.name}`,
          category: 'Skarbonka',
          totalAmount: p.monthly_amount,
          paidAmount: 0,
          isFixed: true,
          isLocked: true,
          columnNumber: getColumnNumber('Skarbonka')
        }));
      
      const months = await window.electronAPI.getMonths();
      if (months.length === 0) {
        // First month, load from catalog
        const fixedExpenses = await window.electronAPI.getFixedExpenses();
        const expenseItems: ExpenseItem[] = fixedExpenses
          .filter(fe => fe.is_active)
          .map(fe => ({
            name: fe.name,
            category: fe.category || '',
            totalAmount: fe.default_amount,
            paidAmount: 0,
            isFixed: true,
            // Use column_number from catalog, fallback to category-based assignment
            columnNumber: fe.column_number || getColumnNumber(fe.category || '')
          }));
        // Add weekly groceries, piggybanks and debt expenses as first expenses
        setExpenses([weeklyGroceriesExpense, ...piggybankExpenses, ...debtExpenses, ...expenseItems]);
        return;
      }

      // Load from previous month
      const previousMonth = months[months.length - 1];
      const previousIncomes = await window.electronAPI.getIncomes(previousMonth.id);
      const previousExpenses = await window.electronAPI.getExpenses(previousMonth.id);

      // Map incomes
      const incomeItems: IncomeItem[] = previousIncomes.map(inc => ({
        name: inc.name,
        category: 'Pensja',
        amount: inc.amount,
        taxContribution: 0,
        isRecurring: inc.is_recurring === 1
      }));
      setIncomes(incomeItems);

      // Map fixed expenses (exclude "Zakupy tygodniowe", debt and piggybank expenses from previous - we recalculate them)
      const expenseItems: ExpenseItem[] = previousExpenses
        .filter(exp => exp.is_fixed === 1 && exp.name !== 'Zakupy tygodniowe' && !exp.name.startsWith('💰 ') && !exp.name.startsWith('🐷 '))
        .map(exp => ({
          name: exp.name,
          category: exp.category || '',
          totalAmount: exp.total_amount,
          paidAmount: 0,
          isFixed: true,
          columnNumber: exp.column_number || getColumnNumber(exp.category || '')
        }));

      // Check for expenses from same month last year
      const currentMonth = new Date(periodStartDate).getMonth();
      const lastYearMonths = months.filter(m => {
        const mDate = new Date(m.start_date);
        return mDate.getMonth() === currentMonth && mDate.getFullYear() < new Date().getFullYear();
      });

      if (lastYearMonths.length > 0) {
        const lastYearMonth = lastYearMonths[lastYearMonths.length - 1];
        const lastYearExpenses = await window.electronAPI.getExpenses(lastYearMonth.id);
        
        // Add expenses from last year that are not already in the list (except locked ones)
        lastYearExpenses.forEach(exp => {
          if (exp.name !== 'Zakupy tygodniowe' && !exp.name.startsWith('💰 ') && !exp.name.startsWith('🐷 ') && !expenseItems.find(e => e.name === exp.name)) {
            expenseItems.push({
              name: exp.name,
              category: exp.category || '',
              totalAmount: exp.total_amount,
              paidAmount: 0,
              isFixed: true,
              columnNumber: exp.column_number || getColumnNumber(exp.category || '')
            });
          }
        });
      }
      
      // Add weekly groceries, piggybanks and debt expenses as first expenses
      setExpenses([weeklyGroceriesExpense, ...piggybankExpenses, ...debtExpenses, ...expenseItems]);

    } catch (error) {
      console.error('Error loading previous month data:', error);
    }
  };

  const handleOpenIncomeCatalog = async () => {
    try {
      const fixedIncomes = await window.electronAPI.getFixedIncomes();
      // Filter out incomes already added
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
    setCatalogIncomeTax('');
    setCatalogIncomeTaxNA(true);
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
      taxContribution: catalogIncomeTaxNA ? 0 : (parseFloat(catalogIncomeTax) || 0),
      isRecurring: true
    };

    setIncomes([...incomes, incomeItem]);
    
    // Remove from available catalog
    setCatalogIncomes(catalogIncomes.filter(ci => ci.id !== selectedCatalogIncome.id));
    setSelectedCatalogIncome(null);
    setCatalogIncomeAmount('');
    setCatalogIncomeTax('');
    setCatalogIncomeTaxNA(true);
  };

  const handleCloseCatalog = () => {
    setShowIncomeCatalog(false);
    setSelectedCatalogIncome(null);
    setCatalogIncomeAmount('');
    setCatalogIncomeTax('');
    setCatalogIncomeTaxNA(true);
  };

  const handleSaveIncome = async (incomeData: IncomeFormData) => {
    // Add to list without saving to database yet
    const incomeItem: IncomeItem = {
      name: incomeData.name,
      category: incomeData.category,
      amount: incomeData.amount,
      taxContribution: incomeData.taxContribution || 0,
      isRecurring: editingIncomeIndex !== null ? incomes[editingIncomeIndex].isRecurring : false
    };
    
    if (editingIncomeIndex !== null) {
      // Update existing income
      const updated = [...incomes];
      updated[editingIncomeIndex] = incomeItem;
      setIncomes(updated);
      setEditingIncomeIndex(null);
    } else {
      // Add new income
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
    
    if (editingExpenseIndex !== null) {
      // Update existing expense
      const updated = [...expenses];
      updated[editingExpenseIndex] = { ...newExpense };
      setExpenses(updated);
      setEditingExpenseIndex(null);
    } else {
      // Add new expense
      setExpenses([...expenses, { ...newExpense }]);
    }
    
    setNewExpense({ name: '', category: '', totalAmount: 0, paidAmount: 0, isFixed: true, columnNumber: 1 });
    setShowAddExpense(false);
  };

  const handleEditExpense = (index: number) => {
    setNewExpense(expenses[index]);
    setEditingExpenseIndex(index);
    setShowAddExpense(true);
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handleSaveOneTimeExpense = async (expenseData: ExpenseFormData) => {
    const expenseItem: ExpenseItem = {
      name: expenseData.name,
      category: expenseData.category,
      totalAmount: expenseData.amount,
      paidAmount: 0,
      isFixed: false,
      columnNumber: expenseData.columnNumber || 1
    };
    setOneTimeExpenses([...oneTimeExpenses, expenseItem]);
    setShowOneTimeExpenseForm(false);
  };

  const handleCreateMonth = async () => {
    try {
      setLoading(true);

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

      // Add fixed expenses
      for (const expense of expenses) {
        await window.electronAPI.createExpense({
          month_id: monthId,
          name: expense.name,
          category: expense.category,
          total_amount: expense.totalAmount,
          paid_amount: expense.paidAmount,
          is_fixed: 1,
          column_number: expense.columnNumber || 1
        });
      }

      // Add one-time expenses
      for (const expense of oneTimeExpenses) {
        await window.electronAPI.createExpense({
          month_id: monthId,
          name: expense.name,
          category: expense.category,
          total_amount: expense.totalAmount,
          paid_amount: expense.paidAmount,
          is_fixed: 0,
          column_number: expense.columnNumber || 1
        });
      }

      showModal('success', 'Sukces', 'Miesiąc został utworzony pomyślnie');
      setTimeout(() => {
        onMonthCreated();
      }, 1500);

    } catch (error) {
      console.error('Error creating month:', error);
      showModal('error', 'Błąd', 'Nie udało się utworzyć miesiąca');
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 0) {
      handleMonthSelection();
      return;
    }
    if (step === 1 && incomes.length === 0) {
      showModal('warning', 'Uwaga', 'Dodaj przynajmniej jeden dochód');
      return;
    }
    if (step === 2 && expenses.length === 0) {
      showModal('warning', 'Uwaga', 'Dodaj przynajmniej jeden wydatek stały');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    // Don't allow going back to step 0 (month selection) after data is loaded
    if (step > 1) {
      setStep(step - 1);
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
    <div className="create-month-container">
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
      >
        <p>{modalMessage}</p>
      </Modal>

      <div className="create-month-header">
        <button className="btn-secondary btn-sm" onClick={onBack}>
          ← Powrót
        </button>
        <h1>Utwórz nowy miesiąc</h1>
      </div>

      {/* Combined Progress + Month Info Banner */}
      <div className="create-month-banner">
        {step > 0 && (
          <>
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
          </>
        )}
      </div>

      <div className="create-month-content">

        {/* STEP 0: MONTH SELECTION */}
        {step === 0 && (
          <div className="step-content fade-in">
            <h2>Wybierz miesiąc do utworzenia</h2>
            <p className="text-secondary mb-2">
              Wybierz który miesiąc chcesz utworzyć na podstawie okresu rozliczeniowego.
            </p>

            {availableMonths.length > 1 ? (
              <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                <label>Dostępne opcje:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {availableMonths.map((option) => (
                    <label 
                      key={option.value} 
                      className="radio-label" 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem',
                        border: '2px solid',
                        borderColor: selectedMonthOption === option.value ? 'var(--primary)' : 'var(--border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedMonthOption === option.value ? 'rgba(234, 179, 8, 0.1)' : 'transparent'
                      }}
                    >
                      <input
                        type="radio"
                        name="monthOption"
                        value={option.value}
                        checked={selectedMonthOption === option.value}
                        onChange={(e) => handleMonthOptionChange(e.target.value)}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <div>
                        <strong>{option.label}</strong>
                        {option.value !== 'custom' && (
                          <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                            {option.startDate} - {option.endDate}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                Wszystkie standardowe miesiące zostały już utworzone. Możesz utworzyć własny okres.
              </div>
            )}

            {(customDates || selectedMonthOption === 'custom') && (
              <div className="custom-dates-form">
                <h3>Własny okres rozliczeniowy</h3>
                <div className="form-row">
                  <div className="form-group" title="Wybierz datę rozpoczęcia okresu rozliczeniowego">
                    <label>Data początkowa</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        const monthStart = new Date(e.target.value);
                        setMonthName(format(monthStart, 'LLLL yyyy', { locale: pl }));
                      }}
                    />
                  </div>
                  <div className="form-group" title="Wybierz datę zakończenia okresu rozliczeniowego">
                    <label>Data końcowa</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" title="Podaj nazwę dla tego okresu, np. Grudzień 2025">
                  <label>Nazwa miesiąca</label>
                  <input
                    type="text"
                    value={monthName}
                    onChange={(e) => setMonthName(e.target.value)}
                    placeholder="np. Grudzień 2025"
                  />
                </div>
              </div>
            )}

            <div className="step-navigation">
              <button className="btn-primary" onClick={nextStep}>
                Dalej →
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: INCOMES */}
        {step === 1 && (
          <div className="step-content fade-in">
            <h2>Krok 1: Wprowadź wartości dochodów</h2>
            <p className="text-secondary mb-2">
              Poniżej znajdują się dochody z poprzedniego miesiąca. Możesz je modyfikować, usunąć lub dodać nowe.
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
                      {income.taxContribution !== undefined && income.taxContribution > 0 && (
                        <small>(Podatek: {income.taxContribution.toFixed(2)})</small>
                      )}
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
                    <button
                      className="btn-secondary btn-xs"
                      onClick={() => handleEditIncome(index)}
                    >
                      Modyfikuj
                    </button>
                    <button
                      className="btn-danger btn-xs"
                      onClick={() => handleRemoveIncome(index)}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!showIncomeForm && !showIncomeCatalog && (
              <div className="flex" style={{ gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => setShowIncomeForm(true)}
                >
                  + Dodaj nowy dochód
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleOpenIncomeCatalog}
                >
                  📋 Wybierz z katalogu
                </button>
              </div>
            )}

            {/* Income Catalog Modal */}
            {showIncomeCatalog && (
              <div className="catalog-modal">
                <div className="catalog-header">
                  <h3>Katalog dochodów</h3>
                  <button className="btn-secondary btn-xs" onClick={handleCloseCatalog}>
                    ✕ Zamknij
                  </button>
                </div>
                
                {catalogIncomes.length === 0 ? (
                  <p className="text-secondary">Wszystkie dochody z katalogu zostały już dodane lub katalog jest pusty.</p>
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
                        <h4>Edytuj przed dodaniem: {selectedCatalogIncome.name}</h4>
                        <div className="form-group" title="Zmodyfikuj kwotę dochodu przed dodaniem do miesiąca">
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
                        <div className="form-group" title="Zaznacz jeśli podatek nie dotyczy tego dochodu">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={catalogIncomeTaxNA}
                              onChange={(e) => setCatalogIncomeTaxNA(e.target.checked)}
                            />
                            <span>Podatek nie dotyczy</span>
                          </label>
                        </div>
                        {!catalogIncomeTaxNA && (
                          <div className="form-group" title="Wpisz kwotę składki podatkowej">
                            <label>Składka podatkowa (PLN)</label>
                            <input
                              type="number"
                              value={catalogIncomeTax}
                              onChange={(e) => setCatalogIncomeTax(e.target.value)}
                              onFocus={clearZeroOnFocus}
                              step="0.01"
                              min="0"
                            />
                          </div>
                        )}
                        <button className="btn-primary" onClick={handleAddFromCatalog}>
                          Dodaj do miesiąca
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
              Wydatki z poprzedniego miesiąca oraz z tego samego miesiąca rok temu.
            </p>

            <div className="items-list">
              {expenses.map((expense, index) => (
                <div key={index} className={`item-card ${expense.isLocked ? 'locked' : ''}`}>
                  <div className="item-info">
                    <div className="item-name-row">
                      <strong>{expense.name}</strong>
                      {expense.isLocked && <span className="locked-badge">🔒</span>}
                      <span className="item-category">{expense.category}</span>
                    </div>
                    <div className="item-amount">{expense.totalAmount.toFixed(2)} PLN</div>
                  </div>
                  {!expense.isLocked && (
                    <div className="item-actions">
                      <button
                        className="btn-secondary btn-xs"
                        onClick={() => handleEditExpense(index)}
                      >
                        Modyfikuj
                      </button>
                      <button
                        className="btn-danger btn-xs"
                        onClick={() => handleRemoveExpense(index)}
                      >
                        Usuń
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!showAddExpense && (
              <button
                className="btn-primary mt-2"
                onClick={() => setShowAddExpense(true)}
              >
                + Dodaj wydatek stały
              </button>
            )}

            {showAddExpense && (
              <div className="add-item-form compact">
                <h3>{editingExpenseIndex !== null ? 'Edytuj wydatek stały' : 'Nowy wydatek stały'}</h3>
                <div className="form-row">
                  <div className="form-group" title="Wpisz nazwę wydatku stałego">
                    <label>Nazwa wydatku</label>
                    <input
                      type="text"
                      value={newExpense.name}
                      onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                      placeholder="np. Czynsz"
                    />
                  </div>
                  <div className="form-group" title="Wybierz kategorię wydatku">
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
                  <div className="form-group" title="Podaj kwotę wydatku w złotówkach">
                    <label>Kwota (PLN)</label>
                    <input
                      type="number"
                      value={newExpense.totalAmount}
                      onChange={(e) => setNewExpense({ ...newExpense, totalAmount: parseFloat(e.target.value) })}
                      onFocus={clearZeroOnFocus}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="form-group" title="Wybierz w której kolumnie wydatek ma się wyświetlać">
                    <label>Kolumna wyświetlania</label>
                    <select
                      value={newExpense.columnNumber || 1}
                      onChange={(e) => setNewExpense({ ...newExpense, columnNumber: parseInt(e.target.value) })}
                    >
                      <option value={1}>Kolumna 1 - Lewa</option>
                      <option value={2}>Kolumna 2 - Środek</option>
                      <option value={3}>Kolumna 3 - Prawa</option>
                    </select>
                  </div>
                </div>
                <div className="flex" style={{ gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setShowAddExpense(false);
                      setEditingExpenseIndex(null);
                      setNewExpense({ name: '', category: '', totalAmount: 0, paidAmount: 0, isFixed: true, columnNumber: 1 });
                    }}
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={handleAddExpense}
                  >
                    {editingExpenseIndex !== null ? 'Zapisz zmiany' : 'Dodaj wydatek'}
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
              Czy chcesz dodać wydatki jednorazowe od razu?
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
                  <button
                    className="btn-primary"
                    onClick={() => setShowOneTimeExpenseForm(true)}
                  >
                    + Dodaj wydatek jednorazowy
                  </button>
                )}

                <ExpenseForm
                  isOpen={showOneTimeExpenseForm}
                  onClose={() => setShowOneTimeExpenseForm(false)}
                  onSave={handleSaveOneTimeExpense}
                  defaultIsFixed={false}
                  allowOneTimeExpenses={true}
                />
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
            <h2>Krok 4: Podsumowanie</h2>
            <p className="text-secondary mb-2">
              Sprawdź dane przed utworzeniem miesiąca
            </p>

            <div className="summary-grid">
              <div className="summary-column">
                <h3>Dochody</h3>
                <div className="summary-list">
                  {incomes.map((income, index) => (
                    <div key={index} className="summary-item">
                      <div className="summary-item-name">{income.name}</div>
                      <div className="summary-item-amount text-success">
                        {income.amount.toFixed(2)} PLN
                        {income.taxContribution !== undefined && income.taxContribution > 0 && (
                          <small style={{ display: 'block', fontSize: '0.75em', color: 'var(--text-secondary)' }}>
                            Podatek: {income.taxContribution.toFixed(2)} PLN
                          </small>
                        )}
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
                    <strong>Pozostało:</strong>
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
                className="btn-primary"
                onClick={handleCreateMonth}
                disabled={loading}
              >
                {loading ? 'Tworzenie...' : 'Utwórz miesiąc'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateMonth;
