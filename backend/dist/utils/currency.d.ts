export type Currency = 'RSD' | 'EUR' | 'USD';
export interface ExchangeRates {
    EUR: number;
    USD: number;
}
export declare const currencySymbols: Record<Currency, string>;
export declare const currencyNames: Record<Currency, string>;
export declare const convertFromRSD: (amountInRSD: number, toCurrency: Currency, exchangeRates: ExchangeRates) => number;
export declare const formatCurrency: (amount: number, currency: Currency) => string;
export declare const formatCurrencyFromRSD: (amountInRSD: number, targetCurrency: Currency, exchangeRates: ExchangeRates) => string;
//# sourceMappingURL=currency.d.ts.map