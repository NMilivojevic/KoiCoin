export type Currency = 'RSD' | 'EUR' | 'USD' | 'HUF';

export interface ExchangeRates {
  EUR: number;
  USD: number;
  HUF: number;
}

export const currencySymbols: Record<Currency, string> = {
  RSD: 'дин',
  EUR: '€',
  USD: '$',
  HUF: 'Ft'
};

export const currencyNames: Record<Currency, string> = {
  RSD: 'Serbian Dinar (RSD)',
  EUR: 'Euro (EUR)',
  USD: 'US Dollar (USD)',
  HUF: 'Hungarian Forint (HUF)'
};

export const convertFromRSD = (amountInRSD: number, toCurrency: Currency, exchangeRates: ExchangeRates): number => {
  if (toCurrency === 'RSD') {
    return amountInRSD;
  }
  
  if (toCurrency === 'EUR') {
    return amountInRSD / exchangeRates.EUR;
  }
  
  if (toCurrency === 'USD') {
    return amountInRSD / exchangeRates.USD;
  }
  
  if (toCurrency === 'HUF') {
    return amountInRSD / exchangeRates.HUF;
  }
  
  return amountInRSD;
};

// Convert between any two currencies
export const convertCurrency = (
  amount: number, 
  fromCurrency: Currency, 
  toCurrency: Currency, 
  exchangeRates: ExchangeRates
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // First convert to RSD as base currency
  let amountInRSD = amount;
  if (fromCurrency !== 'RSD') {
    switch (fromCurrency) {
      case 'EUR':
        amountInRSD = amount * exchangeRates.EUR;
        break;
      case 'USD':
        amountInRSD = amount * exchangeRates.USD;
        break;
      case 'HUF':
        amountInRSD = amount * exchangeRates.HUF;
        break;
    }
  }

  // Then convert from RSD to target currency
  return convertFromRSD(amountInRSD, toCurrency, exchangeRates);
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  const symbol = currencySymbols[currency];
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  if (currency === 'RSD' || currency === 'HUF') {
    return `${formattedAmount} ${symbol}`;
  }
  
  return `${symbol}${formattedAmount}`;
};

// Format currency with original transaction currency (not converted)
export const formatTransactionCurrency = (amount: number, currency: Currency): string => {
  return formatCurrency(amount, currency);
};

export const formatCurrencyFromRSD = (amountInRSD: number, targetCurrency: Currency, exchangeRates: ExchangeRates): string => {
  const convertedAmount = convertFromRSD(amountInRSD, targetCurrency, exchangeRates);
  return formatCurrency(convertedAmount, targetCurrency);
};