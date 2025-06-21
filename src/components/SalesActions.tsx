import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Printer } from "lucide-react";
import { Sale, Client } from "@/types";
import { useCurrency } from "@/hooks/use-currency";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useToast } from "@/hooks/use-toast";
import { generateModernInvoiceHTML } from "@/components/ModernInvoiceGenerator";
import { printDocumentElectron } from "@/utils/printUtils";
import { dbService } from "@/data/dbService";

interface SalesActionsProps {
  sale: Sale;
  onDelete: (id: string) => void;
}

const SalesActions = ({ sale, onDelete }: SalesActionsProps) => {
  const { formatCurrency } = useCurrency();
  const { settings } = useCompanySettings();
  const { toast } = useToast();

  const handlePrint = async () => {
    try {
      console.log('Printing sales invoice for sale:', sale.id);
      
      // Recharger la vente complète et les clients depuis la DB
      const fullSale = await dbService.getSaleById(sale.id);
      const clients = await dbService.getClients();
      
      if (!fullSale) {
        toast({ title: "Erreur", description: "Impossible de trouver les détails de la vente.", variant: "destructive" });
        return;
      }
      
      const client = clients.find((c: Client) => c.id === fullSale.clientId);
      const htmlContent = generateModernInvoiceHTML(fullSale, client, formatCurrency, settings);
      
      printDocumentElectron(htmlContent, `Facture ${fullSale.invoiceNumber || fullSale.id}`);
      
      toast({
        title: "Impression en cours",
        description: `Impression de la facture ${fullSale.invoiceNumber || fullSale.id}`,
      });
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue lors de l'impression.", variant: "destructive" });
    }
  };

  const handleDelete = () => {
    onDelete(sale.id);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default SalesActions;
