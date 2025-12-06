import React, { useState } from 'react';
import { clearZeroOnFocus } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import './FirstRun.css';

interface FirstRunProps {
  onComplete: () => void;
}

const FirstRun: React.FC<FirstRunProps> = ({ onComplete }) => {
  const { appName } = useAuth();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [billingDay, setBillingDay] = useState(1);
  const [savingsPercentage, setSavingsPercentage] = useState(10);
  const [weeklyGroceries, setWeeklyGroceries] = useState(500);
  const [dailyExpenses, setDailyExpenses] = useState(100);
  const [error, setError] = useState('');

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('Creating admin user:', username);

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków');
      return;
    }

    try {
      console.log('Calling createAdminUser...');
      const result = await window.electronAPI.createAdminUser(username, password);
      console.log('Admin user created:', result);
      setStep(2);
    } catch (err) {
      console.error('Error creating admin user:', err);
      setError('Nie udało się utworzyć użytkownika');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('Saving settings...');
      await window.electronAPI.updateSettings({
        billing_day: billingDay,
        savings_percentage: savingsPercentage,
        weekly_groceries: weeklyGroceries,
        daily_expenses: dailyExpenses,
        password_enabled: 1
      });
      console.log('Settings saved successfully');
      onComplete();
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Nie udało się zapisać ustawień');
    }
  };

  return (
    <div className="first-run-container">
      <div className="first-run-card fade-in">
        <h1 className="text-center mb-4">Witaj w {appName}</h1>
        
        {step === 1 && (
          <div className="first-run-step">
            <h2 className="text-center mb-3">Krok 1: Utwórz konto administratora</h2>
            <p className="text-center text-secondary mb-4">
              Administrator może zarządzać wszystkimi funkcjami aplikacji
            </p>

            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label>Nazwa użytkownika</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Wprowadź nazwę użytkownika"
                />
              </div>

              <div className="form-group">
                <label>Hasło</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 znaków"
                />
              </div>

              <div className="form-group">
                <label>Potwierdź hasło</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Wprowadź hasło ponownie"
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Dalej
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="first-run-step">
            <h2 className="text-center mb-3">Krok 2: Ustawienia podstawowe</h2>
            <p className="text-center text-secondary mb-4">
              Skonfiguruj domyślne parametry budżetu
            </p>

            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label>Dzień rozliczeniowy miesiąca</label>
                <select
                  value={billingDay}
                  onChange={(e) => setBillingDay(Number(e.target.value))}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                  <option value={29}>Ostatni dzień miesiąca</option>
                </select>
                <small className="text-muted">
                  Okres rozliczeniowy rozpoczyna się w tym dniu
                </small>
              </div>

              <div className="form-group">
                <label>Procent dochodu na oszczędności (%)</label>
                <input
                  type="number"
                  value={savingsPercentage}
                  onChange={(e) => setSavingsPercentage(Number(e.target.value))}
                  onFocus={clearZeroOnFocus}
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>

              <div className="form-group">
                <label>Tygodniowe duże zakupy (PLN)</label>
                <input
                  type="number"
                  value={weeklyGroceries}
                  onChange={(e) => setWeeklyGroceries(Number(e.target.value))}
                  onFocus={clearZeroOnFocus}
                  min="0"
                  step="10"
                />
                <small className="text-muted">
                  Kwota planowana na sobotnie zakupy spożywcze
                </small>
              </div>

              <div className="form-group">
                <label>Dzienne wydatki drobne (PLN)</label>
                <input
                  type="number"
                  value={dailyExpenses}
                  onChange={(e) => setDailyExpenses(Number(e.target.value))}
                  onFocus={clearZeroOnFocus}
                  min="0"
                  step="5"
                />
                <small className="text-muted">
                  Kwota na codzienne drobne wydatki
                </small>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="flex" style={{ gap: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setStep(1)}
                >
                  Wstecz
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Zakończ konfigurację
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirstRun;
