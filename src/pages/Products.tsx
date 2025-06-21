import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProductActions from "@/components/ProductActions";
import { useProducts } from "@/hooks/use-products";
import { useCurrency } from "@/hooks/use-currency";
import { Search, Plus, Package } from "lucide-react";

const Products = () => {
  const { products, deleteProduct, isLoading } = useProducts();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockBadge = (quantity: number, reorderLevel: number = 5) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Rupture</Badge>;
    } else if (quantity <= reorderLevel) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Stock faible</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">En stock</Badge>;
    }
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
  };

  if (isLoading) {
    return (
      <div className="content-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement des produits...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <PageHeader title="Produits" addButtonLink="/products/add" addButtonText="Ajouter un produit">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Rechercher par nom, code-barres ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-[350px]"
          />
        </div>
      </PageHeader>
      
      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Code-barres</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Prix d'achat</TableHead>
              <TableHead className="text-right">Prix de vente</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-100">
                        <Package className="h-6 w-6 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {product.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{product.barcode || "N/A"}</TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="secondary">{product.category}</Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(product.purchasePrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.sellingPrice)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${product.quantity <= (product.reorderLevel || 5) ? 'text-red-600' : 'text-green-600'}`}>
                      {product.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStockBadge(product.quantity, product.reorderLevel)}
                  </TableCell>
                  <TableCell className="text-center">
                    <ProductActions product={product} onDelete={handleDeleteProduct} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">
                      {searchTerm ? "Aucun produit trouvé pour votre recherche" : "Aucun produit enregistré"}
                    </p>
                    {!searchTerm && (
                      <Link to="/products/add">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter le premier produit
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Products;
