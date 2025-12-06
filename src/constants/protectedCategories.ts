// Chronione kategorie wydatków - nie można ich usunąć z systemu
export const PROTECTED_EXPENSE_CATEGORIES = [
  'Żywność',
  'Spłata długu', 
  'Mieszkanie',
  'Skarbonka',
  'Rata'
];

// Chronione kategorie dochodów - nie można ich usunąć z systemu
export const PROTECTED_INCOME_CATEGORIES = [
  'Wynagrodzenie podstawowe',
  'Świadczenia'
];

// Funkcja pomocnicza do sprawdzenia czy kategoria wydatku jest chroniona
export const isProtectedExpenseCategory = (category: string | undefined): boolean => {
  return category ? PROTECTED_EXPENSE_CATEGORIES.includes(category) : false;
};

// Funkcja pomocnicza do sprawdzenia czy kategoria dochodu jest chroniona
export const isProtectedIncomeCategory = (category: string | undefined): boolean => {
  return category ? PROTECTED_INCOME_CATEGORIES.includes(category) : false;
};
