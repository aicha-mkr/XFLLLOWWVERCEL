import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sale, PaymentStatus, Client } from "@/types";
import { Search, Eye, Printer, Trash2, Edit } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { useToast } from "@/components/ui/use-toast";
import { generateModernInvoiceHTML } from "@/components/ModernInvoiceGenerator";
import { printDocumentElectron, viewDocument, directPrintDesktop } from "@/utils/printUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSales } from "@/contexts/SalesContext";
import { dbService } from "@/data/dbService";

const Invoices = () => {
  const { sales, isLoading, updateSale, deleteSale } = useSales();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>("pending");
  const { formatCurrency } = useCurrency();
  const { settings } = useCompanySettings();
  const { canDelete } = useUserPermissions();
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePaymentStatusChange = async () => {
    if (!editingPaymentId) return;
    try {
      await updateSale(editingPaymentId, { paymentStatus: newPaymentStatus });
      toast({
        title: "Statut de paiement mis à jour",
        description: `Le statut a été changé avec succès.`,
      });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    } finally {
      setEditingPaymentId(null);
    }
  };

  const handlePrintOrView = async (saleId: string, action: 'print' | 'view') => {
    if (isPrinting && action === 'print') return;
    if (action === 'print') setIsPrinting(true);

    try {
      const saleToPrint = await dbService.getSaleById(saleId);
      const clients = await dbService.getClients();
      
      if (!saleToPrint) {
        toast({ title: "Erreur", description: "Détails de la facture introuvables.", variant: "destructive" });
        return;
      }
      
      const client = clients.find((c: Client) => c.id === saleToPrint.clientId);
      const htmlContent = generateModernInvoiceHTML(saleToPrint, client, formatCurrency, settings);
      
      if (action === 'print') {
        directPrintDesktop(htmlContent, `Facture ${saleToPrint.invoiceNumber || saleToPrint.id}`);
      } else {
        viewDocument(htmlContent, `Facture ${saleToPrint.invoiceNumber || saleToPrint.id}`);
      }

    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    } finally {
      if (action === 'print') setIsPrinting(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteSale(id);
      toast({ title: "Facture supprimée", description: "La facture a été supprimée avec succès." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer la facture.", variant: "destructive" });
    }
  };
  
  const filteredSales = sales.filter(
    sale => 
      sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.invoiceNumber && sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const formatDate = (date: Date) => {
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };
  
  const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'partial':
        return 'Partiel';
      case 'canceled':
        return 'Annulé';
      default:
        return status;
    }
  };
  
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'partial':
        return 'text-orange-600 bg-orange-100';
      case 'canceled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };
  
  if (isLoading) return <div className="p-4">Chargement des factures...</div>;

  return (
    <div className="content-container animate-fade-in">
      <PageHeader title="Factures">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-[300px]"
          />
        </div>
      </PageHeader>
      
      <Card className="border-blue-200 shadow-lg">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg p-4 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800">Liste des factures de vente</h3>
          <p className="text-sm text-blue-600">Gérez toutes vos factures basées sur les ventes effectuées</p>
        </div>
        
        <div className="table-container">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <TableHead className="text-blue-800 font-semibold">№ Facture</TableHead>
                <TableHead className="text-blue-800 font-semibold">Date</TableHead>
                <TableHead className="text-blue-800 font-semibold">Client</TableHead>
                <TableHead className="text-right text-blue-800 font-semibold">Total HT</TableHead>
                <TableHead className="text-right text-blue-800 font-semibold">Total TTC</TableHead>
                <TableHead className="text-center text-blue-800 font-semibold">Statut Paiement</TableHead>
                <TableHead className="text-center text-blue-800 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <TableRow 
                    key={sale.id} 
                    className="hover:bg-blue-50 transition-colors border-blue-100"
                  >
                    <TableCell className="font-medium text-blue-700">{sale.invoiceNumber || `#${sale.id}`}</TableCell>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                    <TableCell className="font-medium">{sale.clientName}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.totalHT)}</TableCell>
                    <TableCell className="text-right font-bold text-blue-700">{formatCurrency(sale.totalTTC)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(sale.paymentStatus)}`}>
                        {getPaymentStatusLabel(sale.paymentStatus)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handlePrintOrView(sale.id, 'view')}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                          title="Voir la facture"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handlePrintOrView(sale.id, 'print')}
                          className="text-green-600 hover:text-green-800 hover:bg-green-100"
                          title="Imprimer la facture"
                        >
                          <Printer size={16} />
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                              title="Modifier le statut de paiement"
                              onClick={() => {
                                setEditingPaymentId(sale.id);
                                setNewPaymentStatus(sale.paymentStatus);
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Modifier le statut de paiement</DialogTitle>
                              <DialogDescription>
                                Facture {sale.invoiceNumber || `#${sale.id}`} - {sale.clientName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select value={newPaymentStatus} onValueChange={(value: PaymentStatus) => setNewPaymentStatus(value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">En attente</SelectItem>
                                  <SelectItem value="paid">Payé</SelectItem>
                                  <SelectItem value="partial">Partiel</SelectItem>
                                  <SelectItem value="canceled">Annulé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingPaymentId(null)}>
                                Annuler
                              </Button>
                              <Button onClick={handlePaymentStatusChange}>
                                Enregistrer
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {canDelete() && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-600 hover:text-red-800 hover:bg-red-100"
                                title="Supprimer la facture"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer la facture {sale.invoiceNumber || `#${sale.id}`} ? Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteInvoice(sale.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm ? "Aucune facture trouvée" : "Aucune facture disponible - Créez des ventes pour générer des factures"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Invoices;
