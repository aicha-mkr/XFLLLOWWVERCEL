import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Purchase } from '@/types';
import { dbService } from '@/data/dbService';

type PurchasesContextType = {
  purchases: Purchase[];
  addPurchase: (purchase: Purchase) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  getPurchaseStats: () => {
    totalPurchases: number;
    totalSpent: number;
    recentPurchases: Purchase[];
  };
  isLoading: boolean;
};

const PurchasesContext = createContext<PurchasesContextType | undefined>(undefined);

export const PurchasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPurchases = async () => {
      setIsLoading(true);
      try {
        const loadedPurchases = await dbService.getPurchases();
        const formattedPurchases = loadedPurchases.map(p => ({
          ...p,
          total: parseFloat(p.total as any) || 0,
        }));
        setPurchases(formattedPurchases);
      } catch (error) {
        console.error('Failed to load purchases:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPurchases();
  }, []);

  const addPurchase = async (purchase: Purchase) => {
    try {
      await dbService.addPurchase(purchase);
      setPurchases(prev => [...prev, purchase]);
    } catch (error) {
      console.error('Failed to add purchase:', error);
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      await dbService.deletePurchase(id);
      setPurchases(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
  };

  const getPurchaseStats = () => {
    const recentPurchases = [...purchases]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
      
    return {
      totalPurchases: purchases.length,
      totalSpent: purchases.reduce((sum, p) => sum + p.total, 0),
      recentPurchases,
    };
  };

  return (
    <PurchasesContext.Provider value={{ purchases, addPurchase, deletePurchase, getPurchaseStats, isLoading }}>
      {children}
    </PurchasesContext.Provider>
  );
};

export const usePurchases = () => {
  const context = useContext(PurchasesContext);
  if (context === undefined) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }
  return context;
};
