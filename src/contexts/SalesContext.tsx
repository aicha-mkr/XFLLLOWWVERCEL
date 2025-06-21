import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Sale } from '@/types';
import { dbService } from '@/data/dbService';
import { useProducts } from '@/hooks/use-products';

type SalesContextType = {
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Sale>;
  updateSale: (saleId: string, saleData: Partial<Sale>) => Promise<Sale>;
  deleteSale: (saleId: string) => Promise<void>;
  getSaleById: (saleId: string) => Sale | undefined;
  isLoading: boolean;
  refreshSales: () => Promise<void>;
};

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshProducts } = useProducts();

  const refreshSales = useCallback(async () => {
    console.log('[SalesContext] Refreshing sales...');
    setIsLoading(true);
    try {
      const loadedSales = await dbService.getSales();
      console.log(`[SalesContext] Loaded ${loadedSales.length} sales from dbService. IDs:`, loadedSales.map(s => s.id));
      setSales(loadedSales);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setIsLoading(false);
      console.log('[SalesContext] Finished refreshing sales.');
    }
  }, []);

  useEffect(() => {
    console.log('[SalesContext] Initializing and loading sales.');
    refreshSales();

    const handleSalesChanged = () => {
      console.log('[SalesContext] Detected sales-changed event. Refreshing sales.');
      refreshSales();
    };

    window.addEventListener('sales-changed', handleSalesChanged);

    return () => {
      window.removeEventListener('sales-changed', handleSalesChanged);
    };
  }, [refreshSales]);

  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newSale = await dbService.createSale(sale);
      await refreshSales();
      await refreshProducts();
      console.log('[SalesContext] Sale created. Now attempting to refresh products...');
      return newSale;
    } catch (error) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  };

  const updateSale = async (saleId: string, saleData: Partial<Sale>) => {
    try {
      const updatedSale = await dbService.updateSale(saleId, saleData);
      await refreshSales();
      return updatedSale;
    } catch (error) {
      console.error('Failed to update sale:', error);
      throw error;
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      await dbService.deleteSale(saleId);
      await refreshSales();
    } catch (error) {
      console.error('Failed to delete sale:', error);
      throw error;
    }
  };
  
  const getSaleById = (saleId: string) => {
    console.log(`[SalesContext] getSaleById called for ID: ${saleId}`);
    console.log(`[SalesContext] Current sales in state:`, sales.map(s => s.id));
    const sale = sales.find(s => s.id === saleId);
    console.log(`[SalesContext] Found sale:`, sale ? sale.id : 'Not Found');
    return sale;
  };

  return (
    <SalesContext.Provider value={{ sales, addSale, updateSale, deleteSale, getSaleById, isLoading, refreshSales }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}; 