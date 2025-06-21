
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Product } from "@/types";
import { useNavigate } from "react-router-dom";

const LowStockAlert = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadLowStockProducts = () => {
      try {
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
          const products: Product[] = JSON.parse(savedProducts);
          
          // Produits en rupture de stock (stock = 0)
          const outOfStock = products.filter(product => 
            product.active && product.stock === 0
          );
          
          // Produits en stock faible (stock <= reorderLevel et stock > 0)
          const lowStock = products.filter(product => 
            product.active && 
            product.stock > 0 && 
            product.reorderLevel && 
            product.stock <= product.reorderLevel
          );
          
          setOutOfStockProducts(outOfStock);
          setLowStockProducts(lowStock);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      }
    };

    loadLowStockProducts();
    
    // Écouter les changements de produits
    const handleStorageChange = () => {
      loadLowStockProducts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productsUpdated', handleStorageChange);
    };
  }, []);

  const handleViewProducts = () => {
    navigate('/products');
  };

  if (outOfStockProducts.length === 0 && lowStockProducts.length === 0) {
    return (
      <Card className="border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">
            Stock
          </CardTitle>
          <Package className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Tout va bien</div>
          <p className="text-xs text-green-600">
            Aucun produit en rupture ou stock faible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ruptures de stock */}
      {outOfStockProducts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Ruptures de stock
            </CardTitle>
            <Badge variant="destructive">{outOfStockProducts.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {outOfStockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate">{product.name}</span>
                  <Badge variant="destructive" className="text-xs">0</Badge>
                </div>
              ))}
              {outOfStockProducts.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{outOfStockProducts.length - 3} autres produits
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewProducts}
                className="w-full mt-2"
              >
                Voir tous les produits
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock faible */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Stock faible
            </CardTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {lowStockProducts.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate">{product.name}</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                    {product.stock}
                  </Badge>
                </div>
              ))}
              {lowStockProducts.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{lowStockProducts.length - 3} autres produits
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewProducts}
                className="w-full mt-2"
              >
                Voir tous les produits
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LowStockAlert;
