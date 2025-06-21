
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Sale, PaymentStatus } from "@/types";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useToast } from "@/hooks/use-toast";
import { generateModernInvoiceHTML } from "@/components/ModernInvoiceGenerator";
import { printDocumentElectron } from "@/utils/printUtils";

const SaleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { settings } = useCompanySettings();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSale = () => {
      if (!id) {
        navigate('/sales');
        return;
      }

      try {
        const savedSales = localStorage.getItem('sales');
        if (savedSales) {
          const sales = JSON.parse(savedSales);
          const foundSale = sales.find((s: Sale) => s.id === id);
          
          if (foundSale) {
            setSale({
              ...foundSale,
              date: new Date(foundSale.date)
            });
          } else {
            toast({
              title: "Erreur",
              description: "Vente non trouvée",
              variant: "destructive",
            });
            navigate('/sales');
          }
        } else {
          navigate('/sales');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la vente:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement de la vente",
          variant: "destructive",
        });
        navigate('/sales');
      } finally {
        setLoading(false);
      }
    };

    loadSale();
  }, [id, navigate, toast]);

  const formatDate = (date: Date) => {
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

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Espèces";
      case "check":
        return "Chèque";
      case "transfer":
        return "Virement";
      case "bill":
        return "Traite";
      default:
        return method;
    }
  };

  const handlePrint = () => {
    if (!sale) return;
    
    const htmlContent = generateModernInvoiceHTML(sale, formatCurrency, settings);
    printDocumentElectron(htmlContent, `Facture ${sale.invoiceNumber || sale.id}`);
    
    toast({
      title: "Impression en cours",
      description: `Impression de la facture ${sale.invoiceNumber || sale.id}`,
    });
  };

  if (loading) {
    return (
      <div className="content-container">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="content-container">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/sales')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">Vente non trouvée</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/sales')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">
            Vente #{sale.invoiceNumber || sale.id}
          </h1>
          {getStatusBadge(sale.paymentStatus)}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/sales/edit/${sale.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de la vente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-base">{formatDate(sale.date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Numéro de facture</p>
                <p className="text-base">{sale.invoiceNumber || `#${sale.id}`}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mode de paiement</p>
                <p className="text-base">{getPaymentMethodLabel(sale.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Statut</p>
                <div className="mt-1">{getStatusBadge(sale.paymentStatus)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Nom</p>
              <p className="text-base">{sale.clientName}</p>
            </div>
            {sale.clientEmail && (
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base">{sale.clientEmail}</p>
              </div>
            )}
            {sale.clientPhone && (
              <div>
                <p className="text-sm font-medium text-gray-500">Téléphone</p>
                <p className="text-base">{sale.clientPhone}</p>
              </div>
            )}
            {sale.clientAddress && (
              <div>
                <p className="text-sm font-medium text-gray-500">Adresse</p>
                <p className="text-base">{sale.clientAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles vendus</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="text-right">TVA (%)</TableHead>
                <TableHead className="text-right">Total HT</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{item.vatRate}%</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice * item.quantity * (1 + item.vatRate / 100))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />
          
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total HT:</span>
                <span className="text-sm">{formatCurrency(sale.totalHT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total TVA:</span>
                <span className="text-sm">{formatCurrency(sale.totalTVA)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total TTC:</span>
                <span className="text-lg font-bold">{formatCurrency(sale.totalTTC)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleDetails;
