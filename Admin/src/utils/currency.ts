/**
 * Currency utility functions for the NewRan e-commerce system
 * All prices are handled in Kenyan Shillings (KSH)
 */

export const formatCurrency = (amount: number | string, showSymbol: boolean = true): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return showSymbol ? 'KSH 0.00' : '0.00';
  }

  const formatted = numAmount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return showSymbol ? `KSH ${formatted}` : formatted;
};

export const formatPriceRange = (min: number, max: number): string => {
  if (min === max) {
    return formatCurrency(min);
  }
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

export const parseCurrencyInput = (value: string): number => {
  // Remove KSH, commas, and spaces, then parse
  const cleaned = value.replace(/[KSH\s,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const validatePrice = (price: number): { isValid: boolean; message?: string } => {
  if (price < 0) {
    return { isValid: false, message: 'Price cannot be negative' };
  }
  
  if (price > 10000000) {
    return { isValid: false, message: 'Price is too high (max 10M KSH)' };
  }
  
  return { isValid: true };
};

// Currency symbol constant
export const CURRENCY_SYMBOL = 'KSH';
export const CURRENCY_CODE = 'KES'; // Kenya Shillings ISO code
