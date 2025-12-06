import { format, differenceInDays, addMonths, endOfMonth, addDays, getDay } from 'date-fns';
import { pl } from 'date-fns/locale';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd.MM.yyyy', { locale: pl });
};

export const formatDateLong = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMMM yyyy', { locale: pl });
};

export const getDaysRemaining = (endDate: string): number => {
  return differenceInDays(new Date(endDate), new Date());
};

export const calculateBillingPeriod = (billingDay: number, referenceDate: Date = new Date()): { start: Date; end: Date } => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  
  // Handle "last day" option (billing_day > 28)
  if (billingDay > 28) {
    const start = endOfMonth(new Date(year, month, 1));
    const end = endOfMonth(addMonths(start, 1));
    return { start, end };
  }
  
  const currentMonthBillingDate = new Date(year, month, billingDay);
  
  if (referenceDate >= currentMonthBillingDate) {
    // We're past the billing day this month, so period starts this month
    const start = currentMonthBillingDate;
    const end = addDays(addMonths(start, 1), -1);
    return { start, end };
  } else {
    // We haven't reached the billing day yet, so period started last month
    const start = addMonths(currentMonthBillingDate, -1);
    const end = addDays(currentMonthBillingDate, -1);
    return { start, end };
  }
};

export const getMonthName = (date: Date): string => {
  return format(date, 'LLLL yyyy', { locale: pl });
};

export const getSaturdaysInPeriod = (startDate: string, endDate: string): number => {
  let count = 0;
  let current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    if (getDay(current) === 6) { // 6 = Saturday
      count++;
    }
    current = addDays(current, 1);
  }
  
  return count;
};

export const getDaysInPeriod = (startDate: string, endDate: string): number => {
  return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
};

export const calculateRemaining = (
  totalIncome: number,
  totalExpenses: number,
  weeklyCosts: number,
  saturdays: number,
  dailyCosts: number,
  days: number
): number => {
  const weeklyTotal = weeklyCosts * saturdays;
  const dailyTotal = dailyCosts * days;
  const remaining = totalIncome - totalExpenses - weeklyTotal - dailyTotal;
  return remaining;
};

export const calculateToPay = (expenses: Array<{ total_amount: number; paid_amount: number }>): number => {
  return expenses.reduce((sum, expense) => {
    return sum + (expense.total_amount - expense.paid_amount);
  }, 0);
};

/**
 * Handler for onFocus event that clears field if value is 0
 * Use: onFocus={(e) => clearZeroOnFocus(e)}
 */
export const clearZeroOnFocus = (e: React.FocusEvent<HTMLInputElement>): void => {
  if (e.target.value === '0' || e.target.value === '0.00' || parseFloat(e.target.value) === 0) {
    e.target.value = '';
  }
};
