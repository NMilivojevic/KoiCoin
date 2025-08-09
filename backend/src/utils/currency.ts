export type Currency = 'RSD' | 'EUR' | 'USD';

export interface ExchangeRates {
  EUR: number;
  USD: number;
}

export const currencySymbols: Record<Currency, string> = {
  RSD: 'дин',
  EUR: '€',
  USD: '$'
};

export const currencyNames: Record<Currency, string> = {
  RSD: 'Serbian Dinar',
  EUR: 'Euro',
  USD: 'US Dollar'
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
  
  return amountInRSD;
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  const symbol = currencySymbols[currency];
  const formattedAmount = amount.toFixed(2);
  
  if (currency === 'RSD') {
    return `${formattedAmount} ${symbol}`;
  }
  
  return `${symbol}${formattedAmount}`;
};

export const formatCurrencyFromRSD = (amountInRSD: number, targetCurrency: Currency, exchangeRates: ExchangeRates): string => {
  const convertedAmount = convertFromRSD(amountInRSD, targetCurrency, exchangeRates);
  return formatCurrency(convertedAmount, targetCurrency);
};