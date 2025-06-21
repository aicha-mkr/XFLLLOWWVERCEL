import { toast } from "@/hooks/use-toast";
import { dbService } from "@/data/dbService";

// Stock change event types
export type StockChangeEvent = {
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  source: 'sale' | 'purchase' | 'manual' | 'return';
  timestamp: Date;
};

// Global stock event history
const stockHistory: StockChangeEvent[] = [];

// Audio for notifications
let notificationSound: HTMLAudioElement | null = null;

// Initialize audio
const initNotificationSound = () => {
  if (typeof window !== 'undefined' && !notificationSound) {
    notificationSound = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLXPO7tCJQBAhWqvr5KNHGSJFY9ju6bGVaVUmPuyxAAAjXL3T4McEACNNw/L9DAAeM3HS8w0ABwkccPgbAAAAABJZDAAAAAAAClIYAAAAAAABIyEAAAAAAAEGEAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAwAGAAgACgAMAAwADQAOAA8AEAASABMAFAAVABYAFgAWgBcAF4AYABiAGQAZgBmAGgAaABuAG4AcAByAHQAdgB8AH4AAAAAAAAAAgAGAAgACgAMAA4AEgAWABoAHAAeACAAIgAmACgAKgAsAC4AMAAyADQANgA4ADwAQABEAEYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABgAKAA4AEAAUABYAGgAcACAAIgAkACYAKAAsAC4AMgA0ADYAOgA+AEIARgBIAEwATgBSAFYAWgBeAGAAZABqAG4AcgB2AHoAfgCCAIYAigCOAJIAlgCaAJ4AogCmAKoArgCyALYAugC+AMIAxgDKAM4A0gDWANoA3gDiAOYA6gDuAPIA9gD6AP4AAgEGAQoBDgESARYBGgEeASIBJgEqAS4BMgE2AjYAAgAGAAwAEAAWABwAIgAoAC4ANAA6AEAARgBMAFIAWABeAGQAagBwAHYAfACCAIgAjgCUAJoAoACmAKwAsgC4AL4AxADKANAA1gDcAOIA6ADuAPQA+gAAAgYCDAISAAAAAAAADgAUABoAIAAoAC4ANAA6AEAARgBMAFIAWABeAGQAagBwAHYAfACCAIgAjgCUAJoAoACmAKwAsgC4AL4AxADKANAA1gDcAOIA6ADuAPQA+gAAAgYCDAISAhgCHgIkAioCMAI2AjwCQgJIAk4CVAJaAmACZgJsAnICeAJ+AoQCigKQApYCnAKiAqgCrgK0AroCwALGAswC0gLYAt4C5ALoAuwC8AL0AvgC/AIAAwQDCAMMAxADFAMYAxwDIAMkAygDLAMwAzQDOAM8A0ADRANOA0gDTANQA1QDWANYA2ADZANoA2wDcAN0A3gDfAOAA4QDiAOMA5ADlAOYA5wDoAOkA6gDrAOwA7QDuAO8A8ADxAPIA8wD0APUA9gD3APgA+QD6APsA/AD9AP4A/wDAAQEBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAEVARYBFwEYARkBQQTCAwcAGcQEQAGAXgAFwAMABQABgGVCFMAUABVAEsAVwBOQVDgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==");
    notificationSound.volume = 0.5;
  }
};

// Play notification sound
const playNotificationSound = () => {
  initNotificationSound();
  if (notificationSound) {
    notificationSound.play().catch(err => console.error("Error playing sound:", err));
  }
};

// Update product stock
export const updateProductStock = async (
  productId: string, 
  newStock: number, 
  source: StockChangeEvent['source'] = 'manual'
): Promise<boolean> => {
  try {
    // Get products from localStorage for immediate UI feedback (optional)
    const productsJson = localStorage.getItem('products');
    if (productsJson) {
      const products = JSON.parse(productsJson);
      const productIndex = products.findIndex((p: any) => p.id === productId);
      
      if (productIndex !== -1) {
        const product = products[productIndex];
        product.stock = newStock;
        products[productIndex] = product;
        localStorage.setItem('products', JSON.stringify(products));
      }
    }
    
    // Update stock in the database
    await dbService.updateProduct(productId, { stock: newStock });

    // Trigger a global refresh
    await dbService.getProducts(true);
    
    // Find product name for notification by reloading from DB
    const updatedProducts = await dbService.getProducts();
    const product = updatedProducts.find(p => p.id === productId);
    const productName = product?.name || 'Unknown Product';
    const previousStock = product?.stock !== undefined ? product.stock + (source === 'sale' ? 1 : -1) : newStock; // Approximate previous stock

    // Create stock change event
    const stockEvent: StockChangeEvent = {
      productId,
      productName: productName,
      previousStock: previousStock, // This is an approximation
      newStock,
      source,
      timestamp: new Date()
    };
    
    stockHistory.push(stockEvent);
    
    const settings = JSON.parse(localStorage.getItem('companySettings') || '{}');
    const lowStockThreshold = product?.reorderLevel || settings.lowStockThreshold || 10;
    const isLowStock = newStock <= lowStockThreshold;
    
    if (isLowStock) {
      toast({
        title: "Mise à jour du stock",
        description: `Stock faible: ${productName} (${newStock} unités)`,
        variant: "destructive",
      });
      playNotificationSound();
    }

    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    toast({
      title: "Erreur",
      description: "Impossible de mettre à jour le stock du produit.",
      variant: "destructive",
    });
    return false;
  }
};

// Restore stock when a sale is deleted
export const restoreStockFromSale = async (saleItems: Array<{productId: string, quantity: number}>) => {
  try {
    for (const item of saleItems) {
      const product = await dbService.getProductById(item.productId);
      if (product) {
        const newStock = (product.stock || 0) + item.quantity;
        await updateProductStock(item.productId, newStock, 'return');
      }
    }
    await dbService.getProducts(true);
    return true;
  } catch (error) {
    console.error('Error restoring stock from sale:', error);
    return false;
  }
};

// Get stock history
export const getStockHistory = () => [...stockHistory];

// Get stock history for a specific product
export const getProductStockHistory = (productId: string) => 
  stockHistory.filter(event => event.productId === productId);
