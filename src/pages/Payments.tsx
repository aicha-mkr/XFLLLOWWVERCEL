import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import { useCurrency } from "@/hooks/use-currency";
import { useSales } from "@/contexts/SalesContext";
import { PaymentStatus } from "@/types";

const Payments = () => {
  const { sales, isLoading } = useSales();
  const { formatCurrency } = useCurrency();

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
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    if (!date || isNaN(new Date(date).getTime())) return 'Date invalide';
    return new Intl.DateTimeFormat('fr-TN').format(new Date(date));
  };
  
  if (isLoading) {
    return <div className="p-4">Chargement des paiements...</div>;
  }

  return (
    <div className="content-container">
      <PageHeader title="Liste des Paiements" />
      <Card>
        <CardHeader>
          <CardTitle>Paiements Enregistrés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>№ Facture</TableHead>
                <TableHead>Montant Payé</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                    <TableCell>{sale.clientName}</TableCell>
                    <TableCell>{sale.invoiceNumber || `#${sale.id}`}</TableCell>
                    <TableCell>{formatCurrency(sale.paymentStatus === 'paid' ? sale.totalTTC : (sale.amountPaid || 0))}</TableCell>
                    <TableCell>{getStatusBadge(sale.paymentStatus)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Aucun paiement enregistré.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
