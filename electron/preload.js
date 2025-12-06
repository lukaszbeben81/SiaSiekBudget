const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  updateSettings: (settings) => ipcRenderer.invoke('db:updateSettings', settings),
  isFirstRun: () => ipcRenderer.invoke('db:isFirstRun'),
  
  // Users & Auth
  createAdminUser: (username, password) => ipcRenderer.invoke('db:createAdminUser', username, password),
  login: (username, password) => ipcRenderer.invoke('db:login', username, password),
  getUsers: () => ipcRenderer.invoke('db:getUsers'),
  createUser: (userData) => ipcRenderer.invoke('db:createUser', userData),
  updateUser: (userId, userData) => ipcRenderer.invoke('db:updateUser', userId, userData),
  deleteUser: (userId) => ipcRenderer.invoke('db:deleteUser', userId),
  
  // Months
  getMonths: () => ipcRenderer.invoke('db:getMonths'),
  getMonth: (monthId) => ipcRenderer.invoke('db:getMonth', monthId),
  createMonth: (monthData) => ipcRenderer.invoke('db:createMonth', monthData),
  
  // Incomes
  getIncomes: (monthId) => ipcRenderer.invoke('db:getIncomes', monthId),
  createIncome: (incomeData) => ipcRenderer.invoke('db:createIncome', incomeData),
  updateIncome: (incomeId, incomeData) => ipcRenderer.invoke('db:updateIncome', incomeId, incomeData),
  deleteIncome: (incomeId) => ipcRenderer.invoke('db:deleteIncome', incomeId),
  
  // Expenses
  getExpenses: (monthId) => ipcRenderer.invoke('db:getExpenses', monthId),
  createExpense: (expenseData) => ipcRenderer.invoke('db:createExpense', expenseData),
  updateExpense: (expenseId, expenseData) => ipcRenderer.invoke('db:updateExpense', expenseId, expenseData),
  deleteExpense: (expenseId) => ipcRenderer.invoke('db:deleteExpense', expenseId),
  
  // Debts
  getDebts: (monthId) => ipcRenderer.invoke('db:getDebts', monthId),
  createDebt: (debtData) => ipcRenderer.invoke('db:createDebt', debtData),
  updateDebt: (debtId, debtData) => ipcRenderer.invoke('db:updateDebt', debtId, debtData),
  payDebt: (debtId, amount) => ipcRenderer.invoke('db:payDebt', debtId, amount),
  
  // Fixed Expenses
  getFixedExpenses: () => ipcRenderer.invoke('db:getFixedExpenses'),
  createFixedExpense: (expenseData) => ipcRenderer.invoke('db:createFixedExpense', expenseData),
  updateFixedExpense: (expenseId, expenseData) => ipcRenderer.invoke('db:updateFixedExpense', expenseId, expenseData),
  deleteFixedExpense: (expenseId) => ipcRenderer.invoke('db:deleteFixedExpense', expenseId),
  
  // Fixed Incomes
  getFixedIncomes: () => ipcRenderer.invoke('db:getFixedIncomes'),
  createFixedIncome: (incomeData) => ipcRenderer.invoke('db:createFixedIncome', incomeData),
  updateFixedIncome: (incomeId, incomeData) => ipcRenderer.invoke('db:updateFixedIncome', incomeId, incomeData),
  deleteFixedIncome: (incomeId) => ipcRenderer.invoke('db:deleteFixedIncome', incomeId),
  
  // Piggybanks (Skarbonki)
  getPiggybanks: () => ipcRenderer.invoke('db:getPiggybanks'),
  createPiggybank: (piggybankData) => ipcRenderer.invoke('db:createPiggybank', piggybankData),
  updatePiggybank: (piggybankId, piggybankData) => ipcRenderer.invoke('db:updatePiggybank', piggybankId, piggybankData),
  deletePiggybank: (piggybankId) => ipcRenderer.invoke('db:deletePiggybank', piggybankId),
  depositToPiggybank: (piggybankId, amount) => ipcRenderer.invoke('db:depositToPiggybank', piggybankId, amount),
  
  // Planned Expenses (Zaplanowane wydatki)
  getPlannedExpenses: () => ipcRenderer.invoke('db:getPlannedExpenses'),
  createPlannedExpense: (expenseData) => ipcRenderer.invoke('db:createPlannedExpense', expenseData),
  updatePlannedExpense: (expenseId, expenseData) => ipcRenderer.invoke('db:updatePlannedExpense', expenseId, expenseData),
  deletePlannedExpense: (expenseId) => ipcRenderer.invoke('db:deletePlannedExpense', expenseId),
  completePlannedExpense: (expenseId) => ipcRenderer.invoke('db:completePlannedExpense', expenseId),
  
  // Migration
  migrateExistingToCatalog: () => ipcRenderer.invoke('db:migrateExistingToCatalog'),
  
  // Statistics
  getStatistics: (startDate, endDate) => ipcRenderer.invoke('db:getStatistics', startDate, endDate),
  
  // Database cleanup
  cleanupDatabase: (options) => ipcRenderer.invoke('db:cleanupDatabase', options),
  
  // Backup & Restore
  createBackup: (options) => ipcRenderer.invoke('db:createBackup', options),
  restoreBackup: (backup, options) => ipcRenderer.invoke('db:restoreBackup', backup, options),
  saveBackupDialog: (backupData) => ipcRenderer.invoke('dialog:saveBackup', backupData),
  openBackupDialog: () => ipcRenderer.invoke('dialog:openBackup'),
  
  // External API
  fetchJoke: () => ipcRenderer.invoke('api:fetchJoke'),
  
  // App Info & Updates
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates')
});
