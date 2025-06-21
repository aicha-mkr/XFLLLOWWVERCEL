import { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/data/dbService';

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshProducts = async () => {
    console.log('[ProductsContext] Received request to refresh products.');
    try {
      setIsLoading(true);
      const loadedProducts = await dbService.getProducts();
      console.log('[ProductsContext] Products loaded from database. New quantities should be visible here:', loadedProducts);
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      await dbService.createProduct(productData);
      console.log('Product added successfully');
      await refreshProducts(); // Refresh list from DB
      toast({
        title: "Succès",
        description: "Produit ajouté avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      await dbService.updateProduct(id, productData);
      console.log('Product updated successfully');
      await refreshProducts(); // Refresh list from DB
      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await dbService.deleteProduct(id);
      console.log('Product deleted successfully');
      await refreshProducts(); // Refresh list from DB
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  useEffect(() => {
    refreshProducts();

    const handleProductsRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[ProductsContext] Received products-refreshed event. Updating state.');
      setProducts(customEvent.detail);
    };

    window.addEventListener('products-refreshed', handleProductsRefreshed);

    return () => {
      window.removeEventListener('products-refreshed', handleProductsRefreshed);
    };
  }, []);

  const value = {
    products,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    refreshProducts,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
