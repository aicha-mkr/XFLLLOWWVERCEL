import { useState, useEffect, useMemo } from "react";
import { Bell, Package, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProducts } from "@/hooks/use-products";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useNavigate } from "react-router-dom";
import { Product } from "@/types";

const StockNotifications = () => {
  const { products } = useProducts();
  const { settings } = useCompanySettings();
  const navigate = useNavigate();

  const lowStockProducts: Product[] = useMemo(() => {
    if (!settings.enableLowStockAlert || !products) {
      return [];
    }
    return products.filter(
      (product) =>
        product.quantity <= (product.reorderLevel || settings.lowStockThreshold)
    );
  }, [products, settings.enableLowStockAlert, settings.lowStockThreshold]);

  const handleViewProduct = (productId: string) => {
    navigate(`/products/edit/${productId}`);
  };

  const handleViewAllProducts = () => {
    navigate('/products');
  };

  if (!settings.enableLowStockAlert) {
    return (
      <Button variant="ghost" size="icon" className="relative opacity-50">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${lowStockProducts.length > 0 ? 'animate-pulse text-red-500' : 'text-muted-foreground'}`} />
          {lowStockProducts.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs animate-bounce">
              {lowStockProducts.length > 99 ? '99+' : lowStockProducts.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-background border shadow-lg z-50">
        <DropdownMenuLabel className="flex items-center gap-2 text-red-600 border-b pb-2">
          <AlertTriangle className="h-4 w-4" />
          Alertes de stock faible ({lowStockProducts.length})
        </DropdownMenuLabel>
        
        {lowStockProducts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune alerte de stock</p>
            <p className="text-xs">Tous les produits sont bien approvisionnés</p>
          </div>
        ) : (
          <>
            {lowStockProducts.slice(0, 8).map((product) => (
              <DropdownMenuItem
                key={product.id}
                onClick={() => handleViewProduct(product.id)}
                className="cursor-pointer hover:bg-red-50 p-3 border-b border-border/50"
              >
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Package className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {product.name}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs flex-shrink-0">
                      {product.quantity} restant{product.quantity > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>
                      Seuil: {product.reorderLevel || settings.lowStockThreshold}
                    </span>
                    {product.category && (
                      <span className="bg-muted px-1.5 py-0.5 rounded">
                        {product.category}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            {lowStockProducts.length > 8 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-muted-foreground text-xs py-2">
                  ... et {lowStockProducts.length - 8} produit{lowStockProducts.length - 8 > 1 ? 's' : ''} de plus
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleViewAllProducts} 
              className="cursor-pointer text-primary hover:bg-primary/10 font-medium"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir tous les produits ({lowStockProducts.length} en stock faible)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StockNotifications;
