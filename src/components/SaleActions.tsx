
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sale } from "@/types";
import { Eye, Edit, Printer, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useCurrency } from "@/hooks/use-currency";
import { useNavigate } from "react-router-dom";
import { generateModernInvoiceHTML } from "@/components/ModernInvoiceGenerator";

interface SaleActionsProps {
  sale: Sale;
}

const SaleActions = ({ sale }: SaleActionsProps) => {
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleView = () => {
    toast({
      title: "Détails de la vente",
      description: `Vente ${sale.invoiceNumber || `#${sale.id}`} - Client: ${sale.clientName} - Total: ${formatCurrency(sale.totalTTC)}`,
    });
  };

  const handleEdit = () => {
    navigate(`/sales/edit/${sale.id}`);
  };

  const handlePrintInvoice = () => {
    const htmlContent = generateModernInvoiceHTML(sale, formatCurrency, settings);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "Impression en cours",
      description: `Impression de la facture ${sale.invoiceNumber || sale.id}`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleView} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          Voir détails
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintInvoice} className="cursor-pointer">
          <Printer className="mr-2 h-4 w-4" />
          Imprimer facture
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SaleActions;
