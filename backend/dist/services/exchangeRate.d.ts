import { type ExchangeRates } from '../utils/currency';
declare class ExchangeRateService {
    private cachedRates;
    private lastFetchTime;
    private readonly CACHE_DURATION;
    private readonly fallbackRates;
    getExchangeRates(): Promise<ExchangeRates>;
    getExchangeRatesBackup(): Promise<ExchangeRates>;
}
export declare const exchangeRateService: ExchangeRateService;
export {};
//# sourceMappingURL=exchangeRate.d.ts.map