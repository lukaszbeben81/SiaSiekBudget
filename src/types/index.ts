export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface Settings {
  id: number;
  password_enabled: number;
  billing_day: number;
  savings_percentage: number;
  weekly_groceries: number;
  daily_expenses: number;
  remember_user: number;
  last_user_id?: number;
  developer_mode?: number;
  app_name?: string;
  column1_name?: string;
  column1_categories?: string;
  column2_name?: string;
  column2_categories?: string;
  column3_name?: string;
  column3_categories?: string;
}

export interface Month {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  created_at?: string;
}

export interface Income {
  id: number;
  month_id: number;
  name: string;
  amount: number;
  is_recurring: number;
  date_received?: string;
}

export interface Expense {
  id: number;
  month_id: number;
  name: string;
  category?: string;
  total_amount: number;
  paid_amount: number;
  is_fixed: number;
  due_date?: string;
  column_number?: number;
}

export interface Debt {
  id: number;
  month_id?: number;
  name: string;
  total_amount: number;
  paid_amount: number;
  creditor?: string;
  date_incurred: string;
  due_date?: string;
  is_paid: number;
}

export interface FixedExpense {
  id: number;
  name: string;
  category?: string;
  default_amount: number;
  column_number?: number;
  is_active: number;
}

export interface FixedIncome {
  id: number;
  name: string;
  category?: string;
  default_amount: number;
  is_active: number;
}

export interface Piggybank {
  id: number;
  name: string;
  target_amount: number;
  monthly_amount: number;
  current_amount: number;
  start_date: string;
  end_date?: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlannedExpense {
  id: number;
  name: string;
  category?: string;
  amount: number;
  target_month: string; // Format: YYYY-MM - miesiąc na który planujemy wydatek
  description?: string;
  is_completed: number;
  created_at?: string;
  updated_at?: string;
}

export interface Statistics {
  incomes: {
    total: number;
    count: number;
  };
  expenses: {
    total: number;
    count: number;
  };
  categoryExpenses: Array<{
    category: string;
    total: number;
  }>;
}

export interface ElectronAPI {
  // Settings
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Partial<Settings>) => Promise<any>;
  isFirstRun: () => Promise<boolean>;
  
  // Users & Auth
  createAdminUser: (username: string, password: string) => Promise<any>;
  login: (username: string, password: string) => Promise<User | null>;
  getUsers: () => Promise<User[]>;
  createUser: (userData: { username: string; password: string; role: 'admin' | 'user' }) => Promise<any>;
  updateUser: (userId: number, userData: Partial<{ username: string; password: string; role: 'admin' | 'user' }>) => Promise<any>;
  deleteUser: (userId: number) => Promise<any>;
  
  // Months
  getMonths: () => Promise<Month[]>;
  getMonth: (monthId: number) => Promise<Month>;
  createMonth: (monthData: { name: string; start_date: string; end_date: string }) => Promise<any>;
  
  // Incomes
  getIncomes: (monthId: number) => Promise<Income[]>;
  createIncome: (incomeData: Omit<Income, 'id'>) => Promise<any>;
  updateIncome: (incomeId: number, incomeData: Partial<Income>) => Promise<any>;
  deleteIncome: (incomeId: number) => Promise<any>;
  
  // Expenses
  getExpenses: (monthId: number) => Promise<Expense[]>;
  createExpense: (expenseData: Omit<Expense, 'id'>) => Promise<any>;
  updateExpense: (expenseId: number, expenseData: Partial<Expense>) => Promise<any>;
  deleteExpense: (expenseId: number) => Promise<any>;
  
  // Debts
  getDebts: (monthId?: number) => Promise<Debt[]>;
  createDebt: (debtData: Omit<Debt, 'id' | 'is_paid'>) => Promise<any>;
  updateDebt: (debtId: number, debtData: Partial<Debt>) => Promise<any>;
  payDebt: (debtId: number, amount: number) => Promise<any>;
  
  // Fixed Expenses
  getFixedExpenses: () => Promise<FixedExpense[]>;
  createFixedExpense: (expenseData: Omit<FixedExpense, 'id' | 'is_active'>) => Promise<any>;
  updateFixedExpense: (expenseId: number, expenseData: Partial<FixedExpense>) => Promise<any>;
  deleteFixedExpense: (expenseId: number) => Promise<any>;
  
  // Fixed Incomes
  getFixedIncomes: () => Promise<FixedIncome[]>;
  createFixedIncome: (incomeData: Omit<FixedIncome, 'id' | 'is_active'>) => Promise<any>;
  updateFixedIncome: (incomeId: number, incomeData: Partial<FixedIncome>) => Promise<any>;
  deleteFixedIncome: (incomeId: number) => Promise<any>;
  
  // Piggybanks (Skarbonki)
  getPiggybanks: () => Promise<Piggybank[]>;
  createPiggybank: (piggybankData: Omit<Piggybank, 'id' | 'is_active' | 'current_amount' | 'created_at' | 'updated_at'>) => Promise<any>;
  updatePiggybank: (piggybankId: number, piggybankData: Partial<Piggybank>) => Promise<any>;
  deletePiggybank: (piggybankId: number) => Promise<any>;
  depositToPiggybank: (piggybankId: number, amount: number) => Promise<any>;
  
  // Planned Expenses (Zaplanowane wydatki)
  getPlannedExpenses: () => Promise<PlannedExpense[]>;
  createPlannedExpense: (expenseData: Omit<PlannedExpense, 'id' | 'is_completed' | 'created_at' | 'updated_at'>) => Promise<any>;
  updatePlannedExpense: (expenseId: number, expenseData: Partial<PlannedExpense>) => Promise<any>;
  deletePlannedExpense: (expenseId: number) => Promise<any>;
  completePlannedExpense: (expenseId: number) => Promise<any>;
  
  // Migration
  migrateExistingToCatalog: () => Promise<{ expensesMigrated: number; incomesMigrated: number }>;
  
  // Statistics
  getStatistics: (startDate: string, endDate: string) => Promise<Statistics>;
  
  // Database cleanup
  cleanupDatabase: (options: {
    expenseNames?: boolean;
    incomeNames?: boolean;
    selectedMonths?: number[];
    debtHistory?: boolean;
  }) => Promise<Record<string, number>>;
  
  // Backup & Restore
  createBackup: (options: BackupOptions) => Promise<BackupData>;
  restoreBackup: (backup: BackupData, options: RestoreOptions) => Promise<RestoreResult>;
  saveBackupDialog: (backupData: BackupData) => Promise<{ success: boolean; path?: string }>;
  openBackupDialog: () => Promise<{ success: boolean; backup?: BackupData; error?: string }>;
  
  // External API
  fetchJoke: () => Promise<{ success: boolean; joke?: string; error?: string }>;
  
  // App Info & Updates
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<{
    success: boolean;
    currentVersion: string;
    latestVersion?: string;
    hasUpdate?: boolean;
    releaseUrl?: string;
    releaseNotes?: string;
    error?: string;
  }>;
}

export interface BackupOptions {
  settings?: boolean;
  users?: boolean;
  months?: boolean;
  incomes?: boolean;
  expenses?: boolean;
  debts?: boolean;
  fixedExpenses?: boolean;
  fixedIncomes?: boolean;
  piggybanks?: boolean;
}

export interface BackupData {
  version: string;
  created_at: string;
  data: {
    settings?: Settings;
    users?: User[];
    months?: Month[];
    incomes?: Income[];
    expenses?: Expense[];
    debts?: Debt[];
    debt_payments?: any[];
    fixed_expenses_catalog?: FixedExpense[];
    fixed_incomes_catalog?: FixedIncome[];
    piggybanks?: Piggybank[];
  };
}

export interface RestoreOptions {
  settings?: boolean;
  users?: boolean;
  months?: boolean;
  debts?: boolean;
  fixedExpenses?: boolean;
  fixedIncomes?: boolean;
  piggybanks?: boolean;
  replaceExisting?: boolean;
}

export interface RestoreResult {
  settings: boolean;
  users: number;
  months: number;
  incomes: number;
  expenses: number;
  debts: number;
  fixedExpenses: number;
  fixedIncomes: number;
  piggybanks: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
