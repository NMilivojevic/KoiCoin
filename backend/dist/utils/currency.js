"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrencyFromRSD = exports.formatCurrency = exports.convertFromRSD = exports.currencyNames = exports.currencySymbols = void 0;
exports.currencySymbols = {
    RSD: 'дин',
    EUR: '€',
    USD: '$'
};
exports.currencyNames = {
    RSD: 'Serbian Dinar',
    EUR: 'Euro',
    USD: 'US Dollar'
};
const convertFromRSD = (amountInRSD, toCurrency, exchangeRates) => {
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
exports.convertFromRSD = convertFromRSD;
const formatCurrency = (amount, currency) => {
    const symbol = exports.currencySymbols[currency];
    const formattedAmount = amount.toFixed(2);
    if (currency === 'RSD') {
        return `${formattedAmount} ${symbol}`;
    }
    return `${symbol}${formattedAmount}`;
};
exports.formatCurrency = formatCurrency;
const formatCurrencyFromRSD = (amountInRSD, targetCurrency, exchangeRates) => {
    const convertedAmount = (0, exports.convertFromRSD)(amountInRSD, targetCurrency, exchangeRates);
    return (0, exports.formatCurrency)(convertedAmount, targetCurrency);
};
exports.formatCurrencyFromRSD = formatCurrencyFromRSD;
//# sourceMappingURL=currency.js.map