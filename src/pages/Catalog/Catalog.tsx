import React, { useState, useEffect } from 'react';
import { FixedExpense, FixedIncome } from '../../types';
import Modal from '../../components/Modal/Modal';
import IncomeForm, { IncomeFormData } from '../../components/IncomeForm';
import ExpenseForm, { ExpenseFormData } from '../../components/ExpenseForm';
import { isProtectedExpenseCategory, isProtectedIncomeCategory } from '../../constants/protectedCategories';
import { exportToCSV, exportToTXT, exportToExcel } from '../../utils/exportHelpers';
import './Catalog.css';

interface CatalogProps {
  onBack: () => void;
  isAdmin?: boolean;
}

type FilterType = 'all' | 'expenses' | 'incomes';

const Catalog: React.FC<CatalogProps> = ({ onBack, isAdmin = true }) => {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [incomes, setIncomes] = useState<FixedIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<FixedIncome | null>(null);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const loadData = async () => {
    try {
      const expensesData = await window.electronAPI.getFixedExpenses();
      const incomesData = await window.electronAPI.getFixedIncomes();
      console.log('Loaded expenses:', expensesData);
      console.log('Loaded incomes:', incomesData);
      setExpenses(expensesData);
      setIncomes(incomesData);
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się załadować danych');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIncome = async (incomeData: IncomeFormData) => {
    try {
      if (editingIncome) {
        // Update existing income
        await window.electronAPI.updateFixedIncome(editingIncome.id, {
          name: incomeData.name,
          category: incomeData.category,
          default_amount: incomeData.amount
        });
        showModal('success', 'Sukces', 'Dochód został zaktualizowany');
        setEditingIncome(null);
      } else {
        // Create new income
        await window.electronAPI.createFixedIncome({
          name: incomeData.name,
          category: incomeData.category,
          default_amount: incomeData.amount
        });
        showModal('success', 'Sukces', 'Dochód został dodany do katalogu');
      }
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się zapisać dochodu');
    }
  };

  const handleSaveExpense = async (expenseData: ExpenseFormData) => {
    try {
      if (editingExpense) {
        // Update existing expense
        await window.electronAPI.updateFixedExpense(editingExpense.id, {
          name: expenseData.name,
          category: expenseData.category,
          default_amount: expenseData.amount,
          column_number: expenseData.columnNumber || 1
        });
        showModal('success', 'Sukces', 'Wydatek został zaktualizowany');
        setEditingExpense(null);
      } else {
        // Create new expense
        await window.electronAPI.createFixedExpense({
          name: expenseData.name,
          category: expenseData.category,
          default_amount: expenseData.amount,
          column_number: expenseData.columnNumber || 1
        });
        showModal('success', 'Sukces', 'Wydatek został dodany do katalogu');
      }
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się zapisać wydatku');
    }
  };

  const handleEditIncome = (income: FixedIncome) => {
    setEditingIncome(income);
    setShowIncomeForm(true);
  };

  const isProtectedExpense = (category: string | undefined) => {
    return isProtectedExpenseCategory(category);
  };

  const isProtectedIncome = (category: string | undefined) => {
    return isProtectedIncomeCategory(category);
  };

  const handleDeleteIncome = async (id: number, itemName: string, category: string | undefined) => {
    if (isProtectedIncome(category)) {
      showModal('warning', 'Uwaga', `Kategoria "${category}" jest chroniona i nie można jej usunąć.`);
      return;
    }
    if (!confirm(`Czy na pewno chcesz usunąć "${itemName}"?`)) return;

    try {
      await window.electronAPI.deleteFixedIncome(id);
      showModal('success', 'Sukces', 'Usunięto pomyślnie');
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się usunąć');
    }
  };

  const handleEditExpense = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (id: number, itemName: string, category: string | undefined) => {
    if (isProtectedExpense(category)) {
      showModal('warning', 'Uwaga', `Kategoria "${category}" jest chroniona i nie można jej usunąć.`);
      return;
    }
    if (!confirm(`Czy na pewno chcesz usunąć "${itemName}"?`)) return;

    try {
      await window.electronAPI.deleteFixedExpense(id);
      showModal('success', 'Sukces', 'Usunięto pomyślnie');
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się usunąć');
    }
  };

  const handleExportExpenses = (format: 'csv' | 'txt' | 'excel') => {
    const data = expenses.map(exp => ({
      'Nazwa': exp.name,
      'Kategoria': exp.category || '',
      'Domyślna kwota': exp.default_amount.toFixed(2),
      'Kolumna': exp.column_number || 1,
      'Aktywny': exp.is_active === 1 ? 'Tak' : 'Nie'
    }));

    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (format === 'csv') {
      exportToCSV(data, `Wydatki_stale_${timestamp}.csv`);
    } else if (format === 'txt') {
      exportToTXT(data, `Wydatki_stale_${timestamp}.txt`, 'Katalog wydatków stałych');
    } else if (format === 'excel') {
      exportToExcel(data, `Wydatki_stale_${timestamp}.xls`, 'Wydatki stałe');
    }
  };

  const handleExportIncomes = (format: 'csv' | 'txt' | 'excel') => {
    const data = incomes.map(inc => ({
      'Nazwa': inc.name,
      'Kategoria': inc.category || '',
      'Domyślna kwota': inc.default_amount.toFixed(2),
      'Aktywny': inc.is_active === 1 ? 'Tak' : 'Nie'
    }));

    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (format === 'csv') {
      exportToCSV(data, `Dochody_stale_${timestamp}.csv`);
    } else if (format === 'txt') {
      exportToTXT(data, `Dochody_stale_${timestamp}.txt`, 'Katalog dochodów stałych');
    } else if (format === 'excel') {
      exportToExcel(data, `Dochody_stale_${timestamp}.xls`, 'Dochody stałe');
    }
  };

  const filteredExpenses = filter === 'incomes' ? [] : expenses;
  const filteredIncomes = filter === 'expenses' ? [] : incomes;

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
    <div className="catalog-container">
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
      >
        <p>{modalMessage}</p>
      </Modal>

      <div className="catalog-header">
        <button className="btn-secondary" onClick={onBack}>
          ← Powrót
        </button>
        <h1>Katalog wydatków i dochodów</h1>
      </div>

      <div className="catalog-content">
        <div className="catalog-controls">
          <div className="filter-buttons">
            <button 
              className={`btn-filter ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Wszystko
            </button>
            <button 
              className={`btn-filter ${filter === 'expenses' ? 'active' : ''}`}
              onClick={() => setFilter('expenses')}
            >
              Wydatki stałe
            </button>
            <button 
              className={`btn-filter ${filter === 'incomes' ? 'active' : ''}`}
              onClick={() => setFilter('incomes')}
            >
              Dochody stałe
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            {filter !== 'incomes' && filteredExpenses.length > 0 && (
              <div className="export-dropdown" style={{ position: 'relative' }}>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    const dropdown = document.getElementById('export-expenses-menu');
                    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                  }}
                >
                  📥 Eksport wydatków
                </button>
                <div 
                  id="export-expenses-menu" 
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
                    minWidth: '120px'
                  }}
                >
                  <button 
                    onClick={() => { handleExportExpenses('excel'); document.getElementById('export-expenses-menu')!.style.display = 'none'; }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)'
                    }}
                  >
                    📊 Excel
                  </button>
                  <button 
                    onClick={() => { handleExportExpenses('csv'); document.getElementById('export-expenses-menu')!.style.display = 'none'; }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)'
                    }}
                  >
                    📄 CSV
                  </button>
                  <button 
                    onClick={() => { handleExportExpenses('txt'); document.getElementById('export-expenses-menu')!.style.display = 'none'; }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)'
                    }}
                  >
                    📝 TXT
                  </button>
                </div>
              </div>
            )}
            {filter !== 'expenses' && filteredIncomes.length > 0 && (
              <div className="export-dropdown" style={{ position: 'relative' }}>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    const dropdown = document.getElementById('export-incomes-menu');
                    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                  }}
                >
                  📥 Eksport dochodów
                </button>
                <div 
                  id="export-incomes-menu" 
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
                    minWidth: '120px'
                  }}
                >
                  <button 
                    onClick={() => { handleExportIncomes('excel'); document.getElementById('export-incomes-menu')!.style.display = 'none'; }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)'
                    }}
                  >
                    📊 Excel
                  </button>
                  <button 
                    onClick={() => { handleExportIncomes('csv'); document.getElementById('export-incomes-menu')!.style.display = 'none'; }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)'
                    }}
                  >
                    📄 CSV
                  </button>
                  <button 
                    onClick={() => { handleExportIncomes('txt'); document.getElementById('export-incomes-menu')!.style.display = 'none'; }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)'
                    }}
                  >
                    📝 TXT
                  </button>
                </div>
              </div>
            )}
            {isAdmin && (
              <>
                <button 
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: '#555',
                    color: 'white',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#555'}
                  onClick={() => setShowExpenseForm(true)}
                >
                  - Wydatek
                </button>
                <button 
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: '#555',
                    color: 'white',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00cc66'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#555'}
                  onClick={() => setShowIncomeForm(true)}
                >
                  + Dochód
                </button>
              </>
            )}
          </div>
        </div>

        <div className="catalog-lists">
          {(filter === 'all' || filter === 'expenses') && filteredExpenses.length > 0 && (
            <div className="catalog-section">
              <h3>Wydatki stałe ({filteredExpenses.length})</h3>
              <div className="items-list">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="item-card">
                    <div className="item-info">
                      <div className="item-name">
                        <strong>{expense.name}</strong>
                        <span className="item-category">
                          {expense.category}
                          {isProtectedExpense(expense.category) && (
                            <span title="Kategoria chroniona - nie można usunąć" style={{ marginLeft: '6px' }}>🔒</span>
                          )}
                        </span>
                      </div>
                      <div className="item-amount text-danger">
                        {expense.default_amount.toFixed(2)} PLN
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="item-actions">
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleEditExpense(expense)}
                        >
                          Modyfikuj
                        </button>
                        {!isProtectedExpense(expense.category) && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleDeleteExpense(expense.id, expense.name, expense.category)}
                          >
                            Usuń
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(filter === 'all' || filter === 'incomes') && filteredIncomes.length > 0 && (
            <div className="catalog-section">
              <h3>Dochody stałe ({filteredIncomes.length})</h3>
              <div className="items-list">
                {filteredIncomes.map((income) => (
                  <div key={income.id} className="item-card">
                    <div className="item-info">
                      <div className="item-name">
                        <strong>{income.name}</strong>
                        <span className="item-category">
                          {income.category}
                          {isProtectedIncome(income.category) && (
                            <span title="Kategoria chroniona - nie można usunąć" style={{ marginLeft: '6px' }}>🔒</span>
                          )}
                        </span>
                      </div>
                      <div className="item-amount text-success">
                        {income.default_amount.toFixed(2)} PLN
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="item-actions">
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleEditIncome(income)}
                        >
                          Modyfikuj
                        </button>
                        {!isProtectedIncome(income.category) && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleDeleteIncome(income.id, income.name, income.category)}
                          >
                            Usuń
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredExpenses.length === 0 && filteredIncomes.length === 0 && (
            <div className="empty-state">
              <p>Brak elementów do wyświetlenia</p>
            </div>
          )}
        </div>
      </div>
    </div>

    <IncomeForm
      isOpen={showIncomeForm}
      onClose={() => {
        setShowIncomeForm(false);
        setEditingIncome(null);
      }}
      onSave={handleSaveIncome}
      initialData={editingIncome ? {
        name: editingIncome.name,
        category: editingIncome.category || '',
        amount: editingIncome.default_amount
      } : undefined}
    />

    <ExpenseForm
      isOpen={showExpenseForm}
      onClose={() => {
        setShowExpenseForm(false);
        setEditingExpense(null);
      }}
      onSave={handleSaveExpense}
      allowOneTimeExpenses={false}
      showSaveQuestion={true}
      initialData={editingExpense ? {
        name: editingExpense.name,
        category: editingExpense.category || '',
        amount: editingExpense.default_amount,
        isFixed: true,
        columnNumber: editingExpense.column_number || 1
      } : undefined}
    />
    </>
  );
};

export default Catalog;
