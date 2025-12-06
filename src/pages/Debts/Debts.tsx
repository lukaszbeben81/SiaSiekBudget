import React, { useState, useEffect } from 'react';
import { Debt } from '../../types';
import Modal from '../../components/Modal/Modal';
import { formatCurrency, formatDate, clearZeroOnFocus } from '../../utils/helpers';
import './Debts.css';

interface DebtsProps {
  onBack: () => void;
  isAdmin?: boolean;
}

type ViewMode = 'active' | 'history';

const Debts: React.FC<DebtsProps> = ({ onBack, isAdmin = true }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [developerMode, setDeveloperMode] = useState(false);
  
  // Add debt form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDebt, setNewDebt] = useState({
    name: '',
    total_amount: '',
    creditor: '',
    date_incurred: new Date().toISOString().split('T')[0],
    due_date: ''
  });
  
  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    loadDebts();
  }, []);

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string, action?: () => void) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action);
    setModalOpen(true);
  };

  const loadDebts = async () => {
    try {
      const [debtsData, settings] = await Promise.all([
        window.electronAPI.getDebts(),
        window.electronAPI.getSettings()
      ]);
      setDebts(debtsData);
      setDeveloperMode(settings.developer_mode === 1);
    } catch (error) {
      console.error('Error loading debts:', error);
      showModal('error', 'Błąd', 'Nie udało się załadować długów');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async () => {
    if (!newDebt.name || !newDebt.total_amount) {
      showModal('warning', 'Uwaga', 'Wypełnij nazwę i kwotę długu');
      return;
    }

    const amount = parseFloat(newDebt.total_amount);
    if (isNaN(amount) || amount <= 0) {
      showModal('warning', 'Uwaga', 'Wprowadź poprawną kwotę');
      return;
    }

    try {
      await window.electronAPI.createDebt({
        name: newDebt.name,
        total_amount: amount,
        paid_amount: 0,
        creditor: newDebt.creditor || undefined,
        date_incurred: newDebt.date_incurred,
        due_date: newDebt.due_date || undefined
      });
      
      setNewDebt({
        name: '',
        total_amount: '',
        creditor: '',
        date_incurred: new Date().toISOString().split('T')[0],
        due_date: ''
      });
      setShowAddForm(false);
      loadDebts();
      showModal('success', 'Sukces', 'Dług został dodany');
    } catch (error) {
      console.error('Error adding debt:', error);
      showModal('error', 'Błąd', 'Nie udało się dodać długu');
    }
  };

  const handleOpenPayment = (debt: Debt) => {
    const remaining = debt.total_amount - debt.paid_amount;
    setPayingDebt(debt);
    setPaymentAmount(remaining.toFixed(2));
    setShowPaymentForm(true);
  };

  const handleSubmitPayment = async () => {
    if (!payingDebt) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showModal('warning', 'Uwaga', 'Wprowadź poprawną kwotę');
      return;
    }

    const remaining = payingDebt.total_amount - payingDebt.paid_amount;
    if (amount > remaining) {
      showModal('warning', 'Uwaga', `Maksymalna kwota to ${formatCurrency(remaining)}`);
      return;
    }

    try {
      await window.electronAPI.payDebt(payingDebt.id, amount);
      setShowPaymentForm(false);
      setPayingDebt(null);
      setPaymentAmount('');
      loadDebts();
      
      if (amount >= remaining) {
        showModal('success', 'Gratulacje!', 'Dług został w pełni spłacony! 🎉');
      } else {
        showModal('success', 'Sukces', `Zapłacono ${formatCurrency(amount)}`);
      }
    } catch (error) {
      console.error('Error paying debt:', error);
      showModal('error', 'Błąd', 'Nie udało się zapisać płatności');
    }
  };

  const handleDeleteDebt = (debt: Debt) => {
    showModal('warning', 'Potwierdź usunięcie', `Czy na pewno chcesz usunąć dług "${debt.name}"?`, async () => {
      try {
        await window.electronAPI.updateDebt(debt.id, { is_paid: 1 });
        loadDebts();
      } catch (error) {
        console.error('Error deleting debt:', error);
        showModal('error', 'Błąd', 'Nie udało się usunąć długu');
      }
    });
  };

  const handleGenerateTestDebts = async () => {
    const testDebts = [
      {
        name: 'Pożyczka od mamy',
        total_amount: 2000,
        paid_amount: 500,
        creditor: 'Mama',
        date_incurred: '2025-01-15',
        due_date: '2025-12-31'
      },
      {
        name: 'Kredyt na telefon',
        total_amount: 1500,
        paid_amount: 0,
        creditor: 'MediaMarkt',
        date_incurred: '2025-10-01',
        due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15).toISOString().split('T')[0]
      },
      {
        name: 'Pożyczka od znajomego',
        total_amount: 500,
        paid_amount: 0,
        creditor: 'Jan Kowalski',
        date_incurred: '2025-11-20',
        due_date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 14).toISOString().split('T')[0]
      },
      {
        name: 'Ratka za laptop',
        total_amount: 3600,
        paid_amount: 1200,
        creditor: 'Allegro Raty',
        date_incurred: '2025-06-01',
        due_date: '2026-06-01'
      }
    ];

    try {
      const activeDebts = debts.filter(d => d.is_paid === 0);
      const toCreate = Math.min(4 - activeDebts.length, testDebts.length);
      
      if (toCreate <= 0) {
        showModal('info', 'Info', 'Masz już 4 lub więcej aktywnych długów');
        return;
      }

      for (let i = 0; i < toCreate; i++) {
        await window.electronAPI.createDebt(testDebts[i]);
      }
      
      loadDebts();
      showModal('success', 'Sukces', `Wygenerowano ${toCreate} testowych długów`);
    } catch (err) {
      console.error('Error generating test debts:', err);
      showModal('error', 'Błąd', 'Nie udało się wygenerować testowych długów');
    }
  };

  // Filter debts based on view mode
  const activeDebts = debts.filter(d => d.is_paid === 0);
  const paidDebts = debts.filter(d => d.is_paid === 1);
  const displayedDebts = viewMode === 'active' ? activeDebts : paidDebts;

  // Calculate totals
  const totalActiveDebt = activeDebts.reduce((sum, d) => sum + (d.total_amount - d.paid_amount), 0);

  if (loading) {
    return (
      <div className="debts-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="debts-container">
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

      {/* Top Bar */}
      <div className="debts-header">
        <button className="btn-secondary" onClick={onBack}>
          ← Powrót
        </button>
        <h1>💰 Długi</h1>
        
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'active' ? 'active' : ''}`}
            onClick={() => setViewMode('active')}
          >
            Aktywne ({activeDebts.length})
          </button>
          <button
            className={`toggle-btn ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => setViewMode('history')}
          >
            Historia ({paidDebts.length})
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {developerMode && viewMode === 'active' && (
            <button 
              className="btn-secondary" 
              onClick={handleGenerateTestDebts}
              style={{ backgroundColor: '#7c3aed' }}
            >
              🧪 Testowe długi
            </button>
          )}
          {viewMode === 'active' && isAdmin && (
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              + Dodaj dług
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {viewMode === 'active' && activeDebts.length > 0 && (
        <div className="debts-summary">
          <span>Łączne zadłużenie:</span>
          <span className="total-debt text-danger">{formatCurrency(totalActiveDebt)}</span>
        </div>
      )}

      {/* Add Debt Form */}
      {showAddForm && (
        <div className="add-debt-form">
          <h3>Nowy dług</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nazwa długu *</label>
              <input
                type="text"
                value={newDebt.name}
                onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                placeholder="np. Pożyczka od znajomego"
              />
            </div>
            <div className="form-group">
              <label>Kwota *</label>
              <input
                type="number"
                value={newDebt.total_amount}
                onChange={(e) => setNewDebt({ ...newDebt, total_amount: e.target.value })}
                onFocus={clearZeroOnFocus}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Wierzyciel</label>
              <input
                type="text"
                value={newDebt.creditor}
                onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                placeholder="Kto pożyczył"
              />
            </div>
            <div className="form-group">
              <label>Data powstania</label>
              <input
                type="date"
                value={newDebt.date_incurred}
                onChange={(e) => setNewDebt({ ...newDebt, date_incurred: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Termin spłaty</label>
              <input
                type="date"
                value={newDebt.due_date}
                onChange={(e) => setNewDebt({ ...newDebt, due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
              Anuluj
            </button>
            <button className="btn-primary" onClick={handleAddDebt}>
              Dodaj dług
            </button>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && payingDebt && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentForm(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Spłata długu</h3>
            <p className="debt-info">
              <strong>{payingDebt.name}</strong>
              {payingDebt.creditor && <span> (wierzyciel: {payingDebt.creditor})</span>}
            </p>
            <p className="debt-remaining">
              Pozostało do spłaty: <strong className="text-danger">
                {formatCurrency(payingDebt.total_amount - payingDebt.paid_amount)}
              </strong>
            </p>
            <div className="form-group">
              <label>Kwota spłaty</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                onFocus={clearZeroOnFocus}
                step="0.01"
                min="0"
                autoFocus
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowPaymentForm(false)}>
                Anuluj
              </button>
              <button className="btn-success" onClick={handleSubmitPayment}>
                Zapłać
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debts List */}
      <div className="debts-list">
        {displayedDebts.length === 0 ? (
          <div className="empty-state">
            {viewMode === 'active' ? (
              <>
                <h3>🎉 Brak aktywnych długów!</h3>
                <p className="text-secondary">Świetnie! Nie masz żadnych zobowiązań.</p>
              </>
            ) : (
              <>
                <h3>📜 Brak historii</h3>
                <p className="text-secondary">Nie masz jeszcze spłaconych długów.</p>
              </>
            )}
          </div>
        ) : (
          displayedDebts.map((debt) => {
            const remaining = debt.total_amount - debt.paid_amount;
            const progress = (debt.paid_amount / debt.total_amount) * 100;
            const isOverdue = debt.due_date && new Date(debt.due_date) < new Date() && debt.is_paid === 0;
            
            return (
              <div 
                key={debt.id} 
                className={`debt-card ${isOverdue ? 'overdue' : ''} ${debt.is_paid === 1 ? 'paid' : ''}`}
                onClick={() => viewMode === 'active' && isAdmin && handleOpenPayment(debt)}
              >
                <div className="debt-main">
                  <div className="debt-name">
                    <strong>{debt.name}</strong>
                    {debt.creditor && <span className="debt-creditor">od: {debt.creditor}</span>}
                  </div>
                  <div className="debt-dates">
                    <span className="date-incurred">
                      Zaciągnięty: {formatDate(debt.date_incurred)}
                    </span>
                    {debt.due_date && (
                      <span className={`date-due ${isOverdue ? 'text-danger' : ''}`}>
                        Termin: {formatDate(debt.due_date)}
                        {isOverdue && ' ⚠️'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="debt-amounts">
                  <div className="debt-total">
                    <span className="label">Kwota:</span>
                    <span className="value">{formatCurrency(debt.total_amount)}</span>
                  </div>
                  {debt.is_paid === 0 ? (
                    <div className="debt-remaining">
                      <span className="label">Pozostało:</span>
                      <span className="value text-danger">{formatCurrency(remaining)}</span>
                    </div>
                  ) : (
                    <div className="debt-paid-badge">
                      ✅ Spłacony
                    </div>
                  )}
                </div>
                
                {debt.is_paid === 0 && (
                  <div className="debt-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{progress.toFixed(0)}% spłacono</span>
                  </div>
                )}
                
                {viewMode === 'active' && isAdmin && (
                  <div className="debt-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn-success btn-sm"
                      onClick={() => handleOpenPayment(debt)}
                    >
                      💳 Spłać
                    </button>
                    <button 
                      className="btn-danger btn-sm"
                      onClick={() => handleDeleteDebt(debt)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Debts;
