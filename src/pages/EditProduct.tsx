import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useProducts } from "@/hooks/use-products";

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, updateProduct } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        toast({
          title: "Erreur",
          description: "Produit non trouvé",
          variant: "destructive"
        });
        navigate("/products");
      }
    }
    setLoading(false);
  }, [id, products, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      // Ensure stock and quantity are synchronized
      const updatedProduct = {
        ...product,
        stock: product.quantity, // Sync stock with quantity
      };

      await updateProduct(product.id, updatedProduct);
      
      toast({
        title: "Succès",
        description: "Le produit a été modifié avec succès"
      });
      
      navigate("/products");
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification du produit",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="content-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="content-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Produit non trouvé</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/products")} 
        className="mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </Button>
      
      <PageHeader title="Modifier le produit" />
      
      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({...product, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="barcode">Code-barres</Label>
                <Input
                  id="barcode"
                  value={product.barcode || ''}
                  onChange={(e) => setProduct({...product, barcode: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={product.category || ''}
                  onChange={(e) => setProduct({...product, category: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input
                  id="supplier"
                  value={product.supplier || ''}
                  onChange={(e) => setProduct({...product, supplier: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantité en stock *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={product.quantity}
                  onChange={(e) => setProduct({...product, quantity: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="reorderLevel">Niveau de réapprovisionnement</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={product.reorderLevel || ''}
                  onChange={(e) => setProduct({...product, reorderLevel: parseInt(e.target.value) || undefined})}
                />
              </div>
              
              <div>
                <Label htmlFor="purchasePrice">Prix d'achat *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.001"
                  value={product.purchasePrice}
                  onChange={(e) => setProduct({...product, purchasePrice: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sellingPrice">Prix de vente *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.001"
                  value={product.sellingPrice}
                  onChange={(e) => setProduct({...product, sellingPrice: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="vatRate">Taux de TVA (%) *</Label>
                <Select value={product.vatRate.toString()} onValueChange={(value) => setProduct({...product, vatRate: parseFloat(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="7">7%</SelectItem>
                    <SelectItem value="13">13%</SelectItem>
                    <SelectItem value="19">19%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={product.description || ''}
                onChange={(e) => setProduct({...product, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">Modifier le produit</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProduct;
