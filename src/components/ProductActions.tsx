
import { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/hooks/use-currency";

interface ProductActionsProps {
  product: Product;
  onDelete?: (id: string) => void;
}

const ProductActions = ({ product, onDelete }: ProductActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const handleView = () => {
    const detailsWindow = window.open('', '_blank', 'width=600,height=500');
    if (detailsWindow) {
      detailsWindow.document.write(`
        <html>
          <head>
            <title>Détails du produit ${product.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
              .info-item { padding: 10px; background: #f8f9fa; border-radius: 5px; }
              .label { font-weight: bold; color: #007bff; }
              .stock-warning { color: #dc3545; font-weight: bold; }
              .stock-ok { color: #28a745; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="color: #007bff;">${product.name}</h1>
              <p><strong>Code produit:</strong> ${product.barcode || 'N/A'}</p>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Prix d'achat</div>
                <div>${formatCurrency(product.purchasePrice)}</div>
              </div>
              <div class="info-item">
                <div class="label">Prix de vente</div>
                <div>${formatCurrency(product.sellingPrice)}</div>
              </div>
              <div class="info-item">
                <div class="label">Stock actuel</div>
                <div class="${product.stock <= (product.reorderLevel || 5) ? 'stock-warning' : 'stock-ok'}">${product.stock} unités</div>
              </div>
              <div class="info-item">
                <div class="label">Seuil de réapprovisionnement</div>
                <div>${product.reorderLevel || 5} unités</div>
              </div>
              <div class="info-item">
                <div class="label">TVA</div>
                <div>${product.vatRate}%</div>
              </div>
              <div class="info-item">
                <div class="label">Date de création</div>
                <div>${new Date(product.createdAt).toLocaleDateString('fr-TN')}</div>
              </div>
            </div>
            
            ${product.category ? `<p><strong>Catégorie:</strong> ${product.category}</p>` : ''}
            ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
          </body>
        </html>
      `);
      detailsWindow.document.close();
    }
  };

  const handleEdit = () => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      });
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={handleView} title="Voir les détails">
          <Eye size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleEdit} title="Modifier">
          <Edit size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-600 hover:text-red-800"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit "{product.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductActions;
