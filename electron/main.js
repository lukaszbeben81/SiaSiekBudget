const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database');
const { getRandomJoke } = require('./jokes');

// Wersja aplikacji
const APP_VERSION = '1.0.0';
const GITHUB_REPO = 'SiaSiek/SiaSiekBudget';

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#141414',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Wymagane dla ES modules w file:// protokole
      webSecurity: false
    }
  });

  // Load React app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // W produkcji - ładuj z folderu dist
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database
  console.log('Initializing database...');
  db = new Database();
  console.log('Database initialized');
  
  // Always disable developer mode on startup
  db.updateSettings({ developer_mode: 0 });
  console.log('Developer mode disabled on startup');
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});

// IPC handlers for database operations
ipcMain.handle('db:getSettings', async () => {
  console.log('IPC: getSettings called');
  try {
    const result = db.getSettings();
    console.log('IPC: getSettings result:', result);
    return result;
  } catch (error) {
    console.error('IPC: getSettings error:', error);
    throw error;
  }
});

ipcMain.handle('db:updateSettings', async (event, settings) => {
  console.log('IPC: updateSettings called with:', settings);
  try {
    const result = db.updateSettings(settings);
    console.log('IPC: updateSettings result:', result);
    return result;
  } catch (error) {
    console.error('IPC: updateSettings error:', error);
    throw error;
  }
});

ipcMain.handle('db:isFirstRun', async () => {
  console.log('IPC: isFirstRun called');
  try {
    const result = db.isFirstRun();
    console.log('IPC: isFirstRun result:', result);
    return result;
  } catch (error) {
    console.error('IPC: isFirstRun error:', error);
    throw error;
  }
});

ipcMain.handle('db:createAdminUser', async (event, username, password) => {
  console.log('IPC: createAdminUser called with username:', username);
  try {
    const result = await db.createAdminUser(username, password);
    console.log('IPC: createAdminUser result:', result);
    return result;
  } catch (error) {
    console.error('IPC: createAdminUser error:', error);
    throw error;
  }
});

ipcMain.handle('db:login', async (event, username, password) => {
  return db.login(username, password);
});

ipcMain.handle('db:getUsers', async () => {
  return db.getUsers();
});

ipcMain.handle('db:createUser', async (event, userData) => {
  return db.createUser(userData);
});

ipcMain.handle('db:updateUser', async (event, userId, userData) => {
  return db.updateUser(userId, userData);
});

ipcMain.handle('db:deleteUser', async (event, userId) => {
  return db.deleteUser(userId);
});

ipcMain.handle('db:getMonths', async () => {
  return db.getMonths();
});

ipcMain.handle('db:getMonth', async (event, monthId) => {
  return db.getMonth(monthId);
});

ipcMain.handle('db:createMonth', async (event, monthData) => {
  return db.createMonth(monthData);
});

ipcMain.handle('db:getIncomes', async (event, monthId) => {
  return db.getIncomes(monthId);
});

ipcMain.handle('db:createIncome', async (event, incomeData) => {
  return db.createIncome(incomeData);
});

ipcMain.handle('db:updateIncome', async (event, incomeId, incomeData) => {
  return db.updateIncome(incomeId, incomeData);
});

ipcMain.handle('db:deleteIncome', async (event, incomeId) => {
  return db.deleteIncome(incomeId);
});

ipcMain.handle('db:getExpenses', async (event, monthId) => {
  return db.getExpenses(monthId);
});

ipcMain.handle('db:createExpense', async (event, expenseData) => {
  return db.createExpense(expenseData);
});

ipcMain.handle('db:updateExpense', async (event, expenseId, expenseData) => {
  return db.updateExpense(expenseId, expenseData);
});

ipcMain.handle('db:deleteExpense', async (event, expenseId) => {
  return db.deleteExpense(expenseId);
});

ipcMain.handle('db:getDebts', async (event, monthId) => {
  return db.getDebts(monthId);
});

ipcMain.handle('db:createDebt', async (event, debtData) => {
  return db.createDebt(debtData);
});

ipcMain.handle('db:updateDebt', async (event, debtId, debtData) => {
  return db.updateDebt(debtId, debtData);
});

ipcMain.handle('db:payDebt', async (event, debtId, amount) => {
  return db.payDebt(debtId, amount);
});

ipcMain.handle('db:getFixedExpenses', async () => {
  return db.getFixedExpenses();
});

ipcMain.handle('db:createFixedExpense', async (event, expenseData) => {
  return db.createFixedExpense(expenseData);
});

ipcMain.handle('db:updateFixedExpense', async (event, expenseId, expenseData) => {
  return db.updateFixedExpense(expenseId, expenseData);
});

ipcMain.handle('db:deleteFixedExpense', async (event, expenseId) => {
  return db.deleteFixedExpense(expenseId);
});

// Fixed Incomes Catalog
ipcMain.handle('db:getFixedIncomes', async () => {
  const incomes = db.getFixedIncomes();
  console.log('IPC: getFixedIncomes called, returning:', incomes);
  return incomes;
});

ipcMain.handle('db:createFixedIncome', async (event, incomeData) => {
  console.log('IPC: createFixedIncome called with:', incomeData);
  return db.createFixedIncome(incomeData);
});

ipcMain.handle('db:updateFixedIncome', async (event, incomeId, incomeData) => {
  return db.updateFixedIncome(incomeId, incomeData);
});

ipcMain.handle('db:deleteFixedIncome', async (event, incomeId) => {
  return db.deleteFixedIncome(incomeId);
});

// Piggybanks (Skarbonki)
ipcMain.handle('db:getPiggybanks', async () => {
  return db.getPiggybanks();
});

ipcMain.handle('db:createPiggybank', async (event, piggybankData) => {
  return db.createPiggybank(piggybankData);
});

ipcMain.handle('db:updatePiggybank', async (event, piggybankId, piggybankData) => {
  return db.updatePiggybank(piggybankId, piggybankData);
});

ipcMain.handle('db:deletePiggybank', async (event, piggybankId) => {
  return db.deletePiggybank(piggybankId);
});

ipcMain.handle('db:depositToPiggybank', async (event, piggybankId, amount) => {
  return db.depositToPiggybank(piggybankId, amount);
});

// Planned Expenses (Zaplanowane wydatki)
ipcMain.handle('db:getPlannedExpenses', async () => {
  return db.getPlannedExpenses();
});

ipcMain.handle('db:createPlannedExpense', async (event, expenseData) => {
  return db.createPlannedExpense(expenseData);
});

ipcMain.handle('db:updatePlannedExpense', async (event, expenseId, expenseData) => {
  return db.updatePlannedExpense(expenseId, expenseData);
});

ipcMain.handle('db:deletePlannedExpense', async (event, expenseId) => {
  return db.deletePlannedExpense(expenseId);
});

ipcMain.handle('db:completePlannedExpense', async (event, expenseId) => {
  return db.completePlannedExpense(expenseId);
});

ipcMain.handle('db:migrateExistingToCatalog', async () => {
  console.log('IPC: migrateExistingToCatalog called');
  const result = db.migrateExistingToCatalog();
  console.log('IPC: migrateExistingToCatalog result:', result);
  return result;
});

ipcMain.handle('db:getStatistics', async (event, startDate, endDate) => {
  return db.getStatistics(startDate, endDate);
});

ipcMain.handle('db:cleanupDatabase', async (event, options) => {
  try {
    return db.cleanupDatabase(options);
  } catch (error) {
    console.error('Cleanup database error:', error);
    throw error;
  }
});

// Backup
ipcMain.handle('db:createBackup', async (event, options) => {
  try {
    return db.createBackup(options);
  } catch (error) {
    console.error('Create backup error:', error);
    throw error;
  }
});

ipcMain.handle('db:restoreBackup', async (event, backup, options) => {
  try {
    return db.restoreBackup(backup, options);
  } catch (error) {
    console.error('Restore backup error:', error);
    throw error;
  }
});

ipcMain.handle('dialog:saveBackup', async (event, backupData) => {
  const { dialog } = require('electron');
  const fs = require('fs');
  
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Zapisz kopię zapasową',
    defaultPath: `siasiek-budget-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });
  
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(backupData, null, 2), 'utf-8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

ipcMain.handle('dialog:openBackup', async () => {
  const { dialog } = require('electron');
  const fs = require('fs');
  
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Wybierz plik kopii zapasowej',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    try {
      const backup = JSON.parse(content);
      return { success: true, backup };
    } catch (e) {
      return { success: false, error: 'Invalid JSON file' };
    }
  }
  return { success: false };
});

// Fetch random Polish joke (local database)
ipcMain.handle('api:fetchJoke', async () => {
  try {
    const joke = getRandomJoke();
    return { success: true, joke };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Get app version
ipcMain.handle('app:getVersion', async () => {
  return APP_VERSION;
});

// Check for updates from GitHub
ipcMain.handle('app:checkForUpdates', async () => {
  const https = require('https');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      method: 'GET',
      headers: { 
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SiaSiekBudget-App'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.tag_name) {
            const latestVersion = json.tag_name.replace('v', '');
            const hasUpdate = compareVersions(latestVersion, APP_VERSION) > 0;
            resolve({ 
              success: true, 
              currentVersion: APP_VERSION,
              latestVersion,
              hasUpdate,
              releaseUrl: json.html_url,
              releaseNotes: json.body || 'Brak opisu'
            });
          } else {
            resolve({ success: false, error: 'Brak wydań', currentVersion: APP_VERSION });
          }
        } catch (e) {
          resolve({ success: false, error: 'Parse error', currentVersion: APP_VERSION });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({ success: false, error: e.message, currentVersion: APP_VERSION });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout', currentVersion: APP_VERSION });
    });
    
    req.end();
  });
});

// Compare version strings (returns 1 if a > b, -1 if a < b, 0 if equal)
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}
