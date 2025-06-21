import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PurchaseOrder } from '@/types';
import { dbService } from '@/data/dbService';

interface PurchaseOrdersContextType {
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id'>) => Promise<void>;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  loading: boolean;
}

const PurchaseOrdersContext = createContext<PurchaseOrdersContextType | undefined>(undefined);

export const PurchaseOrdersProvider = ({ children }: { children: ReactNode }) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les bons de commande depuis la base de données
  useEffect(() => {
    const loadPurchaseOrders = async () => {
      try {
        console.log('Loading purchase orders from database...');
        await dbService.initialize();
        const loadedOrders = await dbService.getPurchaseOrders();
        console.log('Loaded purchase orders:', loadedOrders);
        setPurchaseOrders(loadedOrders);
      } catch (error) {
        console.error('Error loading purchase orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPurchaseOrders();
  }, []);

  const generatePurchaseOrderNumber = () => {
    const currentYear = new Date().getFullYear();
    const existingNumbers = purchaseOrders
      .filter(order => order.reference?.startsWith(`BC-${currentYear}`))
      .map(order => {
        const match = order.reference?.match(/BC-\d{4}-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `BC-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  };

  const addPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id'>) => {
    try {
      console.log('Adding purchase order:', orderData);
      const orderWithReference = {
        ...orderData,
        reference: generatePurchaseOrderNumber()
      };
      const newOrder = await dbService.createPurchaseOrder(orderWithReference);
      console.log('Purchase order added successfully:', newOrder);
      setPurchaseOrders(prev => [newOrder, ...prev]);
    } catch (error) {
      console.error('Error adding purchase order:', error);
      throw error;
    }
  };

  const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
    try {
      console.log('Updating purchase order:', id, updates);
      await dbService.updatePurchaseOrder(id, updates);
      console.log('Purchase order updated successfully');
      setPurchaseOrders(prev => prev.map(order => 
        order.id === id ? { ...order, ...updates } : order
      ));
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      console.log('Deleting purchase order:', id);
      await dbService.deletePurchaseOrder(id);
      console.log('Purchase order deleted successfully');
      setPurchaseOrders(prev => prev.filter(order => order.id !== id));
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  };

  return (
    <PurchaseOrdersContext.Provider value={{ 
      purchaseOrders, 
      addPurchaseOrder, 
      updatePurchaseOrder, 
      deletePurchaseOrder,
      loading
    }}>
      {children}
    </PurchaseOrdersContext.Provider>
  );
};

export const usePurchaseOrders = () => {
  const context = useContext(PurchaseOrdersContext);
  if (context === undefined) {
    throw new Error('usePurchaseOrders must be used within a PurchaseOrdersProvider');
  }
  return context;
};
