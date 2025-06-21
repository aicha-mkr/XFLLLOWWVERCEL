
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/use-products";
import { Product } from "@/types";

interface ProductSelectorProps {
  value?: string;
  onValueChange: (productId: string, product: Product) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ProductSelector = ({ value, onValueChange, placeholder = "Sélectionner un produit...", disabled = false }: ProductSelectorProps) => {
  const [open, setOpen] = useState(false);
  const { products, isLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");

  const selectedProduct = products.find(product => product.id === value);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      onValueChange(productId, product);
    }
    setOpen(false);
  };

  const isLowStock = (product: Product) => {
    const threshold = product.reorderLevel || 10;
    return product.stock <= threshold;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] p-3"
          disabled={disabled || isLoading}
        >
          {selectedProduct ? (
            <div className="flex items-center gap-3 w-full">
              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                <span className="font-medium text-sm truncate w-full text-left">
                  {selectedProduct.name}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {selectedProduct.barcode && (
                    <span>Code: {selectedProduct.barcode}</span>
                  )}
                  <span>Stock: {selectedProduct.stock}</span>
                  <span>Prix: {selectedProduct.sellingPrice?.toFixed(2)} DT</span>
                </div>
              </div>
              {isLowStock(selectedProduct) && (
                <Badge variant="destructive" className="text-xs flex-shrink-0">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Stock faible
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command className="w-full">
          <CommandInput 
            placeholder="Rechercher un produit par nom, code ou catégorie..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2">Chargement des produits...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <Package className="h-8 w-8 text-muted-foreground mb-2" />
                  <span>Aucun produit trouvé</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Essayez de modifier votre recherche
                  </span>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.barcode || ''} ${product.category || ''}`}
                  onSelect={() => handleSelect(product.id)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {product.name}
                        </span>
                        {isLowStock(product) && (
                          <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {product.barcode && (
                          <span className="bg-muted px-1.5 py-0.5 rounded">
                            Code: {product.barcode}
                          </span>
                        )}
                        {product.category && (
                          <span>Catégorie: {product.category}</span>
                        )}
                        <span className={cn(
                          "font-medium",
                          isLowStock(product) ? "text-destructive" : "text-foreground"
                        )}>
                          Stock: {product.stock}
                        </span>
                        <span className="font-medium text-primary">
                          {product.sellingPrice?.toFixed(2)} DT
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isLowStock(product) && (
                      <Badge variant="destructive" className="text-xs">
                        Stock faible
                      </Badge>
                    )}
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductSelector;
