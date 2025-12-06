import React, { useState, useEffect } from 'react';
import { Piggybank as PiggybankType } from '../../types';
import { clearZeroOnFocus } from '../../utils/helpers';
import Modal from '../../components/Modal/Modal';
import './Piggybank.css';

interface PiggybankProps {
  onBack: () => void;
  isAdmin?: boolean;
}

interface PiggybankFormData {
  name: string;
  target_amount: number;
  monthly_amount: number;
  start_date: string;
  end_date: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
}

const Piggybank: React.FC<PiggybankProps> = ({ onBack, isAdmin = true }) => {
  const [piggybanks, setPiggybanks] = useState<PiggybankType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPiggybank, setEditingPiggybank] = useState<PiggybankType | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositPiggybank, setDepositPiggybank] = useState<PiggybankType | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [developerMode, setDeveloperMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<PiggybankFormData>({
    name: '',
    target_amount: 0,
    monthly_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    frequency: 'monthly'
  });
  
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadData();
    loadDeveloperMode();
  }, []);

  const loadDeveloperMode = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      setDeveloperMode(settings.developer_mode === 1);
    } catch (err) {
      console.error('Error loading developer mode:', err);
    }
  };

  const showModal = (type: 'info' | 'success' | 'error' | 'warning', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const loadData = async () => {
    try {
      const data = await window.electronAPI.getPiggybanks();
      setPiggybanks(data || []);
    } catch (err) {
      console.error('Error loading piggybanks:', err);
      showModal('error', 'Błąd', 'Nie udało się załadować skarbonek');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: 0,
      monthly_amount: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      frequency: 'monthly'
    });
    setEditingPiggybank(null);
  };

  const handleOpenForm = (piggybank?: PiggybankType) => {
    if (piggybank) {
      setEditingPiggybank(piggybank);
      setFormData({
        name: piggybank.name,
        target_amount: piggybank.target_amount,
        monthly_amount: piggybank.monthly_amount,
        start_date: piggybank.start_date,
        end_date: piggybank.end_date || '',
        frequency: piggybank.frequency
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showModal('warning', 'Uwaga', 'Podaj nazwę skarbonki');
      return;
    }
    if (formData.monthly_amount <= 0) {
      showModal('warning', 'Uwaga', 'Kwota miesięczna musi być większa od 0');
      return;
    }

    try {
      if (editingPiggybank) {
        await window.electronAPI.updatePiggybank(editingPiggybank.id, {
          name: formData.name,
          target_amount: formData.target_amount,
          monthly_amount: formData.monthly_amount,
          start_date: formData.start_date,
          end_date: formData.end_date || undefined,
          frequency: formData.frequency
        });
        showModal('success', 'Sukces', 'Skarbonka została zaktualizowana');
      } else {
        const result = await window.electronAPI.createPiggybank({
          name: formData.name,
          target_amount: formData.target_amount,
          monthly_amount: formData.monthly_amount,
          start_date: formData.start_date,
          end_date: formData.end_date || undefined,
          frequency: formData.frequency
        });
        
        if (result.success === false) {
          showModal('error', 'Błąd', result.error || 'Nie udało się utworzyć skarbonki');
          return;
        }
        showModal('success', 'Sukces', 'Skarbonka została utworzona');
      }
      handleCloseForm();
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się zapisać skarbonki');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć skarbonkę "${name}"?`)) return;

    try {
      await window.electronAPI.deletePiggybank(id);
      showModal('success', 'Sukces', 'Skarbonka została usunięta');
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się usunąć skarbonki');
    }
  };

  const handleOpenDeposit = (piggybank: PiggybankType) => {
    setDepositPiggybank(piggybank);
    setDepositAmount(piggybank.monthly_amount.toString());
    setShowDepositModal(true);
  };

  const handleDeposit = async () => {
    if (!depositPiggybank) return;
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showModal('warning', 'Uwaga', 'Podaj prawidłową kwotę');
      return;
    }

    try {
      await window.electronAPI.depositToPiggybank(depositPiggybank.id, amount);
      showModal('success', 'Sukces', `Wpłacono ${amount.toFixed(2)} PLN do skarbonki "${depositPiggybank.name}"`);
      setShowDepositModal(false);
      setDepositPiggybank(null);
      setDepositAmount('');
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się wpłacić do skarbonki');
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Co miesiąc';
      case 'quarterly': return 'Co kwartał';
      case 'yearly': return 'Co rok';
      default: return frequency;
    }
  };

  const getProgress = (piggybank: PiggybankType) => {
    if (!piggybank.target_amount || piggybank.target_amount === 0) return 0;
    return Math.min(100, (piggybank.current_amount / piggybank.target_amount) * 100);
  };

  const fillTestData = () => {
    const testNames = ['Wakacje', 'Samochód', 'Remont', 'Fundusz awaryjny', 'Prezenty'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomMonthly = Math.floor(Math.random() * 900 + 100);
    const randomTarget = randomMonthly * Math.floor(Math.random() * 12 + 6);
    
    setFormData({
      name: randomName,
      target_amount: randomTarget,
      monthly_amount: randomMonthly,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      frequency: 'monthly'
    });
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <div className="piggybank-container">
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          type={modalType}
        >
          <p>{modalMessage}</p>
        </Modal>

        <div className="piggybank-header">
          <button className="btn-secondary" onClick={onBack}>
            ← Powrót
          </button>
          <h1>🐷 Skarbonki</h1>
        </div>

        <div className="piggybank-content">
          <div className="piggybank-controls">
            <div className="piggybank-info">
              <span className="piggybank-count">
                Aktywne skarbonki: {piggybanks.length}/10
              </span>
            </div>
            
            {isAdmin && (
              <button 
                className="btn-primary"
                onClick={() => handleOpenForm()}
                disabled={piggybanks.length >= 10}
                title={piggybanks.length >= 10 ? 'Osiągnięto maksymalną liczbę skarbonek' : 'Dodaj nową skarbonkę'}
              >
                + Nowa skarbonka
              </button>
            )}
          </div>

          <div className="piggybank-list">
            {piggybanks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🐷</div>
                <p>Nie masz jeszcze żadnych skarbonek</p>
                <p className="text-secondary">Utwórz pierwszą skarbonkę, aby zacząć oszczędzać!</p>
              </div>
            ) : (
              piggybanks.map((piggybank) => (
                <div key={piggybank.id} className="piggybank-card">
                  <div className="piggybank-card-header">
                    <div className="piggybank-name">
                      <span className="piggybank-icon">🐷</span>
                      <strong>{piggybank.name}</strong>
                    </div>
                    <div className="piggybank-frequency">
                      {getFrequencyLabel(piggybank.frequency)}
                    </div>
                  </div>
                  
                  <div className="piggybank-amounts">
                    <div className="amount-row">
                      <span className="amount-label">Odkładane:</span>
                      <span className="amount-value text-primary">
                        {piggybank.monthly_amount.toFixed(2)} PLN
                      </span>
                    </div>
                    <div className="amount-row">
                      <span className="amount-label">Zebrano:</span>
                      <span className="amount-value text-success">
                        {(piggybank.current_amount || 0).toFixed(2)} PLN
                      </span>
                    </div>
                    {piggybank.target_amount > 0 && (
                      <div className="amount-row">
                        <span className="amount-label">Cel:</span>
                        <span className="amount-value">
                          {piggybank.target_amount.toFixed(2)} PLN
                        </span>
                      </div>
                    )}
                  </div>

                  {piggybank.target_amount > 0 && (
                    <div className="piggybank-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${getProgress(piggybank)}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {getProgress(piggybank).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <div className="piggybank-dates">
                    <span>Od: {new Date(piggybank.start_date).toLocaleDateString('pl-PL')}</span>
                    {piggybank.end_date && (
                      <span>Do: {new Date(piggybank.end_date).toLocaleDateString('pl-PL')}</span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="piggybank-actions">
                      <button
                        className="btn-success btn-sm"
                        onClick={() => handleOpenDeposit(piggybank)}
                      >
                        💰 Wpłać
                      </button>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleOpenForm(piggybank)}
                      >
                        Modyfikuj
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(piggybank.id, piggybank.name)}
                      >
                        Usuń
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="piggybank-modal-overlay" onClick={handleCloseForm}>
          <div className="piggybank-modal-content" onClick={e => e.stopPropagation()}>
            <div className="piggybank-modal-header">
              <h2>{editingPiggybank ? 'Edytuj skarbonkę' : 'Nowa skarbonka'}</h2>
              {developerMode && !editingPiggybank && (
                <button 
                  className="btn-secondary btn-xs" 
                  onClick={fillTestData}
                  style={{ marginRight: 'auto', marginLeft: '1rem' }}
                >
                  🧪 Test
                </button>
              )}
              <button className="piggybank-modal-close" onClick={handleCloseForm}>×</button>
            </div>
            
            <div className="piggybank-modal-body">
              <div className="form-group">
                <label>Nazwa skarbonki *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. Wakacje, Samochód, Remont..."
                  maxLength={50}
                  autoComplete="off"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kwota odkładana *</label>
                  <input
                    type="number"
                    value={formData.monthly_amount || ''}
                    onChange={(e) => setFormData({ ...formData, monthly_amount: parseFloat(e.target.value) || 0 })}
                    onFocus={clearZeroOnFocus}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Częstotliwość</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'monthly' | 'quarterly' | 'yearly' })}
                  >
                    <option value="monthly">Co miesiąc</option>
                    <option value="quarterly">Co kwartał</option>
                    <option value="yearly">Co rok</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Cel (opcjonalnie)</label>
                <input
                  type="number"
                  value={formData.target_amount || ''}
                  onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                  onFocus={clearZeroOnFocus}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <small className="form-hint">Pozostaw 0 jeśli nie masz określonego celu</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data rozpoczęcia *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Data zakończenia (opcjonalnie)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="piggybank-modal-footer">
              <button className="btn-secondary" onClick={handleCloseForm}>
                Anuluj
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingPiggybank ? 'Zapisz zmiany' : 'Utwórz skarbonkę'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && depositPiggybank && (
        <div className="piggybank-modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="piggybank-modal-content deposit-modal" onClick={e => e.stopPropagation()}>
            <div className="piggybank-modal-header">
              <h2>Wpłata do skarbonki</h2>
              <button className="piggybank-modal-close" onClick={() => setShowDepositModal(false)}>×</button>
            </div>
            
            <div className="piggybank-modal-body">
              <p className="deposit-info">
                Wpłata do skarbonki: <strong>{depositPiggybank.name}</strong>
              </p>
              <p className="deposit-current">
                Aktualne saldo: <strong className="text-success">{(depositPiggybank.current_amount || 0).toFixed(2)} PLN</strong>
              </p>
              
              <div className="form-group">
                <label>Kwota wpłaty</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  onFocus={clearZeroOnFocus}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
            </div>

            <div className="piggybank-modal-footer">
              <button className="btn-secondary" onClick={() => setShowDepositModal(false)}>
                Anuluj
              </button>
              <button className="btn-success" onClick={handleDeposit}>
                💰 Wpłać
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Piggybank;
