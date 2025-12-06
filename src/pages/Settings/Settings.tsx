import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { clearZeroOnFocus } from '../../utils/helpers';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import UserManual from '../../components/UserManual/UserManual';
import './Settings.css';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { user: currentUser, refreshAppName } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Security settings
  const [passwordEnabled, setPasswordEnabled] = useState(1);
  const [rememberUser, setRememberUser] = useState(0);

  // Form state
  const [billingDay, setBillingDay] = useState(1);
  const [savingsPercentage, setSavingsPercentage] = useState(10);
  const [weeklyGroceries, setWeeklyGroceries] = useState(500);
  const [dailyExpenses, setDailyExpenses] = useState(100);
  const [developerMode, setDeveloperMode] = useState(0);
  const [appName, setAppName] = useState('SiaSiek Budget');

  // Original values for change detection
  const [originalSettings, setOriginalSettings] = useState({
    billingDay: 1,
    savingsPercentage: 10,
    weeklyGroceries: 500,
    dailyExpenses: 100,
    developerMode: 0,
    appName: 'SiaSiek Budget',
    passwordEnabled: 1,
    rememberUser: 0,
    column1Categories: ['Mieszkanie', 'Media'],
    column2Categories: ['Transport', 'Żywność'],
    column3Categories: ['Rozrywka', 'Zdrowie', 'Inne']
  });

  // Available categories for column organization
  const [allCategories] = useState<string[]>([
    'Mieszkanie', 'Media', 'Transport', 'Żywność', 'Rozrywka', 'Zdrowie', 'Inne',
    'Skarbonka', 'Spłata długu', 'Rata', 'Ubezpieczenia', 'Edukacja', 'Subskrypcje'
  ]);

  // Columns configuration - now stores arrays of categories
  const [column1Categories, setColumn1Categories] = useState<string[]>(['Mieszkanie', 'Media']);
  const [column2Categories, setColumn2Categories] = useState<string[]>(['Transport', 'Żywność']);
  const [column3Categories, setColumn3Categories] = useState<string[]>(['Rozrywka', 'Zdrowie', 'Inne']);

  // New user form
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  // Edit user form
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');

  // Database cleanup options
  const [cleanupExpenseNames, setCleanupExpenseNames] = useState(false);
  const [cleanupIncomeNames, setCleanupIncomeNames] = useState(false);
  const [cleanupDebtHistory, setCleanupDebtHistory] = useState(false);
  const [cleanupPiggybanks, setCleanupPiggybanks] = useState(false);
  const [selectedMonthsToDelete, setSelectedMonthsToDelete] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<{id: number; name: string; start_date: string}[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [expandedYears, setExpandedYears] = useState<number[]>([]);

  // Backup options
  const [backupSettings, setBackupSettings] = useState(true);
  const [backupUsers, setBackupUsers] = useState(true);
  const [backupMonths, setBackupMonths] = useState(true);
  const [backupDebts, setBackupDebts] = useState(true);
  const [backupFixedExpenses, setBackupFixedExpenses] = useState(true);
  const [backupFixedIncomes, setBackupFixedIncomes] = useState(true);
  const [backupPiggybanks, setBackupPiggybanks] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Restore options
  const [loadedBackup, setLoadedBackup] = useState<any>(null);
  const [restoreSettings, setRestoreSettings] = useState(true);
  const [restoreUsers, setRestoreUsers] = useState(true);
  const [restoreMonths, setRestoreMonths] = useState(true);
  const [restoreDebts, setRestoreDebts] = useState(true);
  const [restoreFixedExpenses, setRestoreFixedExpenses] = useState(true);
  const [restoreFixedIncomes, setRestoreFixedIncomes] = useState(true);
  const [restorePiggybanks, setRestorePiggybanks] = useState(true);
  // replaceExisting is always true - restore always replaces existing data
  const replaceExisting = true;
  const [isRestoring, setIsRestoring] = useState(false);

  // Confirmation modal for backup/restore
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);

  // User manual
  const [manualOpen, setManualOpen] = useState(false);

  // App updates
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [updateInfo, setUpdateInfo] = useState<{hasUpdate: boolean; latestVersion?: string; releaseUrl?: string} | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const handleCreateBackup = async () => {
    const anySelected = backupSettings || backupUsers || backupMonths || 
                        backupDebts || backupFixedExpenses || backupFixedIncomes || backupPiggybanks;
    
    if (!anySelected) {
      showModal('warning', 'Uwaga', 'Wybierz przynajmniej jedną opcję do backupu');
      return;
    }

    // Build summary message
    const selectedItems: string[] = [];
    if (backupSettings) selectedItems.push('✓ Ustawienia aplikacji');
    if (backupUsers) selectedItems.push('✓ Użytkownicy i hasła');
    if (backupMonths) selectedItems.push('✓ Miesiące (wraz z dochodami i wydatkami)');
    if (backupDebts) selectedItems.push('✓ Długi i historia płatności');
    if (backupFixedExpenses) selectedItems.push('✓ Katalog stałych wydatków');
    if (backupFixedIncomes) selectedItems.push('✓ Katalog stałych dochodów');
    if (backupPiggybanks) selectedItems.push('✓ Skarbonki');

    const summaryMessage = `Zostanie utworzona kopia zapasowa zawierająca:\n\n${selectedItems.join('\n')}\n\nCzy chcesz kontynuować?`;

    setConfirmModalTitle('📦 Potwierdzenie tworzenia kopii zapasowej');
    setConfirmModalMessage(summaryMessage);
    setConfirmModalAction(() => executeCreateBackup);
    setConfirmModalOpen(true);
  };

  const executeCreateBackup = async () => {
    setConfirmModalOpen(false);
    setIsCreatingBackup(true);
    try {
      const backup = await window.electronAPI.createBackup({
        settings: backupSettings,
        users: backupUsers,
        months: backupMonths,
        incomes: backupMonths, // Include incomes if months selected
        expenses: backupMonths, // Include expenses if months selected
        debts: backupDebts,
        fixedExpenses: backupFixedExpenses,
        fixedIncomes: backupFixedIncomes,
        piggybanks: backupPiggybanks
      });

      const result = await window.electronAPI.saveBackupDialog(backup);
      
      if (result.success) {
        showModal('success', 'Sukces', `Kopia zapasowa została zapisana:\n${result.path}`);
      }
    } catch (err) {
      console.error('Backup error:', err);
      showModal('error', 'Błąd', 'Nie udało się utworzyć kopii zapasowej');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleLoadBackup = async () => {
    try {
      const result = await window.electronAPI.openBackupDialog();
      
      if (result.success && result.backup) {
        setLoadedBackup(result.backup);
        
        // Build detailed summary of what's in the backup
        const backup = result.backup;
        const summaryItems: string[] = [];
        
        if (backup.data.settings) {
          summaryItems.push('✓ Ustawienia aplikacji');
        }
        if (backup.data.users && backup.data.users.length > 0) {
          summaryItems.push(`✓ Użytkownicy: ${backup.data.users.length}`);
        }
        if (backup.data.months && backup.data.months.length > 0) {
          summaryItems.push(`✓ Miesiące: ${backup.data.months.length}`);
        }
        if (backup.data.incomes && backup.data.incomes.length > 0) {
          summaryItems.push(`✓ Przychody: ${backup.data.incomes.length}`);
        }
        if (backup.data.expenses && backup.data.expenses.length > 0) {
          summaryItems.push(`✓ Wydatki: ${backup.data.expenses.length}`);
        }
        if (backup.data.debts && backup.data.debts.length > 0) {
          summaryItems.push(`✓ Długi: ${backup.data.debts.length}`);
        }
        if (backup.data.fixed_expenses_catalog && backup.data.fixed_expenses_catalog.length > 0) {
          summaryItems.push(`✓ Katalog wydatków: ${backup.data.fixed_expenses_catalog.length}`);
        }
        if (backup.data.fixed_incomes_catalog && backup.data.fixed_incomes_catalog.length > 0) {
          summaryItems.push(`✓ Katalog przychodów: ${backup.data.fixed_incomes_catalog.length}`);
        }
        if (backup.data.piggybanks && backup.data.piggybanks.length > 0) {
          summaryItems.push(`✓ Skarbonki: ${backup.data.piggybanks.length}`);
        }
        
        const dateStr = new Date(backup.created_at).toLocaleString('pl-PL');
        const summaryMessage = `📅 Data utworzenia: ${dateStr}\n\n📦 Zawartość kopii zapasowej:\n${summaryItems.join('\n')}\n\n⚠️ UWAGA: Przywrócenie kopii zapasowej ZASTĄPI dotychczasowe dane w wybranych kategoriach!`;
        
        showModal('info', '📁 Plik wczytany', summaryMessage);
      } else if (result.error) {
        showModal('error', 'Błąd', result.error);
      }
    } catch (err) {
      console.error('Load backup error:', err);
      showModal('error', 'Błąd', 'Nie udało się wczytać pliku');
    }
  };

  const handleRestoreBackup = async () => {
    console.log('handleRestoreBackup called');
    if (!loadedBackup) {
      showModal('warning', 'Uwaga', 'Najpierw wczytaj plik kopii zapasowej');
      return;
    }

    const anySelected = restoreSettings || restoreUsers || restoreMonths || 
                        restoreDebts || restoreFixedExpenses || restoreFixedIncomes || restorePiggybanks;
    
    if (!anySelected) {
      showModal('warning', 'Uwaga', 'Wybierz przynajmniej jedną opcję do przywrócenia');
      return;
    }
    
    console.log('Opening confirmation modal for restore');

    // Build detailed summary from backup content
    const selectedItems: string[] = [];
    if (restoreSettings && loadedBackup.data.settings) {
      selectedItems.push('✓ Ustawienia aplikacji');
    }
    if (restoreUsers && loadedBackup.data.users) {
      selectedItems.push(`✓ Użytkownicy: ${loadedBackup.data.users.length} rekordów`);
    }
    if (restoreMonths) {
      if (loadedBackup.data.months) {
        selectedItems.push(`✓ Miesiące: ${loadedBackup.data.months.length} rekordów`);
      }
      if (loadedBackup.data.incomes) {
        selectedItems.push(`✓ Przychody: ${loadedBackup.data.incomes.length} rekordów`);
      }
      if (loadedBackup.data.expenses) {
        selectedItems.push(`✓ Wydatki: ${loadedBackup.data.expenses.length} rekordów`);
      }
    }
    if (restoreDebts && loadedBackup.data.debts) {
      selectedItems.push(`✓ Długi: ${loadedBackup.data.debts.length} rekordów`);
    }
    if (restoreFixedExpenses && loadedBackup.data.fixed_expenses_catalog) {
      selectedItems.push(`✓ Stałe wydatki: ${loadedBackup.data.fixed_expenses_catalog.length} rekordów`);
    }
    if (restoreFixedIncomes && loadedBackup.data.fixed_incomes_catalog) {
      selectedItems.push(`✓ Stałe przychody: ${loadedBackup.data.fixed_incomes_catalog.length} rekordów`);
    }
    if (restorePiggybanks && loadedBackup.data.piggybanks) {
      selectedItems.push(`✓ Skarbonki: ${loadedBackup.data.piggybanks.length} rekordów`);
    }

    const warningText = '\n\n⚠️ UWAGA: Wszystkie dotychczasowe dane w wybranych kategoriach zostaną USUNIĘTE i zastąpione danymi z kopii zapasowej!\nTa operacja jest nieodwracalna!';

    const summaryMessage = `Z kopii zapasowej zostaną przywrócone:\n\n${selectedItems.join('\n')}${warningText}\n\nCzy chcesz kontynuować?`;

    setConfirmModalTitle('📥 Potwierdzenie przywracania kopii zapasowej');
    setConfirmModalMessage(summaryMessage);
    setConfirmModalAction(() => executeRestoreBackup);
    setConfirmModalOpen(true);
  };

  const executeRestoreBackup = async () => {
    setConfirmModalOpen(false);
    if (!loadedBackup) return;

    setIsRestoring(true);
    try {
      const result = await window.electronAPI.restoreBackup(loadedBackup, {
        settings: restoreSettings,
        users: restoreUsers,
        months: restoreMonths,
        debts: restoreDebts,
        fixedExpenses: restoreFixedExpenses,
        fixedIncomes: restoreFixedIncomes,
        piggybanks: restorePiggybanks,
        replaceExisting
      });

      const messages: string[] = [];
      if (result.settings) messages.push('Ustawienia: przywrócone');
      if (result.users > 0) messages.push(`Użytkownicy: ${result.users}`);
      if (result.months > 0) messages.push(`Miesiące: ${result.months}`);
      if (result.incomes > 0) messages.push(`Przychody: ${result.incomes}`);
      if (result.expenses > 0) messages.push(`Wydatki: ${result.expenses}`);
      if (result.debts > 0) messages.push(`Długi: ${result.debts}`);
      if (result.fixedExpenses > 0) messages.push(`Stałe wydatki: ${result.fixedExpenses}`);
      if (result.fixedIncomes > 0) messages.push(`Stałe przychody: ${result.fixedIncomes}`);
      if (result.piggybanks > 0) messages.push(`Skarbonki: ${result.piggybanks}`);

      showModal('success', 'Przywrócono', messages.length > 0 
        ? `Przywrócono dane:\n${messages.join('\n')}`
        : 'Brak danych do przywrócenia w wybranych opcjach');
      
      setLoadedBackup(null);
      loadData();
    } catch (err) {
      console.error('Restore error:', err);
      showModal('error', 'Błąd', 'Nie udało się przywrócić danych z kopii zapasowej');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCleanupDatabase = async () => {
    const anySelected = cleanupExpenseNames || cleanupIncomeNames || cleanupDebtHistory || 
                        cleanupPiggybanks || selectedMonthsToDelete.length > 0;
    
    if (!anySelected) {
      showModal('warning', 'Uwaga', 'Wybierz przynajmniej jedną opcję do wyczyszczenia');
      return;
    }

    if (!confirm('⚠️ UWAGA! Ta operacja jest nieodwracalna! Czy na pewno chcesz wyczyścić wybrane dane?')) {
      return;
    }

    setIsCleaningUp(true);
    try {
      const results = await window.electronAPI.cleanupDatabase({
        expenseNames: cleanupExpenseNames,
        incomeNames: cleanupIncomeNames,
        selectedMonths: selectedMonthsToDelete.length > 0 ? selectedMonthsToDelete : undefined,
        debtHistory: cleanupDebtHistory,
        piggybanks: cleanupPiggybanks
      });

      const messages: string[] = [];
      if (results.expenseNames > 0) messages.push(`Nazwy wydatków: ${results.expenseNames}`);
      if (results.incomeNames > 0) messages.push(`Nazwy przychodów: ${results.incomeNames}`);
      if (results.selectedMonths > 0) messages.push(`Miesiące: ${results.selectedMonths}`);
      if (results.debtHistory > 0) messages.push(`Długi: ${results.debtHistory}`);
      if (results.piggybanks > 0) messages.push(`Skarbonki: ${results.piggybanks}`);
      
      showModal('success', 'Baza wyczyszczona', messages.length > 0 ? `Usunięto:\n${messages.join('\n')}` : 'Brak danych do usunięcia');
      
      // Reset selections
      setCleanupExpenseNames(false);
      setCleanupIncomeNames(false);
      setCleanupDebtHistory(false);
      setCleanupPiggybanks(false);
      setSelectedMonthsToDelete([]);
      
      // Reload data
      loadData();
      loadAvailableMonths();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się wyczyścić bazy danych');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const loadAvailableMonths = async () => {
    try {
      const months = await window.electronAPI.getMonths();
      setAvailableMonths(months.map(m => ({ id: m.id, name: m.name, start_date: m.start_date })));
    } catch (err) {
      console.error('Failed to load months for cleanup:', err);
    }
  };

  const toggleMonthSelection = (monthId: number) => {
    setSelectedMonthsToDelete(prev => 
      prev.includes(monthId) 
        ? prev.filter(id => id !== monthId)
        : [...prev, monthId]
    );
  };

  const selectAllMonths = () => {
    setSelectedMonthsToDelete(availableMonths.map(m => m.id));
  };

  const deselectAllMonths = () => {
    setSelectedMonthsToDelete([]);
  };

  // Group months by year
  const getMonthsByYear = () => {
    const grouped: Record<number, typeof availableMonths> = {};
    availableMonths.forEach(month => {
      const year = new Date(month.start_date).getFullYear();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(month);
    });
    // Sort years descending (newest first)
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, months]) => ({
        year: Number(year),
        months: months.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      }));
  };

  const toggleYearExpanded = (year: number) => {
    setExpandedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const selectYearMonths = (year: number) => {
    const yearMonths = availableMonths.filter(m => 
      new Date(m.start_date).getFullYear() === year
    );
    const yearMonthIds = yearMonths.map(m => m.id);
    const allSelected = yearMonthIds.every(id => selectedMonthsToDelete.includes(id));
    
    if (allSelected) {
      // Deselect all from this year
      setSelectedMonthsToDelete(prev => prev.filter(id => !yearMonthIds.includes(id)));
    } else {
      // Select all from this year
      setSelectedMonthsToDelete(prev => [...new Set([...prev, ...yearMonthIds])]);
    }
  };

  const isYearFullySelected = (year: number) => {
    const yearMonthIds = availableMonths
      .filter(m => new Date(m.start_date).getFullYear() === year)
      .map(m => m.id);
    return yearMonthIds.length > 0 && yearMonthIds.every(id => selectedMonthsToDelete.includes(id));
  };

  const isYearPartiallySelected = (year: number) => {
    const yearMonthIds = availableMonths
      .filter(m => new Date(m.start_date).getFullYear() === year)
      .map(m => m.id);
    const selectedCount = yearMonthIds.filter(id => selectedMonthsToDelete.includes(id)).length;
    return selectedCount > 0 && selectedCount < yearMonthIds.length;
  };

  const getYearSelectedCount = (year: number) => {
    const yearMonthIds = availableMonths
      .filter(m => new Date(m.start_date).getFullYear() === year)
      .map(m => m.id);
    return yearMonthIds.filter(id => selectedMonthsToDelete.includes(id)).length;
  };

  useEffect(() => {
    loadData();
    loadAvailableMonths();
    loadAppVersion();
  }, []);

  const loadAppVersion = async () => {
    try {
      const version = await window.electronAPI.getVersion();
      setAppVersion(version);
    } catch (error) {
      console.error('Error loading app version:', error);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.success) {
        setUpdateInfo({
          hasUpdate: result.hasUpdate || false,
          latestVersion: result.latestVersion,
          releaseUrl: result.releaseUrl
        });
        if (result.hasUpdate) {
          showModal('info', '🎉 Dostępna aktualizacja!', 
            `Nowa wersja ${result.latestVersion} jest dostępna!\n\nTwoja wersja: ${result.currentVersion}\n\nOdwiedź stronę GitHub aby pobrać aktualizację.`);
        } else {
          showModal('success', '✅ Brak aktualizacji', 
            `Masz najnowszą wersję aplikacji (${result.currentVersion}).`);
        }
      } else {
        showModal('warning', 'Błąd sprawdzania', 
          `Nie udało się sprawdzić aktualizacji: ${result.error || 'Nieznany błąd'}`);
      }
    } catch (error) {
      showModal('error', 'Błąd', 'Nie udało się połączyć z serwerem aktualizacji.');
    } finally {
      setCheckingUpdates(false);
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
      const [settingsData, usersData] = await Promise.all([
        window.electronAPI.getSettings(),
        window.electronAPI.getUsers()
      ]);

      setUsers(usersData);

      setBillingDay(settingsData.billing_day);
      setSavingsPercentage(settingsData.savings_percentage);
      setWeeklyGroceries(settingsData.weekly_groceries);
      setDailyExpenses(settingsData.daily_expenses);
      setPasswordEnabled(settingsData.password_enabled);
      setRememberUser(settingsData.remember_user);
      setDeveloperMode(settingsData.developer_mode || 0);
      setAppName(settingsData.app_name || 'SiaSiek Budget');
      
      // Load columns - parse comma-separated strings to arrays
      const col1 = (settingsData.column1_categories || 'Mieszkanie,Media').split(',').map((c: string) => c.trim());
      const col2 = (settingsData.column2_categories || 'Transport,Żywność').split(',').map((c: string) => c.trim());
      const col3 = (settingsData.column3_categories || 'Rozrywka,Zdrowie,Inne').split(',').map((c: string) => c.trim());
      
      setColumn1Categories(col1);
      setColumn2Categories(col2);
      setColumn3Categories(col3);
      
      // Store original values for change detection
      setOriginalSettings({
        billingDay: settingsData.billing_day,
        savingsPercentage: settingsData.savings_percentage,
        weeklyGroceries: settingsData.weekly_groceries,
        dailyExpenses: settingsData.daily_expenses,
        developerMode: settingsData.developer_mode || 0,
        appName: settingsData.app_name || 'SiaSiek Budget',
        passwordEnabled: settingsData.password_enabled,
        rememberUser: settingsData.remember_user,
        column1Categories: col1,
        column2Categories: col2,
        column3Categories: col3
      });
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się załadować ustawień');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  // Check if any settings have changed
  const hasChanges = () => {
    if (billingDay !== originalSettings.billingDay) return true;
    if (savingsPercentage !== originalSettings.savingsPercentage) return true;
    if (weeklyGroceries !== originalSettings.weeklyGroceries) return true;
    if (dailyExpenses !== originalSettings.dailyExpenses) return true;
    if (developerMode !== originalSettings.developerMode) return true;
    if (appName !== originalSettings.appName) return true;
    if (passwordEnabled !== originalSettings.passwordEnabled) return true;
    if (rememberUser !== originalSettings.rememberUser) return true;
    if (JSON.stringify(column1Categories) !== JSON.stringify(originalSettings.column1Categories)) return true;
    if (JSON.stringify(column2Categories) !== JSON.stringify(originalSettings.column2Categories)) return true;
    if (JSON.stringify(column3Categories) !== JSON.stringify(originalSettings.column3Categories)) return true;
    return false;
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      showModal('error', 'Brak uprawnień', 'Tylko administrator może zmieniać ustawienia');
      return;
    }

    try {
      await window.electronAPI.updateSettings({
        billing_day: billingDay,
        savings_percentage: savingsPercentage,
        weekly_groceries: weeklyGroceries,
        daily_expenses: dailyExpenses,
        password_enabled: passwordEnabled,
        remember_user: rememberUser,
        developer_mode: developerMode,
        app_name: appName,
        column1_name: column1Categories.join(', '),
        column1_categories: column1Categories.join(','),
        column2_name: column2Categories.join(', '),
        column2_categories: column2Categories.join(','),
        column3_name: column3Categories.join(', '),
        column3_categories: column3Categories.join(',')
      });
      
      // Update original settings after successful save
      setOriginalSettings({
        billingDay,
        savingsPercentage,
        weeklyGroceries,
        dailyExpenses,
        developerMode,
        appName,
        passwordEnabled,
        rememberUser,
        column1Categories: [...column1Categories],
        column2Categories: [...column2Categories],
        column3Categories: [...column3Categories]
      });
      
      // Refresh app name in AuthContext
      await refreshAppName();
      
      showModal('success', 'Sukces', 'Ustawienia zostały zapisane');
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się zapisać ustawień');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showModal('error', 'Nieprawidłowe hasło', 'Hasło musi mieć minimum 6 znaków');
      return;
    }

    try {
      await window.electronAPI.createUser({
        username: newUsername,
        password: newPassword,
        role: newRole
      });
      showModal('success', 'Sukces', 'Użytkownik został utworzony');
      setShowUserForm(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się utworzyć użytkownika');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditPassword('');
    setEditRole(user.role);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      showModal('error', 'Brak uprawnień', 'Tylko administrator może edytować użytkowników');
      return;
    }

    if (editPassword && editPassword.length < 6) {
      showModal('error', 'Nieprawidłowe hasło', 'Hasło musi mieć minimum 6 znaków');
      return;
    }

    try {
      const updateData: any = {
        username: editUsername,
        role: editRole
      };

      if (editPassword) {
        updateData.password = editPassword;
      }

      await window.electronAPI.updateUser(editingUserId!, updateData);
      showModal('success', 'Sukces', 'Użytkownik został zaktualizowany');
      setEditingUserId(null);
      setEditUsername('');
      setEditPassword('');
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się zaktualizować użytkownika');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!isAdmin) {
      showModal('error', 'Brak uprawnień', 'Tylko administrator może usuwać użytkowników');
      return;
    }

    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      return;
    }

    try {
      await window.electronAPI.deleteUser(userId);
      showModal('success', 'Sukces', 'Użytkownik został usunięty');
      loadData();
    } catch (err) {
      showModal('error', 'Błąd', 'Nie udało się usunąć użytkownika');
    }
  };

  const handleRevealPassword = (username: string) => {
    showModal('info', 'Hasło użytkownika', `Funkcja podglądu hasła dla użytkownika "${username}" będzie dostępna po implementacji bezpiecznego mechanizmu w bazie danych. Obecnie hasła są zahashowane i nie można ich odszyfrować.`);
  };

  // Column management functions
  const getAvailableCategories = () => {
    const usedCategories = [...column1Categories, ...column2Categories, ...column3Categories];
    return allCategories.filter(cat => !usedCategories.includes(cat));
  };

  const addCategoryToColumn = (columnNumber: 1 | 2 | 3, category: string) => {
    if (columnNumber === 1) {
      setColumn1Categories([...column1Categories, category]);
    } else if (columnNumber === 2) {
      setColumn2Categories([...column2Categories, category]);
    } else {
      setColumn3Categories([...column3Categories, category]);
    }
  };

  const removeCategoryFromColumn = (columnNumber: 1 | 2 | 3, category: string) => {
    if (columnNumber === 1) {
      setColumn1Categories(column1Categories.filter(c => c !== category));
    } else if (columnNumber === 2) {
      setColumn2Categories(column2Categories.filter(c => c !== category));
    } else {
      setColumn3Categories(column3Categories.filter(c => c !== category));
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
    <div className="settings-container">
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
      >
        <p>{modalMessage}</p>
      </Modal>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          if (confirmModalAction) {
            confirmModalAction();
          }
        }}
        title={confirmModalTitle}
        message={confirmModalMessage}
      />

      <div className="settings-header">
        <div className="settings-header-left">
          <button className="btn-secondary" onClick={onBack}>
            ← Powrót
          </button>
          <h1>Ustawienia</h1>
          {isAdmin && hasChanges() && (
            <button 
              className="btn-secondary" 
              onClick={handleSaveSettings}
              style={{ 
                backgroundColor: '#dc2626', 
                borderColor: '#dc2626',
                color: 'white'
              }}
            >
              💾 Zapisz zmiany
            </button>
          )}
        </div>
      </div>

      <div className="settings-content">
        {!isAdmin && (
          <div className="alert alert-info" style={{ padding: '0.3rem', fontSize: '0.65rem', marginBottom: '0.3rem' }}>
            <strong>Tryb tylko do odczytu</strong> - Tylko administrator może zmieniać ustawienia.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
          
          {/* Row 1, Col 1: Zabezpieczenia - pomarańczowe */}
          <div className="settings-section compact" style={{ 
            backgroundColor: 'rgba(251, 146, 60, 0.15)',
            border: '1px solid #f97316',
            padding: '0.4rem'
          }}>
            <h2 style={{ color: '#f97316', fontSize: '0.7rem', marginBottom: '0.3rem' }}>🔒 Zabezpieczenia</h2>
            
            {/* App Name Field - Admin Only */}
            {isAdmin && (
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.65rem', color: '#888', marginBottom: '0.2rem' }}>
                  🏷️ Nazwa aplikacji (max 30 znaków):
                </label>
                <input 
                  type="text" 
                  value={appName} 
                  onChange={(e) => setAppName(e.target.value.slice(0, 30))}
                  maxLength={30}
                  placeholder="SiaSiek Budget"
                  disabled={!isAdmin}
                  style={{ 
                    width: '100%',
                    padding: '0.3rem', 
                    fontSize: '0.65rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }} 
                />
                <div style={{ fontSize: '0.55rem', color: '#888', marginTop: '0.1rem' }}>
                  {appName.length}/30 znaków
                </div>
              </div>
            )}
            
            <label className="checkbox-label" title="Wymaga podania hasła przy logowaniu do aplikacji">
              <input type="checkbox" checked={passwordEnabled === 1} onChange={(e) => setPasswordEnabled(e.target.checked ? 1 : 0)} disabled={!isAdmin} />
              <span>Hasło wymagane</span>
            </label>
            <label className="checkbox-label" title="Zapamiętuje ostatnio zalogowanego użytkownika i automatycznie go wybiera przy następnym uruchomieniu">
              <input type="checkbox" checked={rememberUser === 1} onChange={(e) => setRememberUser(e.target.checked ? 1 : 0)} disabled={!isAdmin} />
              <span>Pamiętaj użytkownika</span>
            </label>
            {isAdmin && (
              <label className="checkbox-label" style={{ color: '#ef4444' }} title="Włącza zaawansowane opcje dla programistów, w tym możliwość czyszczenia bazy danych">
                <input type="checkbox" checked={developerMode === 1} onChange={(e) => setDeveloperMode(e.target.checked ? 1 : 0)} />
                <span>🛠️ Tryb developera</span>
              </label>
            )}
          </div>

          {/* Row 1, Col 2: Parametry budżetu - żółte */}
          <div className="settings-section compact" style={{ 
            backgroundColor: 'rgba(250, 204, 21, 0.15)',
            border: '1px solid #eab308',
            padding: '0.4rem'
          }}>
            <h2 style={{ color: '#eab308', fontSize: '0.7rem', marginBottom: '0.3rem' }}>💰 Parametry budżetu</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 0.4rem', fontSize: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Dzień miesiąca, w którym rozpoczyna się nowy okres rozliczeniowy budżetu (1-28 lub ostatni dzień miesiąca)">
                <span style={{ color: '#888' }}>Dzień rozliczenia:</span>
                <select value={billingDay} onChange={(e) => setBillingDay(Number(e.target.value))} disabled={!isAdmin}
                  style={{ padding: '0.15rem', fontSize: '0.65rem', width: '50px' }}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (<option key={day} value={day}>{day}</option>))}
                  <option value={29}>Ost.</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Procent przychodów automatycznie odkładany na oszczędności (0-100%)">
                <span style={{ color: '#888' }}>Oszczędności:</span>
                <input type="number" value={savingsPercentage} onChange={(e) => setSavingsPercentage(Number(e.target.value))} 
                  onFocus={clearZeroOnFocus}
                  min="0" max="100" step="0.5" disabled={!isAdmin} style={{ padding: '0.15rem', fontSize: '0.65rem', width: '45px' }} />
                <span>%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Planowana kwota wydatków na zakupy spożywcze na tydzień (w złotówkach)">
                <span style={{ color: '#888' }}>Zakupy tygodniowe:</span>
                <input type="number" value={weeklyGroceries} onChange={(e) => setWeeklyGroceries(Number(e.target.value))}
                  onFocus={clearZeroOnFocus}
                  min="0" step="10" disabled={!isAdmin} style={{ padding: '0.15rem', fontSize: '0.65rem', width: '55px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Planowana kwota drobnych wydatków dziennych, np. kawa, przekąski (w złotówkach)">
                <span style={{ color: '#888' }}>Wydatki dzienne:</span>
                <input type="number" value={dailyExpenses} onChange={(e) => setDailyExpenses(Number(e.target.value))}
                  onFocus={clearZeroOnFocus}
                  min="0" step="5" disabled={!isAdmin} style={{ padding: '0.15rem', fontSize: '0.65rem', width: '55px' }} />
              </div>
            </div>
          </div>

          {/* Row 1, Col 3: Użytkownicy - fioletowe */}
          <div className="settings-section compact" style={{ 
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid #a855f7',
            padding: '0.4rem'
          }}>
            <h2 style={{ color: '#a855f7', fontSize: '0.7rem', marginBottom: '0.3rem' }}>👥 Użytkownicy ({users.length}/5)</h2>
            
            {/* Lista użytkowników */}
            <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
              {users.map(user => (
                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.15rem 0', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  {editingUserId !== user.id ? (
                    <>
                      <div>
                        <strong style={{ fontSize: '0.65rem' }}>{user.username}</strong>
                        <span style={{ fontSize: '0.55rem', marginLeft: '0.2rem', color: user.role === 'admin' ? '#22c55e' : '#888' }}>{user.role === 'admin' ? 'Admin' : 'User'}</span>
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          <button type="button" className="btn-xs" onClick={() => handleRevealPassword(user.username)} style={{ fontSize: '0.55rem', padding: '0.1rem 0.2rem' }} title="Pokaż hasło użytkownika">👁️</button>
                          <button type="button" className="btn-xs" onClick={() => handleEditUser(user)} style={{ fontSize: '0.55rem', padding: '0.1rem 0.2rem' }} title="Edytuj dane użytkownika">✏️</button>
                          {users.length > 1 && (
                            <button type="button" className="btn-xs" onClick={() => handleDeleteUser(user.id)} style={{ fontSize: '0.55rem', padding: '0.1rem 0.2rem', color: '#dc2626' }} title="Usuń użytkownika z systemu">🗑️</button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <form onSubmit={handleUpdateUser} style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', width: '100%' }}>
                      <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required style={{ flex: '1', minWidth: '60px', fontSize: '0.6rem', padding: '0.1rem' }} />
                      <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Hasło" style={{ flex: '1', minWidth: '60px', fontSize: '0.6rem', padding: '0.1rem' }} />
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')} style={{ fontSize: '0.6rem', padding: '0.1rem' }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button type="submit" className="btn-primary btn-xs" style={{ fontSize: '0.5rem', padding: '0.1rem 0.2rem' }}>✓</button>
                      <button type="button" className="btn-secondary btn-xs" onClick={() => setEditingUserId(null)} style={{ fontSize: '0.5rem', padding: '0.1rem 0.2rem' }}>✗</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
            
            {/* Formularz dodawania nowego użytkownika */}
            {showUserForm ? (
              <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required placeholder="Nazwa" style={{ flex: '1', minWidth: '60px', fontSize: '0.6rem', padding: '0.1rem' }} />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Hasło" style={{ flex: '1', minWidth: '60px', fontSize: '0.6rem', padding: '0.1rem' }} />
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')} style={{ fontSize: '0.6rem', padding: '0.1rem' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn-primary btn-xs" style={{ fontSize: '0.5rem', padding: '0.1rem 0.2rem' }}>✓</button>
                <button type="button" className="btn-secondary btn-xs" onClick={() => { setShowUserForm(false); setNewUsername(''); setNewPassword(''); }} style={{ fontSize: '0.5rem', padding: '0.1rem 0.2rem' }}>✗</button>
              </form>
            ) : (
              isAdmin && users.length < 5 && !editingUserId && (
                <button type="button" className="btn-primary btn-xs" onClick={() => setShowUserForm(true)} 
                  style={{ width: '100%', marginTop: '0.2rem', fontSize: '0.6rem', padding: '0.2rem' }}>+ Dodaj</button>
              )
            )}
          </div>

          {/* Row 2: Kolumny wydatków - zielone (cały wiersz) */}
          <div className="settings-section compact" style={{ 
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            padding: '0.4rem',
            gridColumn: 'span 3'
          }}>
            <h2 style={{ color: '#22c55e', fontSize: '0.7rem', marginBottom: '0.3rem' }} title="Kategorie wydatków wyświetlane w poszczególnych kolumnach na stronie miesiąca">📊 Kategorie kolumn</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {/* Kolumna 1 */}
              <div title="Lewa kolumna wydatków w widoku miesiąca">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#22c55e' }}>Kolumna 1</span>
                  {isAdmin && getAvailableCategories().length > 0 && (
                    <select onChange={(e) => { if (e.target.value) { addCategoryToColumn(1, e.target.value); e.target.value = ''; }}}
                      style={{ padding: '0.1rem', fontSize: '0.6rem', width: '80px' }}>
                      <option value="">+ Dodaj</option>
                      {getAvailableCategories().map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                  {column1Categories.map((cat, index) => (
                    <div key={index} className="category-badge-large">
                      <span>{cat}</span>
                      {isAdmin && <button type="button" className="btn-remove-xs" onClick={() => removeCategoryFromColumn(1, cat)}>×</button>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Kolumna 2 */}
              <div title="Środkowa kolumna wydatków w widoku miesiąca">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#22c55e' }}>Kolumna 2</span>
                  {isAdmin && getAvailableCategories().length > 0 && (
                    <select onChange={(e) => { if (e.target.value) { addCategoryToColumn(2, e.target.value); e.target.value = ''; }}}
                      style={{ padding: '0.1rem', fontSize: '0.6rem', width: '80px' }}>
                      <option value="">+ Dodaj</option>
                      {getAvailableCategories().map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                  {column2Categories.map((cat, index) => (
                    <div key={index} className="category-badge-large">
                      <span>{cat}</span>
                      {isAdmin && <button type="button" className="btn-remove-xs" onClick={() => removeCategoryFromColumn(2, cat)}>×</button>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Kolumna 3 */}
              <div title="Prawa kolumna wydatków w widoku miesiąca">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#22c55e' }}>Kolumna 3</span>
                  {isAdmin && getAvailableCategories().length > 0 && (
                    <select onChange={(e) => { if (e.target.value) { addCategoryToColumn(3, e.target.value); e.target.value = ''; }}}
                      style={{ padding: '0.1rem', fontSize: '0.6rem', width: '80px' }}>
                      <option value="">+ Dodaj</option>
                      {getAvailableCategories().map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                  {column3Categories.map((cat, index) => (
                    <div key={index} className="category-badge-large">
                      <span>{cat}</span>
                      {isAdmin && <button type="button" className="btn-remove-xs" onClick={() => removeCategoryFromColumn(3, cat)}>×</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Admin sections below main grid */}
        {isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
            
            {/* Developer Mode: Database Cleanup */}
            {developerMode === 1 && (
              <div className="settings-section compact" style={{ 
                backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                border: '1px solid #dc2626'
              }}>
                <h2 style={{ color: '#dc2626', fontSize: '0.75rem' }}>🗑️ Czyszczenie bazy</h2>
                <p style={{ color: '#ef4444', fontSize: '0.65rem', marginBottom: '0.4rem' }}>
                  ⚠️ Operacja nieodwracalna!
                </p>
                
                <div className="cleanup-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem' }}>
                  <label className="checkbox-label" title="Usuń wszystkie zapisane nazwy wydatków z podpowiedzi">
                    <input
                      type="checkbox"
                      checked={cleanupExpenseNames}
                      onChange={(e) => setCleanupExpenseNames(e.target.checked)}
                      disabled={isCleaningUp}
                    />
                    <span>💸 Wydatki</span>
                  </label>
                  
                  <label className="checkbox-label" title="Usuń wszystkie zapisane nazwy przychodów z podpowiedzi">
                    <input
                      type="checkbox"
                      checked={cleanupIncomeNames}
                      onChange={(e) => setCleanupIncomeNames(e.target.checked)}
                      disabled={isCleaningUp}
                    />
                    <span>💰 Przychody</span>
                  </label>
                  
                  <label className="checkbox-label" title="Usuń całą historię spłat długów">
                    <input
                      type="checkbox"
                      checked={cleanupDebtHistory}
                      onChange={(e) => setCleanupDebtHistory(e.target.checked)}
                      disabled={isCleaningUp}
                    />
                    <span>📋 Długi</span>
                  </label>
                  
                  <label className="checkbox-label" title="Usuń wszystkie skarbonki">
                    <input
                      type="checkbox"
                      checked={cleanupPiggybanks}
                      onChange={(e) => setCleanupPiggybanks(e.target.checked)}
                      disabled={isCleaningUp}
                    />
                    <span>🐷 Skarbonki</span>
                  </label>
                </div>

                {/* Month selection for archive cleanup */}
                <div style={{ marginTop: '0.4rem' }}>
                  <h3 style={{ color: '#dc2626', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                    📅 Miesiące do usunięcia:
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={selectAllMonths}
                      disabled={isCleaningUp || availableMonths.length === 0}
                      style={{ fontSize: '0.6rem', padding: '0.15rem 0.3rem' }}
                    >
                      ✓ Wszystkie
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={deselectAllMonths}
                      disabled={isCleaningUp || selectedMonthsToDelete.length === 0}
                      style={{ fontSize: '0.6rem', padding: '0.15rem 0.3rem' }}
                    >
                      ✗ Odznacz
                    </button>
                  </div>
                  
                  {/* Year accordion */}
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    borderRadius: '6px',
                    padding: '0.5rem'
                  }}>
                    {availableMonths.length === 0 ? (
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>Brak miesięcy w archiwum</p>
                    ) : (
                      getMonthsByYear().map(({ year, months }) => (
                        <div key={year} style={{ marginBottom: '0.5rem' }}>
                          {/* Year header */}
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              padding: '0.5rem',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleYearExpanded(year)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '0.9rem',
                                width: '20px'
                              }}
                            >
                              {expandedYears.includes(year) ? '▼' : '▶'}
                            </button>
                            <input
                              type="checkbox"
                              checked={isYearFullySelected(year)}
                              ref={(el) => {
                                if (el) el.indeterminate = isYearPartiallySelected(year);
                              }}
                              onChange={() => selectYearMonths(year)}
                              disabled={isCleaningUp}
                              style={{ cursor: 'pointer' }}
                            />
                            <span 
                              onClick={() => toggleYearExpanded(year)}
                              style={{ 
                                fontWeight: 600, 
                                color: 'var(--text-primary)',
                                flex: 1
                              }}
                            >
                              {year}
                            </span>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: getYearSelectedCount(year) > 0 ? '#fbbf24' : '#888',
                              minWidth: '60px',
                              textAlign: 'right'
                            }}>
                              {getYearSelectedCount(year)}/{months.length} mies.
                            </span>
                          </div>
                          
                          {/* Month list (collapsible) */}
                          {expandedYears.includes(year) && (
                            <div style={{ 
                              paddingLeft: '2rem', 
                              paddingTop: '0.25rem',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '0.25rem'
                            }}>
                              {months.map(month => (
                                <label 
                                  key={month.id} 
                                  className="checkbox-label" 
                                  style={{ 
                                    marginBottom: 0,
                                    fontSize: '0.8rem',
                                    padding: '0.2rem 0'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedMonthsToDelete.includes(month.id)}
                                    onChange={() => toggleMonthSelection(month.id)}
                                    disabled={isCleaningUp}
                                  />
                                  <span>{month.name.split(' ')[0]}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {selectedMonthsToDelete.length > 0 && (
                    <p style={{ color: '#fbbf24', fontSize: '0.65rem', marginTop: '0.2rem' }}>
                      Wybrano: {selectedMonthsToDelete.length}
                    </p>
                  )}
                </div>
                
                <button
                  type="button"
                  className="btn-danger btn-xs"
                  onClick={handleCleanupDatabase}
                  disabled={isCleaningUp}
                  style={{ width: '100%', marginTop: '0.3rem' }}
                >
                  {isCleaningUp ? '⏳ Czyszczenie...' : '🗑️ Wyczyść'}
                </button>
              </div>
            )}

            {/* Backup & Restore Section */}
            <div className="settings-section compact" style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid #3b82f6'
            }}>
              <h2 style={{ color: '#3b82f6', fontSize: '0.75rem' }}>💾 Kopia zapasowa</h2>
              
              {/* Create Backup */}
              <div style={{ marginBottom: '0.5rem' }}>
                <p style={{ color: '#888', fontSize: '0.6rem', marginBottom: '0.3rem' }}>
                  Wybierz dane do backupu:
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.15rem' }}>
                  <label className="checkbox-label" title="Zapisz ustawienia aplikacji: parametry budżetu, kolumny kategorii, opcje zabezpieczeń">
                    <input
                      type="checkbox"
                      checked={backupSettings}
                      onChange={(e) => setBackupSettings(e.target.checked)}
                      disabled={isCreatingBackup}
                    />
                    <span>⚙️ Ustawienia</span>
                  </label>
                  
                  <label className="checkbox-label" title="Zapisz konta użytkowników wraz z hasłami i uprawnieniami">
                    <input
                      type="checkbox"
                      checked={backupUsers}
                      onChange={(e) => setBackupUsers(e.target.checked)}
                      disabled={isCreatingBackup}
                    />
                    <span>👥 Użytkownicy</span>
                  </label>
                  
                  <label className="checkbox-label" title="Zapisz wszystkie miesiące wraz z przychodami i wydatkami">
                    <input
                      type="checkbox"
                      checked={backupMonths}
                      onChange={(e) => setBackupMonths(e.target.checked)}
                      disabled={isCreatingBackup}
                    />
                    <span>📅 Miesiące</span>
                  </label>
                  
                  <label className="checkbox-label" title="Zapisz wszystkie długi i historię ich spłat">
                    <input
                      type="checkbox"
                      checked={backupDebts}
                      onChange={(e) => setBackupDebts(e.target.checked)}
                      disabled={isCreatingBackup}
                    />
                    <span>💳 Długi</span>
                  </label>
                  
                  <label className="checkbox-label" title="Zapisz katalog stałych wydatków miesięcznych (np. czynsz, rachunki)">
                    <input
                      type="checkbox"
                      checked={backupFixedExpenses}
                      onChange={(e) => setBackupFixedExpenses(e.target.checked)}
                      disabled={isCreatingBackup}
                    />
                    <span>💸 Stałe wydatki</span>
                  </label>
                  
                  <label className="checkbox-label" title="Zapisz katalog stałych przychodów miesięcznych (np. pensja, świadczenia)">
                    <input
                      type="checkbox"
                      checked={backupFixedIncomes}
                      onChange={(e) => setBackupFixedIncomes(e.target.checked)}
                      disabled={isCreatingBackup}
                    />
                    <span>💰 Stałe przychody</span>
                  </label>
                  
                  <label className="checkbox-label" title="Zapisz skarbonki (cele oszczędnościowe)">
                    <input
                      type="checkbox"
                      checked={backupPiggybanks}
                      onChange={(e) => setBackupPiggybanks(e.target.checked)}
                      disabled={isCreatingBackup}
                    />
                    <span>🐷 Skarbonki</span>
                  </label>
                </div>
                
                <button
                  type="button"
                  className="btn-primary btn-xs"
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  style={{ width: '100%', backgroundColor: '#3b82f6', borderColor: '#3b82f6', marginTop: '0.3rem' }}
                  title="Eksportuj wybrane dane do pliku JSON, który można przechowywać jako kopię zapasową"
                >
                  {isCreatingBackup ? '⏳...' : '💾 Zapisz backup'}
                </button>
              </div>
              
              {/* Restore Backup */}
              <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.3)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={handleLoadBackup}
                  disabled={isRestoring}
                  style={{ width: '100%' }}
                  title="Importuj dane z wcześniej utworzonego pliku kopii zapasowej"
                >
                  📂 Wczytaj backup
                </button>
                
                {loadedBackup && (
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    padding: '0.4rem', 
                    borderRadius: '4px',
                    marginTop: '0.3rem'
                  }}>
                    <p style={{ color: '#60a5fa', fontSize: '0.6rem', marginBottom: '0.25rem' }}>
                      ✅ {new Date(loadedBackup.created_at).toLocaleDateString('pl-PL')}
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.15rem' }}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={restoreSettings}
                          onChange={(e) => setRestoreSettings(e.target.checked)}
                          disabled={isRestoring || !loadedBackup.data.settings}
                        />
                        <span style={{ opacity: loadedBackup.data.settings ? 1 : 0.5 }}>
                          ⚙️ Ust.
                        </span>
                      </label>
                      
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={restoreUsers}
                          onChange={(e) => setRestoreUsers(e.target.checked)}
                          disabled={isRestoring || !loadedBackup.data.users}
                        />
                        <span style={{ opacity: loadedBackup.data.users ? 1 : 0.5 }}>
                          👥 ({loadedBackup.data.users?.length || 0})
                        </span>
                      </label>
                      
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={restoreMonths}
                          onChange={(e) => setRestoreMonths(e.target.checked)}
                          disabled={isRestoring || !loadedBackup.data.months}
                        />
                        <span style={{ opacity: loadedBackup.data.months ? 1 : 0.5 }}>
                          📅 ({loadedBackup.data.months?.length || 0})
                        </span>
                      </label>
                      
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={restoreDebts}
                          onChange={(e) => setRestoreDebts(e.target.checked)}
                          disabled={isRestoring || !loadedBackup.data.debts}
                        />
                        <span style={{ opacity: loadedBackup.data.debts ? 1 : 0.5 }}>
                          💳 ({loadedBackup.data.debts?.length || 0})
                        </span>
                      </label>
                      
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={restoreFixedExpenses}
                          onChange={(e) => setRestoreFixedExpenses(e.target.checked)}
                          disabled={isRestoring || !loadedBackup.data.fixed_expenses_catalog}
                        />
                        <span style={{ opacity: loadedBackup.data.fixed_expenses_catalog ? 1 : 0.5 }}>
                          💸 ({loadedBackup.data.fixed_expenses_catalog?.length || 0})
                        </span>
                      </label>
                      
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={restoreFixedIncomes}
                          onChange={(e) => setRestoreFixedIncomes(e.target.checked)}
                          disabled={isRestoring || !loadedBackup.data.fixed_incomes_catalog}
                        />
                        <span style={{ opacity: loadedBackup.data.fixed_incomes_catalog ? 1 : 0.5 }}>
                          💰 ({loadedBackup.data.fixed_incomes_catalog?.length || 0})
                        </span>
                      </label>
                      
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={restorePiggybanks}
                          onChange={(e) => setRestorePiggybanks(e.target.checked)}
                          disabled={isRestoring || !loadedBackup.data.piggybanks}
                        />
                        <span style={{ opacity: loadedBackup.data.piggybanks ? 1 : 0.5 }}>
                          🐷 ({loadedBackup.data.piggybanks?.length || 0})
                        </span>
                      </label>
                    </div>
                    
                    <button
                      type="button"
                      className="btn-primary btn-xs"
                      onClick={handleRestoreBackup}
                      disabled={isRestoring}
                      style={{ width: '100%', backgroundColor: '#10b981', borderColor: '#10b981', marginTop: '0.3rem' }}
                    >
                      {isRestoring ? '⏳...' : '📥 Przywróć'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* About & Updates Section */}
            <div className="settings-section compact" style={{ 
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid #8b5cf6'
            }}>
              <h2 style={{ color: '#8b5cf6', fontSize: '0.75rem' }}>ℹ️ O aplikacji</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                  <span style={{ color: '#888' }}>Wersja:</span>
                  <span style={{ color: '#8b5cf6', fontWeight: 600 }}>v{appVersion}</span>
                </div>
                
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={() => setManualOpen(true)}
                  style={{ width: '100%', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: 'white' }}
                >
                  📖 Instrukcja obsługi
                </button>
                
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  onClick={handleCheckUpdates}
                  disabled={checkingUpdates}
                  style={{ width: '100%' }}
                >
                  {checkingUpdates ? '⏳ Sprawdzanie...' : '🔄 Sprawdź aktualizacje'}
                </button>
                
                {updateInfo?.hasUpdate && (
                  <a 
                    href={updateInfo.releaseUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      color: '#10b981', 
                      fontSize: '0.65rem',
                      textDecoration: 'none'
                    }}
                  >
                    🎉 Pobierz v{updateInfo.latestVersion}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Manual Modal */}
      {manualOpen && <UserManual onClose={() => setManualOpen(false)} />}
    </div>
  );
};

export default Settings;
