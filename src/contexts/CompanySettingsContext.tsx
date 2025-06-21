import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { CompanySettings, CompanySettingsContextType } from '@/types';

// Default company settings
const defaultSettings: CompanySettings = {
  name: "Xflow",
  address: "",
  phone: "",
  email: "",
  website: "",
  taxId: "",
  logoUrl: "",
  currency: "TND",
  lowStockThreshold: 10,
  enableLowStockAlert: true,
  invoiceCounter: 1,
  companyName: "Xflow",
  taxNumber: "",
  bankAccount: "",
  rib: "",
  bankName: "",
  bankRib: "",
};

// Available currencies
export const availableCurrencies = [
  { code: "TND", name: "Dinar Tunisien" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "MAD", name: "Dirham Marocain" }
];

// Create context
const CompanySettingsContext = createContext<CompanySettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  availableCurrencies: availableCurrencies
});

// Provider component
export const CompanySettingsProvider = ({ children }: { children: ReactNode }) => {
  // Try to load settings from localStorage
  const loadSettings = (): CompanySettings => {
    try {
      const savedSettings = localStorage.getItem('companySettings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
      return defaultSettings;
    }
  };

  const [settings, setSettings] = useState<CompanySettings>(loadSettings);

  // Update settings and save to localStorage
  const updateSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('companySettings', JSON.stringify(newSettings));
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      const event = new CustomEvent('currencyChanged', { 
        detail: { 
          currency: newSettings.currency,
          settings: newSettings 
        } 
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  };

  // Broadcast settings change to trigger updates in components
  useEffect(() => {
    // Create a custom event to broadcast settings changes
    const event = new CustomEvent('companySettingsChanged', { detail: settings });
    window.dispatchEvent(event);
  }, [settings]);

  return (
    <CompanySettingsContext.Provider value={{ 
      settings, 
      updateSettings,
      availableCurrencies
    }}>
      {children}
    </CompanySettingsContext.Provider>
  );
};

// Custom hook for using company settings
export const useCompanySettings = () => useContext(CompanySettingsContext);

export default CompanySettingsContext;
