import { type ExchangeRates } from '../utils/currency';

interface ExchangeRateAPIResponse {
  rates: {
    EUR: number;
    USD: number;
    [key: string]: number;
  };
}

class ExchangeRateService {
  private cachedRates: ExchangeRates | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  
  // Fallback rates in case API is unavailable
  private readonly fallbackRates: ExchangeRates = {
    EUR: 117.5, // 1 EUR = 117.5 RSD (approximate)
    USD: 107.8  // 1 USD = 107.8 RSD (approximate)
  };

  async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (this.cachedRates && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cachedRates;
    }

    try {
      // Try to fetch from exchangerate-api.io (free tier)
      const response = await fetch('https://api.exchangerate-api.io/v4/latest/RSD');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json() as ExchangeRateAPIResponse;
      
      // Validate API response structure
      if (!data.rates || typeof data.rates.EUR !== 'number' || typeof data.rates.USD !== 'number') {
        throw new Error('Invalid API response format');
      }
      
      // The API returns rates from RSD to other currencies
      // We need rates for how many RSD = 1 EUR/USD
      const rates: ExchangeRates = {
        EUR: 1 / data.rates.EUR, // Convert to RSD per EUR
        USD: 1 / data.rates.USD  // Convert to RSD per USD
      };

      this.cachedRates = rates;
      this.lastFetchTime = now;
      
      console.log('Exchange rates updated:', rates);
      return rates;
      
    } catch (error) {
      console.warn('Failed to fetch live exchange rates, using fallback:', error);
      
      // Use fallback rates if API fails
      if (!this.cachedRates) {
        this.cachedRates = this.fallbackRates;
      }
      
      return this.cachedRates;
    }
  }

  // Alternative free API as backup
  async getExchangeRatesBackup(): Promise<ExchangeRates> {
    try {
      const response = await fetch('https://api.fixer.io/latest?access_key=YOUR_API_KEY&base=RSD');
      
      if (!response.ok) {
        throw new Error('Backup API failed');
      }

      const data = await response.json() as ExchangeRateAPIResponse;
      
      return {
        EUR: 1 / data.rates.EUR,
        USD: 1 / data.rates.USD
      };
      
    } catch (error) {
      console.warn('Backup API also failed:', error);
      return this.fallbackRates;
    }
  }
}

export const exchangeRateService = new ExchangeRateService();