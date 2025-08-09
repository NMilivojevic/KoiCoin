import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Currency, type ExchangeRates } from '../utils/currency';

interface CurrencyContextType {
  currency: Currency;
  exchangeRates: ExchangeRates;
  setCurrency: (currency: Currency) => void;
  refreshRates: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  initialCurrency?: Currency;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ 
  children, 
  initialCurrency = 'RSD' 
}) => {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ EUR: 117.5, USD: 107.8, HUF: 0.3 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/user/exchange-rates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates');
      console.warn('Using fallback exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const setCurrency = async (newCurrency: Currency) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3001/api/user/currency', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currency: newCurrency })
      });

      if (!response.ok) {
        throw new Error('Failed to update currency preference');
      }

      setCurrencyState(newCurrency);
      
      // Update stored user data
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          user.currency = newCurrency;
          localStorage.setItem('user', JSON.stringify(user));
        } catch (err) {
          console.warn('Failed to update user data in localStorage');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update currency');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load currency from stored user data
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.currency) {
          setCurrencyState(user.currency);
        }
      } catch (err) {
        console.warn('Failed to parse user data from localStorage');
      }
    }

    // Only fetch exchange rates if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetchExchangeRates();
    }
  }, []);

  const value = {
    currency,
    exchangeRates,
    setCurrency,
    refreshRates: fetchExchangeRates,
    loading,
    error
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};