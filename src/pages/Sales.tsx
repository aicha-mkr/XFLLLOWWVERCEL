import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sale, PaymentStatus } from "@/types";
import { Search } from "lucide-react";
import SalesActions from "@/components/SalesActions";
import { useCurrency } from "@/hooks/use-currency";
import { useSales } from "@/contexts/SalesContext";
import { useToast } from "@/hooks/use-toast";

const Sales = () => {
  const { sales, isLoading, deleteSale } = useSales();
  const [searchTerm, setSearchTerm] = useState("");
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();

  const handleDeleteSale = async (saleId: string) => {
    try {
      await deleteSale(saleId);
      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vente.",
        variant: "destructive",
      });
    }
  };

  const filteredSales = sales.filter(
    sale =>
      sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.invoiceNumber && sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date: Date) => {
    if (!date || isNaN(new Date(date).getTime())) return 'Date invalide';
    return new Intl.DateTimeFormat('fr-TN').format(new Date(date));
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-pastel-green text-green-800">Payé</Badge>;
      case "pending":
        return <Badge className="bg-pastel-yellow text-amber-800">En attente</Badge>;
      case "partial":
        return <Badge className="bg-pastel-blue text-blue-800">Partiel</Badge>;
      case "canceled":
        return <Badge className="bg-pastel-pink text-red-800">Annulé</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div>Chargement des ventes...</div>;
  }

  return (
    <div className="content-container">
      <PageHeader title="Ventes" addButtonLink="/sales/add" addButtonText="Ajouter une vente">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
        </div>
      </PageHeader>
      
      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Facture</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut Paiement</TableHead>
              <TableHead className="text-right">Total TTC</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.invoiceNumber || `#${sale.id}`}</TableCell>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell>{sale.clientName}</TableCell>
                  <TableCell>{getStatusBadge(sale.paymentStatus)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.totalTTC)}</TableCell>
                  <TableCell className="text-center">
                    <SalesActions sale={sale} onDelete={() => handleDeleteSale(sale.id)} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {searchTerm ? "Aucune vente trouvée" : "Aucune vente enregistrée - Ajoutez votre première vente"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sales;
