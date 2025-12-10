const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { app } = require('electron');

// Manually construct path since app might not be initialized
const userDataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const dbPath = path.join(userDataPath, 'SiaSiek Budget', 'budget.json');

console.log('Database path:', dbPath);

const adapter = new FileSync(dbPath);
const db = low(adapter);

const months = db.get('months').value();
console.log('\nOstatnie miesiące:');
months.slice(-3).forEach(m => {
  console.log(`\nMiesiąc: ${m.name}`);
  console.log(`ID: ${m.id}`);
  console.log(`Data początkowa: ${m.start_date}`);
  console.log(`Data końcowa: ${m.end_date}`);
});

// Test funkcji getDaysRemaining
const today = new Date();
const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
console.log('\n\nDzisiaj:', today.toISOString().split('T')[0]);
console.log('Today UTC:', new Date(todayUTC).toISOString().split('T')[0]);

// Test dla grudnia
const decemberMonth = months.find(m => m.name.includes('Grudzień 2025') || m.name.includes('grudzień 2025'));
if (decemberMonth) {
  console.log('\n\nTestowanie dla grudnia:');
  console.log('Start date:', decemberMonth.start_date);
  console.log('End date:', decemberMonth.end_date);
  
  const [startYear, startMonth, startDay] = decemberMonth.start_date.split('-').map(Number);
  const startUTC = Date.UTC(startYear, startMonth - 1, startDay);
  
  const [endYear, endMonth, endDay] = decemberMonth.end_date.split('-').map(Number);
  const endUTC = Date.UTC(endYear, endMonth - 1, endDay);
  
  console.log('Start UTC:', new Date(startUTC).toISOString().split('T')[0]);
  console.log('End UTC:', new Date(endUTC).toISOString().split('T')[0]);
  console.log('Today < Start?', todayUTC < startUTC);
  
  if (todayUTC < startUTC) {
    const totalDays = Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;
    console.log('Okres się nie rozpoczął, całkowita liczba dni:', totalDays);
  } else {
    const remaining = Math.floor((endUTC - todayUTC) / (1000 * 60 * 60 * 24));
    console.log('Okres trwa, dni pozostałych:', remaining);
  }
}
