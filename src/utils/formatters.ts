// Safe number conversion utility
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) || !isFinite(num) ? 0 : num;
};

// Safe currency formatting with NaN protection
export const formatCurrency = (amount: any): string => {
  const safeAmount = safeNumber(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(safeAmount);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatPercentage = (value: any): string => {
  const safeValue = safeNumber(value);
  return `${Math.round(safeValue)}%`;
};

// Safe reduce utility for financial calculations
export const safeSum = (items: any[], accessor?: (item: any) => any): number => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  
  return items.reduce((sum, item) => {
    const value = accessor ? accessor(item) : item;
    return sum + safeNumber(value);
  }, 0);
};

// Safe financial calculations
export const calculateTotal = (transactions: any[], type?: 'income' | 'expense'): number => {
  if (!Array.isArray(transactions)) return 0;
  
  const filtered = type ? transactions.filter(t => t?.type === type) : transactions;
  return safeSum(filtered, (t) => t?.amount);
};