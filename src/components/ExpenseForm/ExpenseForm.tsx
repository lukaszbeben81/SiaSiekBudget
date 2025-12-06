import React, { useState, useEffect, useRef } from 'react';
import { clearZeroOnFocus } from '../../utils/helpers';
import './ExpenseForm.css';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseFormData, addToCurrentMonth: boolean) => Promise<void>;
  monthId?: number;
  initialData?: ExpenseFormData;
  allowOneTimeExpenses?: boolean;
  defaultIsFixed?: boolean;
  showSaveQuestion?: boolean; // If true, show question where to save. If false, auto-save to both month and catalog
}

export interface ExpenseFormData {
  name: string;
  category: string;
  amount: number;
  isFixed: boolean;
  columnNumber?: number;
  repeatType?: 'monthly' | 'yearly' | 'custom';
  repeatMonths?: number[];
}

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

// Sample data for random generation
const RANDOM_EXPENSE_NAMES = [
  'Czynsz', 'Prąd', 'Gaz', 'Internet', 'Telefon', 'Ubezpieczenie',
  'Spotify', 'Netflix', 'Zakupy spożywcze', 'Paliwo', 'Rata kredytu',
  'Karta sportowa', 'Lekarz', 'Leki', 'Ubrania', 'Fryzjer',
  'Restauracja', 'Kino', 'Transport', 'Prezent'
];

const RANDOM_EXPENSE_CATEGORIES = [
  'Mieszkanie', 'Media', 'Transport', 'Żywność', 'Rozrywka', 
  'Zdrowie', 'Ubezpieczenia', 'Subskrypcje', 'Inne'
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, onSave, monthId, initialData, allowOneTimeExpenses = true, defaultIsFixed = true, showSaveQuestion = false }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isFixed, setIsFixed] = useState(defaultIsFixed);
  const [columnNumber, setColumnNumber] = useState(1);
  const [repeatType, setRepeatType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [repeatMonths, setRepeatMonths] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthQuestion, setShowMonthQuestion] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const skipAutoSuggestRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setCategory(initialData.category);
        setAmount(initialData.amount.toString());
        setIsFixed(initialData.isFixed);
        setColumnNumber(initialData.columnNumber || 1);
        setRepeatType(initialData.repeatType || 'monthly');
        setRepeatMonths(initialData.repeatMonths || []);
      } else {
        setName('');
        setCategory('');
        setAmount('');
        setIsFixed(defaultIsFixed);
        setColumnNumber(1);
        setRepeatType('monthly');
        setRepeatMonths([]);
        setShowNewCategory(false);
        setNewCategory('');
      }
      loadCategories();
      loadDeveloperMode();
    }
  }, [isOpen, initialData, defaultIsFixed]);

  const loadDeveloperMode = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      setDeveloperMode(settings.developer_mode === 1);
    } catch (error) {
      console.error('Error loading developer mode:', error);
    }
  };

  const generateRandomData = () => {
    const randomName = RANDOM_EXPENSE_NAMES[Math.floor(Math.random() * RANDOM_EXPENSE_NAMES.length)];
    const randomCategory = RANDOM_EXPENSE_CATEGORIES[Math.floor(Math.random() * RANDOM_EXPENSE_CATEGORIES.length)];
    const randomAmount = (Math.floor(Math.random() * 2000) + 50).toFixed(2);
    
    // Set ref before changing name to prevent auto-suggest (ref is synchronous!)
    skipAutoSuggestRef.current = true;
    
    setName(randomName);
    
    // Check if category exists in current list
    if (categories.includes(randomCategory)) {
      setCategory(randomCategory);
      setShowNewCategory(false);
    } else {
      setCategory('new');
      setNewCategory(randomCategory);
      setShowNewCategory(true);
    }
    
    setAmount(randomAmount);
    setIsFixed(Math.random() > 0.3);
    
    if (isFixed) {
      const repeatTypes: ('monthly' | 'yearly' | 'custom')[] = ['monthly', 'yearly', 'custom'];
      const randomRepeatType = repeatTypes[Math.floor(Math.random() * repeatTypes.length)];
      setRepeatType(randomRepeatType);
      
      if (randomRepeatType === 'custom') {
        const randomMonthCount = Math.floor(Math.random() * 6) + 1;
        const randomMonths: number[] = [];
        while (randomMonths.length < randomMonthCount) {
          const month = Math.floor(Math.random() * 12) + 1;
          if (!randomMonths.includes(month)) {
            randomMonths.push(month);
          }
        }
        setRepeatMonths(randomMonths.sort((a, b) => a - b));
      }
    }
    
    // Reset ref after a delay
    setTimeout(() => {
      skipAutoSuggestRef.current = false;
    }, 500);
  };

  useEffect(() => {
    if (skipAutoSuggestRef.current) return;
    if (!name.trim() || initialData) {
      if (!name.trim() && !initialData) {
        setAmount('0');
      }
      return;
    }
    
    // Debounce: czekaj 300ms po ostatniej zmianie przed załadowaniem sugestii
    const debounceTimer = setTimeout(() => {
      loadSuggestedAmount(name);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [name, initialData]);

  const loadCategories = async () => {
    try {
      const expenses = await window.electronAPI.getFixedExpenses();
      const uniqueCategories = Array.from(new Set(expenses.map((e: any) => e.category).filter(Boolean)));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSuggestedAmount = async (expenseName: string) => {
    try {
      // Najpierw sprawdź katalog stałych wydatków (najszybsze)
      const fixedExpenses = await window.electronAPI.getFixedExpenses();
      const fixedExpense = fixedExpenses.find((e: any) => e.name.toLowerCase() === expenseName.toLowerCase());
      if (fixedExpense) {
        setAmount(fixedExpense.default_amount.toString());
        return;
      }

      // Jeśli nie znaleziono w katalogu, sprawdź ostatni miesiąc (tylko 1 zapytanie zamiast wszystkich)
      const allMonths = await window.electronAPI.getMonths();
      if (allMonths.length > 0) {
        // Posortuj malejąco i weź tylko ostatni miesiąc
        const sortedMonths = [...allMonths].sort((a, b) => 
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
        const latestMonth = sortedMonths[0];
        
        const monthExpenses = await window.electronAPI.getExpenses(latestMonth.id);
        const foundExpense = monthExpenses.find((e: any) => e.name.toLowerCase() === expenseName.toLowerCase());
        if (foundExpense) {
          const expAmount = (foundExpense as any).amount || (foundExpense as any).total_amount || (foundExpense as any).default_amount || 0;
          setAmount(expAmount.toString());
          return;
        }
      }

      setAmount('0');
    } catch (error) {
      console.error('Error loading suggested amount:', error);
      setAmount('0');
    }
  };

  const toggleMonth = (monthNum: number) => {
    if (repeatMonths.includes(monthNum)) {
      setRepeatMonths(repeatMonths.filter(m => m !== monthNum));
    } else {
      setRepeatMonths([...repeatMonths, monthNum].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !category.trim() || !amount.trim()) {
      alert('Wszystkie pola są wymagane');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Wprowadź poprawną kwotę');
      return;
    }

    if (isFixed && repeatType === 'custom' && repeatMonths.length === 0) {
      alert('Wybierz przynajmniej jeden miesiąc');
      return;
    }

    const expenseData: ExpenseFormData = {
      name: name.trim(),
      category: category === 'new' ? newCategory.trim() : category,
      amount: amountNum,
      isFixed: isFixed,
      columnNumber: columnNumber,
      ...(isFixed && { repeatType }),
      ...(isFixed && repeatType === 'custom' && { repeatMonths })
    };

    if (monthId && showSaveQuestion) {
      // Only show question on Catalog page
      setShowMonthQuestion(true);
    } else if (monthId) {
      // On other pages, auto-save to both month and catalog
      await saveExpense(expenseData, true);
    } else {
      // No month context, just save to catalog
      await saveExpense(expenseData, false);
    }
  };

  const saveExpense = async (expenseData: ExpenseFormData, addToMonth: boolean) => {
    setIsLoading(true);
    try {
      await onSave(expenseData, addToMonth);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Nie udało się zapisać wydatku');
    } finally {
      setIsLoading(false);
      setShowMonthQuestion(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setAmount('');
    setIsFixed(true);
    setColumnNumber(1);
    setRepeatType('monthly');
    setRepeatMonths([]);
    setNewCategory('');
    setShowNewCategory(false);
  };

  const handleClose = () => {
    resetForm();
    setShowMonthQuestion(false);
    onClose();
  };

  if (!isOpen) return null;

  if (showMonthQuestion) {
    return (
      <div className="income-form-overlay">
        <div className="income-form-modal">
          <h3>Gdzie zapisać wydatek?</h3>
          <p>Czy chcesz dodać ten wydatek do aktualnego okresu rozliczeniowego?</p>
          
          <div className="month-question-actions">
            <button
              className="btn-secondary"
              onClick={() => saveExpense({
                name: name.trim(),
                category: category === 'new' ? newCategory.trim() : category,
                amount: parseFloat(amount),
                isFixed: isFixed,
                columnNumber: columnNumber
              }, false)}
              disabled={isLoading}
            >
              Tylko zapisz do katalogu
            </button>
            <button
              className="btn-primary"
              onClick={() => saveExpense({
                name: name.trim(),
                category: category === 'new' ? newCategory.trim() : category,
                amount: parseFloat(amount),
                isFixed: isFixed,
                columnNumber: columnNumber
              }, true)}
              disabled={isLoading}
            >
              Dodaj do bieżącego miesiąca
            </button>
          </div>
          
          <button
            className="btn-close"
            onClick={() => setShowMonthQuestion(false)}
            disabled={isLoading}
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="income-form-overlay" onClick={handleClose}>
      <div className="income-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="income-form-header">
          <div className="header-content">
            <span className="header-icon">💸</span>
            <h3 style={{ color: 'var(--color-expenses)' }}>Dodaj wydatek</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {developerMode && (
              <button
                type="button"
                className="btn-dev-generate"
                onClick={generateRandomData}
                title="Generuj losowe dane (tryb developera)"
                style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🎲 Auto
              </button>
            )}
            <button className="btn-close-icon" onClick={handleClose}>×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="income-form-content">
          {allowOneTimeExpenses && (
            <div className="form-field">
              <label>Typ wydatku</label>
              <div className="type-switch">
                <button
                  type="button"
                  className={`type-btn ${isFixed ? 'active' : ''}`}
                  onClick={() => setIsFixed(true)}
                >
                  Stały
                </button>
                <button
                  type="button"
                  className={`type-btn ${!isFixed ? 'active' : ''}`}
                  onClick={() => setIsFixed(false)}
                >
                  Jednorazowy
                </button>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="expense-name">Nazwa wydatku *</label>
              <input
                id="expense-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Czynsz"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="expense-amount">Kwota (PLN) *</label>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={clearZeroOnFocus}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="expense-category">Kategoria *</label>
              <select
                id="expense-category"
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  setShowNewCategory(val === 'new');
                }}
                required
              >
                <option value="">Wybierz kategorię</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="new">+ Nowa...</option>
              </select>
            </div>

            {showNewCategory ? (
              <div className="form-field">
                <label htmlFor="new-category">Nowa kategoria *</label>
                <input
                  id="new-category"
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nazwa kategorii"
                  required
                />
              </div>
            ) : isFixed ? (
              <div className="form-field">
                <label htmlFor="repeat-type">Powtarzanie</label>
                <select
                  id="repeat-type"
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value as 'monthly' | 'yearly' | 'custom')}
                >
                  <option value="monthly">Co miesiąc</option>
                  <option value="yearly">Co rok</option>
                  <option value="custom">Inne...</option>
                </select>
              </div>
            ) : null}
          </div>

          {showNewCategory && isFixed && (
            <div className="form-field">
              <label htmlFor="repeat-type">Powtarzanie</label>
              <select
                id="repeat-type"
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value as 'monthly' | 'yearly' | 'custom')}
              >
                <option value="monthly">Co miesiąc</option>
                <option value="yearly">Co rok</option>
                <option value="custom">Inne...</option>
              </select>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="expense-column">Kolumna wyświetlania</label>
            <select
              id="expense-column"
              value={columnNumber}
              onChange={(e) => setColumnNumber(parseInt(e.target.value))}
            >
              <option value={1}>Kolumna 1 - Lewa</option>
              <option value={2}>Kolumna 2 - Środek</option>
              <option value={3}>Kolumna 3 - Prawa</option>
            </select>
          </div>

          {isFixed && repeatType === 'custom' && (
            <div className="form-field">
              <label>Wybierz miesiące</label>
              <div className="expense-months-grid">
                {MONTH_NAMES.map((monthName, index) => {
                  const monthNum = index + 1;
                  return (
                    <label key={monthNum} className="expense-month-checkbox">
                      <input
                        type="checkbox"
                        checked={repeatMonths.includes(monthNum)}
                        onChange={() => toggleMonth(monthNum)}
                      />
                      <span>{monthName.substring(0, 3)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="btn-primary expense-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
