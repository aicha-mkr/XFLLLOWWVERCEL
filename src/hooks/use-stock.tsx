
import { useState, useEffect, useCallback, useMemo } from 'react';
import { updateProductStock, getStockHistory, getProductStockHistory, StockChangeEvent, restoreStockFromSale } from '@/utils/stockTracker';
import { Product } from '@/types';

type StockHookReturn = {
  updateStock: (productId: string, newStock: number, source?: StockChangeEvent['source']) => boolean;
  restoreStock: (saleItems: Array<{productId: string, quantity: number}>) => boolean;
  stockHistory: StockChangeEvent[];
  productStockHistory: (productId: string) => StockChangeEvent[];
  getLowStockProducts: () => Product[];
  productMovement: StockChangeEvent[];
  isLoading: boolean;
  stockChangeListener: (callback: (event: CustomEvent) => void) => () => void;
};

export const useStock = (): StockHookReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [productMovement, setProductMovement] = useState<StockChangeEvent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>({ lowStockThreshold: 10 });

  // Load products and settings once
  useEffect(() => {
    try {
      const productsJson = localStorage.getItem('products');
      const settingsJson = localStorage.getItem('companySettings');
      
      setProducts(productsJson ? JSON.parse(productsJson) : []);
      setSettings(settingsJson ? JSON.parse(settingsJson) : { lowStockThreshold: 10 });
      setProductMovement(getStockHistory());
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  }, []);

  // Listen for changes
  useEffect(() => {
    const handleStockChange = (event: CustomEvent) => {
      setProductMovement(prev => [...prev, event.detail as StockChangeEvent]);
      
      // Reload products when stock changes
      try {
        const productsJson = localStorage.getItem('products');
        if (productsJson) {
          setProducts(JSON.parse(productsJson));
        }
      } catch (error) {
        console.error('Error reloading products:', error);
      }
    };

    const handleProductsChange = () => {
      try {
        const productsJson = localStorage.getItem('products');
        if (productsJson) {
          setProducts(JSON.parse(productsJson));
        }
      } catch (error) {
        console.error('Error reloading products:', error);
      }
    };

    const handleSettingsChange = () => {
      try {
        const settingsJson = localStorage.getItem('companySettings');
        if (settingsJson) {
          setSettings(JSON.parse(settingsJson));
        }
      } catch (error) {
        console.error('Error reloading settings:', error);
      }
    };

    window.addEventListener('productStockChanged', handleStockChange as EventListener);
    window.addEventListener('productsUpdated', handleProductsChange as EventListener);
    window.addEventListener('companySettingsChanged', handleSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('productStockChanged', handleStockChange as EventListener);
      window.removeEventListener('productsUpdated', handleProductsChange as EventListener);
      window.removeEventListener('companySettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  // Memoize low stock products calculation
  const getLowStockProducts = useCallback((): Product[] => {
    return products.filter(product => {
      const threshold = product.reorderLevel || settings.lowStockThreshold;
      return product.stock <= threshold;
    });
  }, [products, settings.lowStockThreshold]);

  // Function to register a stock change listener
  const stockChangeListener = useCallback((callback: (event: CustomEvent) => void) => {
    window.addEventListener('productStockChanged', callback as EventListener);
    return () => {
      window.removeEventListener('productStockChanged', callback as EventListener);
    };
  }, []);

  return {
    updateStock: updateProductStock,
    restoreStock: restoreStockFromSale,
    stockHistory: getStockHistory(),
    productStockHistory: getProductStockHistory,
    getLowStockProducts,
    productMovement,
    isLoading,
    stockChangeListener
  };
};
