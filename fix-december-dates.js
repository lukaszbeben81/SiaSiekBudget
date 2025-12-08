const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Ścieżka do bazy danych
const userDataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const dbPath = path.join(userDataPath, 'siasiek-budget', 'budget.json');

console.log('Ścieżka do bazy:', dbPath);

// Wczytaj bazę
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('Obecne miesiące:');
db.months.forEach(m => {
  console.log(`- ${m.name}: ${m.start_date} do ${m.end_date}`);
});

// Znajdź miesiąc "grudzień 2025"
const decemberMonth = db.months.find(m => m.name === 'grudzień 2025');

if (decemberMonth) {
  console.log('\nZnaleziono miesiąc grudzień 2025');
  console.log('Stare daty:', decemberMonth.start_date, '-', decemberMonth.end_date);
  
  // Popraw daty
  decemberMonth.start_date = '2025-12-10';
  decemberMonth.end_date = '2026-01-09';
  
  console.log('Nowe daty:', decemberMonth.start_date, '-', decemberMonth.end_date);
  
  // Zapisz z backupem
  const backupPath = dbPath + '.backup-' + Date.now();
  fs.copyFileSync(dbPath, backupPath);
  console.log('Backup utworzony:', backupPath);
  
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('Baza zaktualizowana!');
} else {
  console.log('Nie znaleziono miesiąca "grudzień 2025"');
}
