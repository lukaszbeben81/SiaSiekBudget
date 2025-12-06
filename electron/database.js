const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'budget.json');
    const adapter = new FileSync(dbPath);
    this.db = low(adapter);
    
    // Initialize default data structure
    this.db.defaults({
      settings: {
        id: 1,
        password_enabled: 1,
        billing_day: 1,
        savings_percentage: 10.0,
        weekly_groceries: 500.0,
        daily_expenses: 100.0,
        remember_user: 0,
        last_user_id: null,
        developer_mode: 0,
        app_name: 'SiaSiek Budget',
        column1_name: 'Mieszkanie i Media',
        column1_categories: 'Mieszkanie,Media',
        column2_name: 'Transport i Zakupy',
        column2_categories: 'Transport,Żywność',
        column3_name: 'Inne',
        column3_categories: 'Rozrywka,Zdrowie,Inne',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      users: [],
      months: [],
      incomes: [],
      expenses: [],
      fixed_expenses_catalog: [],
      fixed_incomes_catalog: [],
      piggybanks: [],
      debts: [],
      debt_payments: []
    }).write();

    // Run migrations
    this.migrate();
  }

  // Migration method to update existing databases
  migrate() {
    const settings = this.db.get('settings').value();
    
    // Migration 1: Add column configuration if missing
    if (!settings.column1_name) {
      console.log('Running migration: Adding column configuration...');
      this.db.get('settings')
        .assign({
          column1_name: 'Mieszkanie i Media',
          column1_categories: 'Mieszkanie,Media',
          column2_name: 'Transport i Zakupy',
          column2_categories: 'Transport,Żywność',
          column3_name: 'Inne',
          column3_categories: 'Rozrywka,Zdrowie,Inne'
        })
        .write();
      console.log('Migration completed: Column configuration added');
    }

    // Migration 2: Add app_name if missing
    if (!settings.app_name) {
      console.log('Running migration: Adding app_name...');
      this.db.get('settings')
        .assign({
          app_name: 'SiaSiek Budget'
        })
        .write();
      console.log('Migration completed: app_name added');
    }

    // Migration 3: Ensure protected expense categories exist in catalog
    const protectedExpenseCategories = ['Żywność', 'Spłata długu', 'Mieszkanie', 'Skarbonka', 'Rata'];
    const allExpenses = this.db.get('fixed_expenses_catalog').value();
    
    protectedExpenseCategories.forEach(category => {
      const activeExists = allExpenses.some(e => e.category === category && e.is_active === 1);
      if (!activeExists) {
        // Check if there's an inactive version to reactivate
        const inactiveEntry = allExpenses.find(e => e.category === category && e.is_active === 0);
        if (inactiveEntry) {
          console.log(`Running migration: Reactivating protected expense category "${category}"...`);
          this.db.get('fixed_expenses_catalog')
            .find({ id: inactiveEntry.id })
            .assign({ 
              is_active: 1, 
              is_protected: 1,
              updated_at: new Date().toISOString() 
            })
            .write();
          console.log(`Migration completed: Protected expense category "${category}" reactivated`);
        } else {
          console.log(`Running migration: Adding protected expense category "${category}"...`);
          this.db.get('fixed_expenses_catalog').push({
            id: Date.now() + Math.random(),
            name: category,
            category: category,
            default_amount: 0,
            column_number: category === 'Mieszkanie' ? 1 : (category === 'Żywność' ? 2 : 3),
            is_active: 1,
            is_protected: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).write();
          console.log(`Migration completed: Protected expense category "${category}" added`);
        }
      } else {
        // Ensure is_protected flag is set
        const entry = allExpenses.find(e => e.category === category && e.is_active === 1);
        if (entry && !entry.is_protected) {
          this.db.get('fixed_expenses_catalog')
            .find({ id: entry.id })
            .assign({ is_protected: 1 })
            .write();
        }
      }
    });

    // Migration 3: Ensure protected income categories exist in catalog
    const protectedIncomeCategories = ['Wynagrodzenie podstawowe', 'Świadczenia'];
    const allIncomes = this.db.get('fixed_incomes_catalog').value();
    
    protectedIncomeCategories.forEach(category => {
      const activeExists = allIncomes.some(i => i.category === category && i.is_active === 1);
      if (!activeExists) {
        // Check if there's an inactive version to reactivate
        const inactiveEntry = allIncomes.find(i => i.category === category && i.is_active === 0);
        if (inactiveEntry) {
          console.log(`Running migration: Reactivating protected income category "${category}"...`);
          this.db.get('fixed_incomes_catalog')
            .find({ id: inactiveEntry.id })
            .assign({ 
              is_active: 1, 
              is_protected: 1,
              updated_at: new Date().toISOString() 
            })
            .write();
          console.log(`Migration completed: Protected income category "${category}" reactivated`);
        } else {
          console.log(`Running migration: Adding protected income category "${category}"...`);
          this.db.get('fixed_incomes_catalog').push({
            id: Date.now() + Math.random(),
            name: category,
            category: category,
            default_amount: 0,
            is_active: 1,
            is_protected: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).write();
          console.log(`Migration completed: Protected income category "${category}" added`);
        }
      } else {
        // Ensure is_protected flag is set
        const entry = allIncomes.find(i => i.category === category && i.is_active === 1);
        if (entry && !entry.is_protected) {
          this.db.get('fixed_incomes_catalog')
            .find({ id: entry.id })
            .assign({ is_protected: 1 })
            .write();
        }
      }
    });

    // Migration 4: Ensure piggybanks array exists
    if (!this.db.has('piggybanks').value()) {
      console.log('Running migration: Adding piggybanks array...');
      this.db.set('piggybanks', []).write();
      console.log('Migration completed: Piggybanks array added');
    }
  }

  // Settings methods
  getSettings() {
    return this.db.get('settings').value();
  }

  updateSettings(settings) {
    this.db.set('settings', {
      ...this.db.get('settings').value(),
      ...settings,
      updated_at: new Date().toISOString()
    }).write();
    return this.db.get('settings').value();
  }

  isFirstRun() {
    return this.db.get('users').value().length === 0;
  }

  // User methods
  async createAdminUser(username, password) {
    const hash = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now(),
      username,
      password_hash: hash,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.get('users').push(user).write();
    return user;
  }

  async login(username, password) {
    const user = this.db.get('users').find({ username }).value();
    if (!user) return null;

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return null;

    return {
      id: user.id,
      username: user.username,
      role: user.role
    };
  }

  getUsers() {
    return this.db.get('users')
      .map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        created_at: u.created_at
      }))
      .value();
  }

  async createUser(userData) {
    const users = this.db.get('users').value();
    if (users.length >= 5) {
      throw new Error('Maksymalna liczba użytkowników (5) została osiągnięta');
    }

    const hash = await bcrypt.hash(userData.password, 10);
    const user = {
      id: Date.now(),
      username: userData.username,
      password_hash: hash,
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.get('users').push(user).write();
    return user;
  }

  async updateUser(userId, userData) {
    const user = this.db.get('users').find({ id: userId }).value();
    if (!user) throw new Error('User not found');

    const updates = {
      username: userData.username,
      role: userData.role,
      updated_at: new Date().toISOString()
    };

    if (userData.password) {
      updates.password_hash = await bcrypt.hash(userData.password, 10);
    }

    this.db.get('users')
      .find({ id: userId })
      .assign(updates)
      .write();

    return this.db.get('users').find({ id: userId }).value();
  }

  deleteUser(userId) {
    this.db.get('users').remove({ id: userId }).write();
    return { success: true };
  }

  // Month methods
  getMonths() {
    return this.db.get('months')
      .value()
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }

  getMonth(monthId) {
    return this.db.get('months').find({ id: monthId }).value();
  }

  createMonth(monthData) {
    const month = {
      id: Date.now(),
      name: monthData.name,
      start_date: monthData.start_date,
      end_date: monthData.end_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.get('months').push(month).write();
    return month;
  }

  // Income methods
  getIncomes(monthId) {
    return this.db.get('incomes').filter({ month_id: monthId }).value();
  }

  createIncome(incomeData) {
    const income = {
      id: Date.now(),
      ...incomeData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.get('incomes').push(income).write();
    return income;
  }

  updateIncome(incomeId, incomeData) {
    this.db.get('incomes')
      .find({ id: incomeId })
      .assign({
        ...incomeData,
        updated_at: new Date().toISOString()
      })
      .write();

    return this.db.get('incomes').find({ id: incomeId }).value();
  }

  deleteIncome(incomeId) {
    this.db.get('incomes').remove({ id: incomeId }).write();
    return { success: true };
  }

  // Expense methods
  getExpenses(monthId) {
    return this.db.get('expenses').filter({ month_id: monthId }).value();
  }

  createExpense(expenseData) {
    const expense = {
      id: Date.now(),
      ...expenseData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.get('expenses').push(expense).write();
    return expense;
  }

  updateExpense(expenseId, expenseData) {
    this.db.get('expenses')
      .find({ id: expenseId })
      .assign({
        ...expenseData,
        updated_at: new Date().toISOString()
      })
      .write();

    return this.db.get('expenses').find({ id: expenseId }).value();
  }

  deleteExpense(expenseId) {
    this.db.get('expenses').remove({ id: expenseId }).write();
    return { success: true };
  }

  // Debt methods
  getDebts(monthId = null) {
    if (monthId) {
      return this.db.get('debts').filter({ month_id: monthId }).value();
    }
    return this.db.get('debts').filter({ is_paid: 0 }).value();
  }

  createDebt(debtData) {
    const debt = {
      id: Date.now(),
      ...debtData,
      is_paid: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.get('debts').push(debt).write();
    return debt;
  }

  updateDebt(debtId, debtData) {
    this.db.get('debts')
      .find({ id: debtId })
      .assign({
        ...debtData,
        updated_at: new Date().toISOString()
      })
      .write();

    return this.db.get('debts').find({ id: debtId }).value();
  }

  payDebt(debtId, amount) {
    const debt = this.db.get('debts').find({ id: debtId }).value();
    if (!debt) throw new Error('Dług nie został znaleziony');

    const newPaidAmount = debt.paid_amount + amount;
    const isPaid = newPaidAmount >= debt.total_amount ? 1 : 0;

    // Record payment
    this.db.get('debt_payments').push({
      id: Date.now(),
      debt_id: debtId,
      amount,
      payment_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }).write();

    // Update debt
    this.db.get('debts')
      .find({ id: debtId })
      .assign({
        paid_amount: newPaidAmount,
        is_paid: isPaid,
        updated_at: new Date().toISOString()
      })
      .write();

    return this.db.get('debts').find({ id: debtId }).value();
  }

  // Fixed expenses catalog methods
  getFixedExpenses() {
    return this.db.get('fixed_expenses_catalog').filter({ is_active: 1 }).value();
  }

  createFixedExpense(expenseData) {
    const expense = {
      id: Date.now(),
      ...expenseData,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.get('fixed_expenses_catalog').push(expense).write();
    return expense;
  }

  updateFixedExpense(expenseId, expenseData) {
    this.db.get('fixed_expenses_catalog')
      .find({ id: expenseId })
      .assign({
        ...expenseData,
        updated_at: new Date().toISOString()
      })
      .write();

    return this.db.get('fixed_expenses_catalog').find({ id: expenseId }).value();
  }

  deleteFixedExpense(expenseId) {
    // Check if expense is protected
    const expense = this.db.get('fixed_expenses_catalog').find({ id: expenseId }).value();
    const protectedCategories = ['Żywność', 'Spłata długu', 'Mieszkanie', 'Skarbonka', 'Rata'];
    
    if (expense && protectedCategories.includes(expense.category)) {
      return { success: false, error: 'Nie można usunąć chronionej kategorii' };
    }
    
    this.db.get('fixed_expenses_catalog')
      .find({ id: expenseId })
      .assign({ is_active: 0 })
      .write();
    return { success: true };
  }

  // Fixed Incomes Catalog methods
  getFixedIncomes() {
    return this.db.get('fixed_incomes_catalog').filter({ is_active: 1 }).value();
  }

  createFixedIncome(incomeData) {
    const income = {
      id: Date.now(),
      ...incomeData,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.get('fixed_incomes_catalog').push(income).write();
    return income;
  }

  updateFixedIncome(incomeId, incomeData) {
    this.db.get('fixed_incomes_catalog')
      .find({ id: incomeId })
      .assign({
        ...incomeData,
        updated_at: new Date().toISOString()
      })
      .write();

    return this.db.get('fixed_incomes_catalog').find({ id: incomeId }).value();
  }

  deleteFixedIncome(incomeId) {
    // Check if income is protected
    const income = this.db.get('fixed_incomes_catalog').find({ id: incomeId }).value();
    const protectedCategories = ['Wynagrodzenie podstawowe', 'Świadczenia'];
    
    if (income && protectedCategories.includes(income.category)) {
      return { success: false, error: 'Nie można usunąć chronionej kategorii' };
    }
    
    this.db.get('fixed_incomes_catalog')
      .find({ id: incomeId })
      .assign({ is_active: 0 })
      .write();
    return { success: true };
  }

  // Piggybank (Skarbonka) methods
  getPiggybanks() {
    // Ensure piggybanks array exists
    if (!this.db.has('piggybanks').value()) {
      this.db.set('piggybanks', []).write();
    }
    return this.db.get('piggybanks').filter({ is_active: 1 }).value();
  }

  createPiggybank(piggybankData) {
    // Check max limit (10 piggybanks)
    const activePiggybanks = this.db.get('piggybanks').filter({ is_active: 1 }).value();
    if (activePiggybanks.length >= 10) {
      return { success: false, error: 'Maksymalna liczba skarbonek to 10' };
    }

    const piggybank = {
      id: Date.now(),
      ...piggybankData,
      current_amount: 0,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Ensure piggybanks array exists
    if (!this.db.has('piggybanks').value()) {
      this.db.set('piggybanks', []).write();
    }
    
    this.db.get('piggybanks').push(piggybank).write();
    return { success: true, piggybank };
  }

  updatePiggybank(piggybankId, piggybankData) {
    this.db.get('piggybanks')
      .find({ id: piggybankId })
      .assign({
        ...piggybankData,
        updated_at: new Date().toISOString()
      })
      .write();

    return this.db.get('piggybanks').find({ id: piggybankId }).value();
  }

  deletePiggybank(piggybankId) {
    this.db.get('piggybanks')
      .find({ id: piggybankId })
      .assign({ is_active: 0 })
      .write();
    return { success: true };
  }

  depositToPiggybank(piggybankId, amount) {
    const piggybank = this.db.get('piggybanks').find({ id: piggybankId }).value();
    if (!piggybank) {
      return { success: false, error: 'Skarbonka nie znaleziona' };
    }

    const newAmount = (piggybank.current_amount || 0) + amount;
    
    this.db.get('piggybanks')
      .find({ id: piggybankId })
      .assign({
        current_amount: newAmount,
        updated_at: new Date().toISOString()
      })
      .write();

    return { success: true, new_amount: newAmount };
  }

  // Planned Expenses (Zaplanowane wydatki) methods
  getPlannedExpenses() {
    // Ensure planned_expenses array exists
    if (!this.db.has('planned_expenses').value()) {
      this.db.set('planned_expenses', []).write();
    }
    return this.db.get('planned_expenses').filter({ is_completed: 0 }).value();
  }

  createPlannedExpense(expenseData) {
    // Ensure planned_expenses array exists
    if (!this.db.has('planned_expenses').value()) {
      this.db.set('planned_expenses', []).write();
    }

    const expense = {
      id: Date.now(),
      ...expenseData,
      is_completed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.db.get('planned_expenses').push(expense).write();
    return { success: true, expense };
  }

  updatePlannedExpense(expenseId, expenseData) {
    this.db.get('planned_expenses')
      .find({ id: expenseId })
      .assign({
        ...expenseData,
        updated_at: new Date().toISOString()
      })
      .write();

    return this.db.get('planned_expenses').find({ id: expenseId }).value();
  }

  deletePlannedExpense(expenseId) {
    this.db.get('planned_expenses')
      .remove({ id: expenseId })
      .write();
    return { success: true };
  }

  completePlannedExpense(expenseId) {
    this.db.get('planned_expenses')
      .find({ id: expenseId })
      .assign({
        is_completed: 1,
        updated_at: new Date().toISOString()
      })
      .write();
    return { success: true };
  }

  // Migration: Import existing expenses/incomes from months to catalog
  migrateExistingToCatalog() {
    console.log('Starting migration...');
    
    // Get all unique expenses from all months
    const allExpenses = this.db.get('expenses').value();
    console.log('All expenses from months:', allExpenses.length);
    const uniqueExpenses = [];
    const seenExpenseNames = new Set();
    
    allExpenses.forEach(expense => {
      const key = `${expense.name}_${expense.category || ''}`;
      if (!seenExpenseNames.has(key)) {
        seenExpenseNames.add(key);
        uniqueExpenses.push({
          name: expense.name,
          category: expense.category,
          default_amount: expense.total_amount
        });
      }
    });
    console.log('Unique expenses:', uniqueExpenses.length);

    // Get all unique incomes from all months
    const allIncomes = this.db.get('incomes').value();
    console.log('All incomes from months:', allIncomes.length);
    console.log('Incomes data:', allIncomes);
    const uniqueIncomes = [];
    const seenIncomeNames = new Set();
    
    allIncomes.forEach(income => {
      const key = income.name;
      if (!seenIncomeNames.has(key)) {
        seenIncomeNames.add(key);
        uniqueIncomes.push({
          name: income.name,
          category: 'Dochód', // Default category for incomes
          default_amount: income.amount
        });
      }
    });
    console.log('Unique incomes:', uniqueIncomes.length);
    console.log('Unique incomes data:', uniqueIncomes);

    // Add to catalog if not already there
    const existingFixedExpenses = this.db.get('fixed_expenses_catalog').value();
    const existingExpenseNames = new Set(existingFixedExpenses.map(e => `${e.name}_${e.category || ''}`));
    
    let expensesMigrated = 0;
    uniqueExpenses.forEach(expense => {
      const key = `${expense.name}_${expense.category || ''}`;
      if (!existingExpenseNames.has(key)) {
        this.createFixedExpense(expense);
        expensesMigrated++;
      }
    });
    console.log('Expenses migrated:', expensesMigrated);

    const existingFixedIncomes = this.db.get('fixed_incomes_catalog').value();
    console.log('Existing fixed incomes before migration:', existingFixedIncomes);
    const existingIncomeNames = new Set(existingFixedIncomes.map(i => i.name));
    
    let incomesMigrated = 0;
    uniqueIncomes.forEach(income => {
      console.log('Checking income:', income.name, 'exists:', existingIncomeNames.has(income.name));
      if (!existingIncomeNames.has(income.name)) {
        console.log('Creating fixed income:', income);
        const created = this.createFixedIncome(income);
        console.log('Created income:', created);
        incomesMigrated++;
      }
    });
    console.log('Incomes migrated:', incomesMigrated);

    const finalFixedIncomes = this.db.get('fixed_incomes_catalog').value();
    console.log('Fixed incomes after migration:', finalFixedIncomes);

    return {
      expensesMigrated,
      incomesMigrated
    };
  }

  // Statistics methods
  getStatistics(startDate, endDate) {
    const months = this.db.get('months')
      .filter(m => m.start_date >= startDate && m.end_date <= endDate)
      .value();
    const monthIds = months.map(m => m.id);

    const incomes = this.db.get('incomes')
      .filter(i => monthIds.includes(i.month_id))
      .value();
    
    const expenses = this.db.get('expenses')
      .filter(e => monthIds.includes(e.month_id))
      .value();

    const incomeStats = {
      total: incomes.reduce((sum, i) => sum + i.amount, 0),
      count: incomes.length
    };

    const expenseStats = {
      total: expenses.reduce((sum, e) => sum + e.total_amount, 0),
      count: expenses.length
    };

    const categoryExpenses = expenses.reduce((acc, e) => {
      const category = e.category || 'Inne';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += e.total_amount;
      return acc;
    }, {});

    return {
      incomes: incomeStats,
      expenses: expenseStats,
      categoryExpenses: Object.entries(categoryExpenses).map(([category, total]) => ({
        category,
        total
      }))
    };
  }

  // Database cleanup method
  cleanupDatabase(options) {
    const results = {
      expenseNames: 0,
      incomeNames: 0,
      selectedMonths: 0,
      debtHistory: 0,
      piggybanks: 0
    };

    // Protected expense categories that should never be deleted
    const protectedCategories = ['Żywność', 'Spłata długu', 'Mieszkanie', 'Skarbonka', 'Rata'];

    // Clear expense names from catalog (wydatki stałe) - but keep protected ones
    if (options.expenseNames) {
      const allExpenses = this.db.get('fixed_expenses_catalog').value();
      const protectedExpenses = allExpenses.filter(e => protectedCategories.includes(e.category));
      const removedCount = allExpenses.length - protectedExpenses.length;
      this.db.set('fixed_expenses_catalog', protectedExpenses).write();
      results.expenseNames = removedCount;
    }

    // Clear income names from catalog (przychody stałe)
    if (options.incomeNames) {
      const count = this.db.get('fixed_incomes_catalog').size().value();
      this.db.set('fixed_incomes_catalog', []).write();
      results.incomeNames = count;
    }

    // Clear piggybanks
    if (options.piggybanks) {
      const count = this.db.get('piggybanks').size().value();
      this.db.set('piggybanks', []).write();
      results.piggybanks = count;
    }

    // Clear selected months from archive
    if (options.selectedMonths && Array.isArray(options.selectedMonths) && options.selectedMonths.length > 0) {
      const monthIds = options.selectedMonths;
      
      // Remove incomes for selected months
      const incomes = this.db.get('incomes').value();
      const remainingIncomes = incomes.filter(i => !monthIds.includes(i.month_id));
      this.db.set('incomes', remainingIncomes).write();
      
      // Remove expenses for selected months
      const expenses = this.db.get('expenses').value();
      const remainingExpenses = expenses.filter(e => !monthIds.includes(e.month_id));
      this.db.set('expenses', remainingExpenses).write();
      
      // Remove the months themselves
      const months = this.db.get('months').value();
      const remainingMonths = months.filter(m => !monthIds.includes(m.id));
      this.db.set('months', remainingMonths).write();
      
      results.selectedMonths = monthIds.length;
    }

    // Clear debt history (all debts and payments)
    if (options.debtHistory) {
      const count = this.db.get('debts').size().value();
      this.db.set('debts', []).write();
      this.db.set('debt_payments', []).write();
      results.debtHistory = count;
    }

    return results;
  }

  // Create backup of selected data
  createBackup(options) {
    const backup = {
      version: '1.0',
      created_at: new Date().toISOString(),
      data: {}
    };

    if (options.settings) {
      backup.data.settings = this.db.get('settings').value();
    }
    if (options.users) {
      backup.data.users = this.db.get('users').value();
    }
    if (options.months) {
      backup.data.months = this.db.get('months').value();
    }
    if (options.incomes) {
      backup.data.incomes = this.db.get('incomes').value();
    }
    if (options.expenses) {
      backup.data.expenses = this.db.get('expenses').value();
    }
    if (options.debts) {
      backup.data.debts = this.db.get('debts').value();
      backup.data.debt_payments = this.db.get('debt_payments').value();
    }
    if (options.fixedExpenses) {
      backup.data.fixed_expenses_catalog = this.db.get('fixed_expenses_catalog').value();
    }
    if (options.fixedIncomes) {
      backup.data.fixed_incomes_catalog = this.db.get('fixed_incomes_catalog').value();
    }
    if (options.piggybanks) {
      backup.data.piggybanks = this.db.get('piggybanks').value();
    }

    return backup;
  }

  // Restore data from backup
  restoreBackup(backup, options) {
    console.log('=== RESTORE BACKUP START ===');
    console.log('Options:', options);
    console.log('Backup data keys:', backup?.data ? Object.keys(backup.data) : 'no data');
    
    const results = {
      settings: false,
      users: 0,
      months: 0,
      incomes: 0,
      expenses: 0,
      debts: 0,
      fixedExpenses: 0,
      fixedIncomes: 0,
      piggybanks: 0
    };

    if (!backup || !backup.data) {
      console.log('ERROR: Invalid backup format');
      throw new Error('Invalid backup format');
    }

    if (options.settings && backup.data.settings) {
      // Preserve some settings that shouldn't be restored
      const currentSettings = this.db.get('settings').value();
      const restoredSettings = {
        ...backup.data.settings,
        developer_mode: currentSettings.developer_mode // Keep current dev mode
      };
      this.db.set('settings', restoredSettings).write();
      results.settings = true;
    }

    if (options.users && backup.data.users) {
      if (options.replaceExisting) {
        this.db.set('users', backup.data.users).write();
      } else {
        // Merge - add users that don't exist
        const existing = this.db.get('users').value();
        const existingUsernames = existing.map(u => u.username);
        const newUsers = backup.data.users.filter(u => !existingUsernames.includes(u.username));
        // Assign new IDs
        let maxId = Math.max(0, ...existing.map(u => u.id));
        newUsers.forEach(u => {
          u.id = ++maxId;
        });
        this.db.set('users', [...existing, ...newUsers]).write();
      }
      results.users = backup.data.users.length;
    }

    if (options.months && backup.data.months) {
      console.log('Processing months restore...');
      console.log('Backup months count:', backup.data.months.length);
      console.log('replaceExisting:', options.replaceExisting);
      
      if (options.replaceExisting) {
        this.db.set('months', backup.data.months).write();
        console.log('Months replaced');
        // Also restore related incomes and expenses
        if (backup.data.incomes) {
          this.db.set('incomes', backup.data.incomes).write();
          results.incomes = backup.data.incomes.length;
          console.log('Incomes restored:', results.incomes);
        }
        if (backup.data.expenses) {
          this.db.set('expenses', backup.data.expenses).write();
          results.expenses = backup.data.expenses.length;
          console.log('Expenses restored:', results.expenses);
        }
      } else {
        // Merge - add months that don't exist by name
        const existing = this.db.get('months').value();
        console.log('Existing months:', existing.map(m => m.name));
        const existingNames = existing.map(m => m.name);
        const newMonths = backup.data.months.filter(m => !existingNames.includes(m.name));
        console.log('New months to add:', newMonths.map(m => m.name));
        
        // Create ID mapping for related data
        const idMapping = {};
        let maxId = Math.max(0, ...existing.map(m => m.id));
        newMonths.forEach(m => {
          const oldId = m.id;
          m.id = ++maxId;
          idMapping[oldId] = m.id;
        });
        this.db.set('months', [...existing, ...newMonths]).write();
        
        // Add related incomes
        if (backup.data.incomes) {
          const existingIncomes = this.db.get('incomes').value();
          const newIncomes = backup.data.incomes
            .filter(i => idMapping[i.month_id])
            .map(i => ({
              ...i,
              id: Math.max(0, ...existingIncomes.map(e => e.id)) + 1,
              month_id: idMapping[i.month_id]
            }));
          let incomeId = Math.max(0, ...existingIncomes.map(e => e.id));
          newIncomes.forEach(i => i.id = ++incomeId);
          this.db.set('incomes', [...existingIncomes, ...newIncomes]).write();
          results.incomes = newIncomes.length;
        }
        
        // Add related expenses
        if (backup.data.expenses) {
          const existingExpenses = this.db.get('expenses').value();
          const newExpenses = backup.data.expenses
            .filter(e => idMapping[e.month_id])
            .map(e => ({
              ...e,
              month_id: idMapping[e.month_id]
            }));
          let expenseId = Math.max(0, ...existingExpenses.map(e => e.id));
          newExpenses.forEach(e => e.id = ++expenseId);
          this.db.set('expenses', [...existingExpenses, ...newExpenses]).write();
          results.expenses = newExpenses.length;
        }
      }
      results.months = backup.data.months.length;
    }

    if (options.debts && backup.data.debts) {
      if (options.replaceExisting) {
        this.db.set('debts', backup.data.debts).write();
        if (backup.data.debt_payments) {
          this.db.set('debt_payments', backup.data.debt_payments).write();
        }
      } else {
        // Merge debts
        const existing = this.db.get('debts').value();
        let maxId = Math.max(0, ...existing.map(d => d.id));
        const newDebts = backup.data.debts.map(d => ({
          ...d,
          id: ++maxId
        }));
        this.db.set('debts', [...existing, ...newDebts]).write();
      }
      results.debts = backup.data.debts.length;
    }

    if (options.fixedExpenses && backup.data.fixed_expenses_catalog) {
      if (options.replaceExisting) {
        this.db.set('fixed_expenses_catalog', backup.data.fixed_expenses_catalog).write();
      } else {
        const existing = this.db.get('fixed_expenses_catalog').value();
        const existingNames = existing.map(e => e.name);
        const newExpenses = backup.data.fixed_expenses_catalog.filter(e => !existingNames.includes(e.name));
        let maxId = Math.max(0, ...existing.map(e => e.id));
        newExpenses.forEach(e => e.id = ++maxId);
        this.db.set('fixed_expenses_catalog', [...existing, ...newExpenses]).write();
      }
      results.fixedExpenses = backup.data.fixed_expenses_catalog.length;
    }

    if (options.fixedIncomes && backup.data.fixed_incomes_catalog) {
      if (options.replaceExisting) {
        this.db.set('fixed_incomes_catalog', backup.data.fixed_incomes_catalog).write();
      } else {
        const existing = this.db.get('fixed_incomes_catalog').value();
        const existingNames = existing.map(i => i.name);
        const newIncomes = backup.data.fixed_incomes_catalog.filter(i => !existingNames.includes(i.name));
        let maxId = Math.max(0, ...existing.map(i => i.id));
        newIncomes.forEach(i => i.id = ++maxId);
        this.db.set('fixed_incomes_catalog', [...existing, ...newIncomes]).write();
      }
      results.fixedIncomes = backup.data.fixed_incomes_catalog.length;
    }

    if (options.piggybanks && backup.data.piggybanks) {
      if (options.replaceExisting) {
        this.db.set('piggybanks', backup.data.piggybanks).write();
      } else {
        const existing = this.db.get('piggybanks').value() || [];
        const existingNames = existing.map(p => p.name);
        const newPiggybanks = backup.data.piggybanks.filter(p => !existingNames.includes(p.name));
        let maxId = Math.max(0, ...existing.map(p => p.id));
        newPiggybanks.forEach(p => p.id = ++maxId);
        this.db.set('piggybanks', [...existing, ...newPiggybanks]).write();
      }
      results.piggybanks = backup.data.piggybanks.length;
    }

    console.log('=== RESTORE BACKUP END ===');
    console.log('Results:', results);
    return results;
  }

  close() {
    // Lowdb doesn't need explicit closing
  }
}

module.exports = DatabaseManager;
