import React, { useState, useEffect, useRef } from 'react';
import { clearZeroOnFocus } from '../../utils/helpers';
import './IncomeForm.css';

interface IncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: IncomeFormData, addToCurrentMonth: boolean) => Promise<void>;
  monthId?: number; // If provided, show option to add to current month
  initialData?: IncomeFormData; // If provided, form is in edit mode
}

export interface IncomeFormData {
  name: string;
  category: string;
  amount: number;
  taxContribution?: number;
}

// Sample data for random generation
const RANDOM_INCOME_NAMES = [
  'Wynagrodzenie', 'Premia', 'Freelance', 'Zwrot podatku', 'Sprzedaż',
  'Dywidenda', 'Odsetki', 'Wynajem', 'Zlecenie', 'Bonus roczny',
  'Nadgodziny', 'Prowizja', 'Dotacja', 'Stypendium', 'Emerytura'
];

const RANDOM_INCOME_CATEGORIES = [
  'Praca', 'Inwestycje', 'Dodatkowe', 'Pasywne', 'Okazjonalne'
];

const IncomeForm: React.FC<IncomeFormProps> = ({ isOpen, onClose, onSave, monthId, initialData }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [taxContribution, setTaxContribution] = useState('');
  const [taxNotApplicable, setTaxNotApplicable] = useState(true);
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
        // Edit mode - load existing data
        setName(initialData.name);
        setCategory(initialData.category);
        setAmount(initialData.amount.toString());
        const hasTaxContribution = initialData.taxContribution && initialData.taxContribution > 0;
        setTaxContribution(hasTaxContribution ? (initialData.taxContribution?.toString() || '') : '');
        setTaxNotApplicable(!hasTaxContribution);
      } else {
        // Add mode - reset fields
        setName('');
        setCategory('');
        setAmount('');
        setTaxContribution('');
        setTaxNotApplicable(true);
        setShowNewCategory(false);
        setNewCategory('');
      }
      loadCategories();
      loadDeveloperMode();
    }
  }, [isOpen, initialData]);

  const loadDeveloperMode = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      setDeveloperMode(settings.developer_mode === 1);
    } catch (error) {
      console.error('Error loading developer mode:', error);
    }
  };

  const generateRandomData = () => {
    const randomName = RANDOM_INCOME_NAMES[Math.floor(Math.random() * RANDOM_INCOME_NAMES.length)];
    const randomCategory = RANDOM_INCOME_CATEGORIES[Math.floor(Math.random() * RANDOM_INCOME_CATEGORIES.length)];
    const randomAmount = (Math.floor(Math.random() * 10000) + 500).toFixed(2);
    
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
    setTaxNotApplicable(Math.random() > 0.5);
    setTaxContribution((parseFloat(randomAmount) * 0.19).toFixed(2));
    
    // Reset ref after a delay
    setTimeout(() => {
      skipAutoSuggestRef.current = false;
    }, 500);
  };

  useEffect(() => {
    // Only auto-suggest if not in edit mode and name changed
    if (skipAutoSuggestRef.current) return;
    if (name.trim() && !initialData) {
      loadSuggestedAmount(name);
    } else if (!name.trim() && !initialData) {
      setAmount('0');
    }
  }, [name, initialData]);

  const loadCategories = async () => {
    try {
      const incomes = await window.electronAPI.getFixedIncomes();
      const uniqueCategories = Array.from(new Set(incomes.map((i: any) => i.category).filter(Boolean)));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSuggestedAmount = async (incomeName: string) => {
    try {
      // Get all incomes from fixed catalog and all months
      const [fixedIncomes, allMonths] = await Promise.all([
        window.electronAPI.getFixedIncomes(),
        window.electronAPI.getMonths()
      ]);

      // Find in fixed catalog first
      const fixedIncome = fixedIncomes.find((i: any) => i.name.toLowerCase() === incomeName.toLowerCase());
      if (fixedIncome) {
        setAmount(fixedIncome.default_amount.toString());
        return;
      }

      // Search in all months for the same name
      for (const month of allMonths) {
        const monthIncomes = await window.electronAPI.getIncomes(month.id);
        const foundIncome = monthIncomes.find((i: any) => i.name.toLowerCase() === incomeName.toLowerCase());
        if (foundIncome) {
          setAmount(foundIncome.amount.toString());
          return;
        }
      }

      setAmount('0');
    } catch (error) {
      console.error('Error loading suggested amount:', error);
      setAmount('0');
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

    const incomeData: IncomeFormData = {
      name: name.trim(),
      category: category === 'new' ? newCategory.trim() : category,
      amount: amountNum,
      ...(!taxNotApplicable && taxContribution && parseFloat(taxContribution) > 0 && { taxContribution: parseFloat(taxContribution) })
    };

    if (monthId) {
      setShowMonthQuestion(true);
    } else {
      await saveIncome(incomeData, false);
    }
  };

  const saveIncome = async (incomeData: IncomeFormData, addToMonth: boolean) => {
    setIsLoading(true);
    try {
      await onSave(incomeData, addToMonth);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Nie udało się zapisać dochodu');
    } finally {
      setIsLoading(false);
      setShowMonthQuestion(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setAmount('');
    setTaxContribution('');
    setTaxNotApplicable(true);
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
          <h3>Gdzie zapisać dochód?</h3>
          <p>Czy chcesz dodać ten dochód do aktualnego okresu rozliczeniowego?</p>
          
          <div className="month-question-actions">
            <button
              className="btn-secondary"
              onClick={() => saveIncome({
                name: name.trim(),
                category: category === 'new' ? newCategory.trim() : category,
                amount: parseFloat(amount)
              }, false)}
              disabled={isLoading}
            >
              Tylko zapisz do katalogu
            </button>
            <button
              className="btn-primary"
              onClick={() => saveIncome({
                name: name.trim(),
                category: category === 'new' ? newCategory.trim() : category,
                amount: parseFloat(amount)
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
            <span className="header-icon">💰</span>
            <h3>Dodaj dochód</h3>
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
          <div className="form-row">
            <div className="form-field" title="Wpisz nazwę źródła dochodu, np. Wynagrodzenie, Premia, itp.">
              <label htmlFor="income-name">Nazwa dochodu *</label>
              <input
                id="income-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Wynagrodzenie"
                required
              />
            </div>

            <div className="form-field" title="Podaj wysokość dochodu w złotówkach">
              <label htmlFor="income-amount">Kwota (PLN) *</label>
              <input
                id="income-amount"
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
            <div className="form-field" title="Wybierz kategorię dochodu lub utwórz nową">
              <label htmlFor="income-category">Kategoria *</label>
              <select
                id="income-category"
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

            <div className="form-field" title="Wpisz wartość podatku lub zaznacz N/D jeśli nie dotyczy">
              <label>Składka na podatek</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={taxNotApplicable}
                    onChange={(e) => {
                      setTaxNotApplicable(e.target.checked);
                      if (e.target.checked) {
                        setTaxContribution('');
                      }
                    }}
                  />
                  <span>N/D</span>
                </label>
                {!taxNotApplicable && (
                  <input
                    id="income-tax"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={taxContribution}
                    onChange={(e) => setTaxContribution(e.target.value)}
                    onFocus={clearZeroOnFocus}
                    placeholder="0.00"
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>
          </div>

          {showNewCategory && (
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
              className="btn-primary"
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

export default IncomeForm;
