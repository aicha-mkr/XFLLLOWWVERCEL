
import { createContext, useContext, useEffect, useState } from 'react';
import { useCompanySettings } from '@/contexts/CompanySettingsContext';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings, updateSettings } = useCompanySettings();
  const [currency, setCurrencyState] = useState<string>(settings.currency || 'TND');
  const [isLoading, setIsLoading] = useState(false);

  // Synchroniser avec les paramètres de l'entreprise
  useEffect(() => {
    if (settings.currency && settings.currency !== currency) {
      setCurrencyState(settings.currency);
    }
  }, [settings.currency]);

  // Écouter les changements de devise depuis d'autres composants
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      const newCurrency = event.detail.currency;
      if (newCurrency && newCurrency !== currency) {
        setCurrencyState(newCurrency);
      }
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, [currency]);

  const setCurrency = async (newCurrency: string) => {
    try {
      setIsLoading(true);
      setCurrencyState(newCurrency);
      
      // Mettre à jour les paramètres de l'entreprise
      const updatedSettings = {
        ...settings,
        currency: newCurrency
      };
      
      updateSettings(updatedSettings);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la monnaie:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    try {
      switch (currency) {
        case 'TND':
          return new Intl.NumberFormat('fr-TN', { 
            style: 'currency', 
            currency: 'TND', 
            minimumFractionDigits: 3 
          }).format(amount);
        case 'EUR':
          return new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR', 
            minimumFractionDigits: 2 
          }).format(amount);
        case 'USD':
          return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD', 
            minimumFractionDigits: 2 
          }).format(amount);
        case 'MAD':
          return new Intl.NumberFormat('ar-MA', { 
            style: 'currency', 
            currency: 'MAD', 
            minimumFractionDigits: 2 
          }).format(amount);
        default:
          return new Intl.NumberFormat('fr-TN', { 
            style: 'currency', 
            currency: currency, 
            minimumFractionDigits: 2 
          }).format(amount);
      }
    } catch (error) {
      console.error('Erreur de formatage de la monnaie:', error);
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  const value = {
    currency,
    setCurrency,
    formatCurrency,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
