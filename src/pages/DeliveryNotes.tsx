import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import { DeliveryNote, Client } from "@/types";
import { Search, Plus, Printer, Check, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useDeliveryNotes } from "@/contexts/DeliveryNotesContext";

const generateModernDeliveryNoteHTML = (
  deliveryNote: DeliveryNote,
  client: Client,
  settings: any,
  formatCurrency: (amount: number) => string
) => {
  const logoBase64 = settings.logo ? `data:image/png;base64,${settings.logo}` : (settings.logoUrl || '');
    
  const numberToWords = (num: number): string => {
    if (num === 0) return 'zéro';
    if (isNaN(num) || num === null || num === undefined) return 'zéro';
    
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    
    const convertHundreds = (n: number): string => {
      if (isNaN(n) || n === null || n === undefined) return '';
      
      let result = '';
      
      if (n >= 100) {
        const hundreds = Math.floor(n / 100);
        if (hundreds === 1) result += 'cent ';
        else result += units[hundreds] + ' cent ';
        n %= 100;
      }
      
      if (n >= 20) {
        const tensDigit = Math.floor(n / 10);
        if (tensDigit === 7) result += 'soixante-';
        else if (tensDigit === 9) result += 'quatre-vingt-';
        else result += tens[tensDigit];
        
        const remainder = n % 10;
        if ((tensDigit === 7 || tensDigit === 9) && remainder > 0) result += teens[remainder];
        else if (remainder > 0) result += '-' + units[remainder];
        
      } else if (n >= 10) {
        result += teens[n - 10];
      } else if (n > 0) {
        result += units[n];
      }
      
      return result.trim();
    };
    
    const safeNum = parseFloat(num.toString()) || 0;
    const intPart = Math.floor(safeNum);
    const decimalPart = Math.round((safeNum - intPart) * 1000);
    
    let result = convertHundreds(intPart);
    if (intPart > 1) result += " dinars"; else result += " dinar";
    if (decimalPart > 0) {
      result += ' et ' + convertHundreds(decimalPart) + ' millimes';
    }
    
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

    const tvaBreakdown = (deliveryNote.items || []).reduce((acc: any, item: any) => {
      const vatRate = item.vatRate || 19;
      const itemHT = (item.quantity || 0) * (item.unitPrice || 0);
      const itemTVA = itemHT * (vatRate / 100);
      if (!acc[vatRate]) {
        acc[vatRate] = { baseHT: 0, montantTVA: 0 };
      }
      acc[vatRate].baseHT += itemHT;
      acc[vatRate].montantTVA += itemTVA;
      return acc;
    }, {});
  
    const displayItems = (deliveryNote.items || []).map(item => {
        const totalHT = (item.quantity || 0) * (item.unitPrice || 0);
        const remise = (item as any).discount || 0;
        const totalAfterRemise = totalHT * (1 - remise / 100);
        const tvaAmount = totalAfterRemise * ((item.vatRate || 19) / 100);
        const unitPriceTTC = (item.unitPrice || 0) * (1 + ((item.vatRate || 19) / 100));
        return {
            ...item,
            totalHT,
            remise,
            tvaAmount,
            unitPriceTTC,
            totalLineHT: totalAfterRemise
        }
    });
    const minRows = 2;
    const emptyRowsNeeded = Math.max(0, minRows - displayItems.length);
    const emptyRows = Array(emptyRowsNeeded).fill(null).map((_, index) => ({
      isEmpty: true,
      index: displayItems.length + index
    }));
    const allRows = [...displayItems, ...emptyRows];
  
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Bon de Livraison ${deliveryNote.reference || deliveryNote.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.3; color: #374151; background: white; }
          @page { size: A4; margin: 0.5cm; }
          .invoice-container { width: 21cm; height: 28.7cm; margin: 0 auto; background: white; display: flex; flex-direction: column; border: 3px solid #87CEEB; border-radius: 8px; overflow: hidden; position: relative; }
          .invoice-header { background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%); color: #0891B2; padding: 12px 20px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #87CEEB; }
          .company-section { flex: 1; }
          .logo { max-width: 50px; max-height: 50px; margin-bottom: 6px; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
          .company-info h1 { font-size: 18px; font-weight: bold; color: #0891B2; margin-bottom: 4px; }
          .company-info p { font-size: 12px; color: #0891B2; margin-bottom: 2px; }
          .invoice-section { background: rgba(255,255,255,0.95); padding: 12px; border-radius: 8px; text-align: right; min-width: 220px; box-shadow: 0 3px 10px rgba(135, 206, 235, 0.1); border: 2px solid #87CEEB; }
          .invoice-section h2 { font-size: 18px; font-weight: bold; margin-bottom: 4px; color: #0891B2; }
          .invoice-number { font-size: 14px; margin-bottom: 4px; font-weight: 600; color: #0891B2; }
          .invoice-date { font-size: 12px; color: #0891B2; }
          .content-wrapper { flex: 1; padding: 12px 20px 50px; display: flex; flex-direction: column; min-height: 0; }
          .client-section { background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%); border-radius: 8px; padding: 12px; margin-bottom: 12px; border-left: 4px solid #87CEEB; border: 2px solid #B0E0E6; }
          .client-section h3 { color: #0891B2; font-size: 13px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; }
          .client-details p { font-size: 12px; margin-bottom: 2px; color: #475569; }
          .client-name { font-weight: 700; color: #334155; }
          .table-container { flex-grow: 1; }
          .invoice-table { width: 100%; border-collapse: collapse; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 12px; }
          .invoice-table th { background: #0891B2; color: white; font-weight: bold; padding: 8px; }
          .empty-row td { border: 1px solid #eee; height: 2.2em; }
          .page-footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #e5e7eb; flex-shrink: 0; }
          .totals-section { margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0; }
          .tva-summary { flex-grow: 1; margin-right: 10px;}
          .tva-table { width: 100%; font-size: 11px; border-collapse: collapse; border: 1px solid #0891B2;}
          .tva-table th, .tva-table td { border: 1px solid #0891B2; padding: 4px 6px; text-align: center; background: #E0F7FA;}
          .tva-table th { font-weight: bold; }
          .invoice-totals { text-align: right; min-width: 280px; font-size: 12px; }
          .invoice-totals p { margin-bottom: 4px; display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; align-items: center; }
          .invoice-totals p strong { font-weight: bold; text-align: right; color: #475569; }
          .invoice-totals p span { text-align: right; font-weight: 500; color: #1f2937; padding: 4px; background: #F3F4F6; border-radius: 4px;}
          .total-ttc strong, .total-ttc span { font-size: 14px; font-weight: bold; color: #0891B2; }
          .total-ttc span { background: #E0F7FA; }
          .final-footer { position: absolute; bottom: 0; left:0; right: 0; text-align: center; padding: 8px; font-size: 12px; color: #0891B2; background: #F0F9FF; border-top: 2px solid #87CEEB; }
          .signature-section { margin-top: 20px; background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%); border: 1px solid #B0E0E6; border-radius: 8px; padding: 15px; display: flex; justify-content: flex-end; }
          .signature-box-styled { background: white; border: 1px solid #ccc; border-radius: 6px; padding: 10px; text-align: center; width: 220px; }
          .signature-box-styled p { font-weight: 600; margin-bottom: 10px; font-size: 13px; color: #334155; }
          .signature-pad { border: 1px dashed #9ca3af; border-radius: 4px; height: 70px; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <header class="invoice-header">
            <div class="company-section">
              ${logoBase64 ? `<img src="${logoBase64.startsWith('data:') ? logoBase64 : 'data:image/png;base64,' + logoBase64}" alt="Logo" class="logo"/>` : ''}
              <div class="company-info">
                <h1>${settings.companyName || settings.name}</h1>
                <p>${settings.address || 'Non spécifiée'}</p>
                <p>MF: ${settings.taxNumber || settings.taxId || 'Non spécifié'}</p>
                <p>Tél: ${settings.phone || 'Non spécifié'}</p>
                <p>Email: ${settings.email || 'Non spécifié'}</p>
              </div>
            </div>
            <div class="invoice-section">
              <h2>BON DE LIVRAISON</h2>
              <div class="invoice-number">${deliveryNote.reference || deliveryNote.id}</div>
              <div class="invoice-date">Date: ${new Date(deliveryNote.date).toLocaleDateString('fr-FR')}</div>
            </div>
          </header>
          <main class="content-wrapper">
            <div class="client-section">
              <h3>INFORMATIONS DU CLIENT</h3>
              <div class="client-details">
                  <p class="client-name"><strong>${client?.name || deliveryNote.clientName}</strong></p>
                  <p>Adresse: ${client?.address || 'Non spécifiée'}</p>
                  <p>MF: ${client?.fiscalId || 'Non spécifié'}</p>
                  <p>Tél: ${client?.phone || 'Non spécifié'}</p>
                  <p>Email: ${client?.email || 'Non spécifié'}</p>
              </div>
            </div>

            <div class="client-section" style="margin-top: 10px;">
                <h3>INFORMATIONS DE LIVRAISON</h3>
                <div class="client-details">
                    <p><strong>Adresse de livraison:</strong> ${deliveryNote.deliveryAddress || client?.address || 'Non spécifiée'}</p>
                    ${deliveryNote.deliveryDelay ? `<p><strong>Délai de livraison:</strong> ${deliveryNote.deliveryDelay}</p>` : ''}
                </div>
            </div>

            <div class="table-container">
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th>Réf.</th>
                    <th>Désignation</th>
                    <th style="text-align:right;">Qté</th>
                    <th style="text-align:right;">P.U.HT</th>
                    <th style="text-align:right;">P.U.TTC</th>
                    <th style="text-align:center;">Remise</th>
                    <th style="text-align:center;">TVA</th>
                    <th style="text-align:right;">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  ${allRows.map((item: any) => `
                    <tr class="${item.isEmpty ? 'empty-row' : ''}">
                      ${item.isEmpty ? `<td colspan="8"></td>` : `
                        <td>${item.productId || ''}</td>
                        <td>${item.productName}</td>
                        <td style="text-align:right;">${item.quantity}</td>
                        <td style="text-align:right;">${formatCurrency(item.unitPrice || 0)}</td>
                        <td style="text-align:right;">${formatCurrency(item.unitPriceTTC || 0)}</td>
                        <td style="text-align:center;">${item.remise > 0 ? `${item.remise}%` : '-'}</td>
                        <td style="text-align:center;">${item.vatRate || 19}%</td>
                        <td style="text-align:right;">${formatCurrency(item.totalLineHT || 0)}</td>
                      `}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="page-footer" style="margin-top: auto; padding-top: 10px; border-top: 1px solid #e5e7eb;">
              <div class="totals-section">
                <div class="tva-summary">
                   <table class="tva-table">
                      <thead><tr><th>Taux TVA</th><th>Base HT</th><th>Montant TVA</th></tr></thead>
                      <tbody>
                        ${Object.keys(tvaBreakdown).length > 0 ? Object.entries(tvaBreakdown).map(([rate, data]: [string, any]) => `
                          <tr><td>${rate}%</td><td>${formatCurrency(data.baseHT)}</td><td>${formatCurrency(data.montantTVA)}</td></tr>
                        `).join('') : `<tr><td colspan="3">N/A</td></tr>`}
                      </tbody>
                   </table>
                </div>
                <div class="invoice-totals">
                  <p><strong>Montant Total HT:</strong> <span>${formatCurrency(deliveryNote.totalHT || 0)}</span></p>
                  <p><strong>FODEC 1%:</strong> <span>${formatCurrency(deliveryNote.fodec || 0)}</span></p>
                  <p><strong>Total TVA:</strong> <span>${formatCurrency(deliveryNote.totalTVA || 0)}</span></p>
                  <p><strong>Timbre Fiscal:</strong> <span>${formatCurrency(deliveryNote.timbreFiscal || 0)}</span></p>
                  <p class="total-ttc"><strong>Total TTC:</strong> <span>${formatCurrency(deliveryNote.totalTTC || 0)}</span></p>
                </div>
              </div>

              <div style="font-size: 13px; color: #475569; background: #F0F9FF; padding: 8px; border-radius: 6px; border: 1px solid #B0E0E6; text-align: center; margin-top: 15px;">
                <p>Arrêté le présent bon de livraison à la somme de: <strong>${numberToWords(deliveryNote.totalTTC || 0)}</strong>.</p>
              </div>

              <div class="signature-section">
                <div class="signature-box-styled">
                  <p>Signature</p>
                  <div class="signature-pad"></div>
                </div>
              </div>
            </div>
          </main>
          <footer class="final-footer">
            <p>${settings.bankName && settings.bankRib ? `RIB: ${settings.bankRib} | Banque: ${settings.bankName}` : 'Détails bancaires non spécifiés'}</p>
          </footer>
        </div>
      </body>
      </html>
    `;
  };

const DeliveryNotes = () => {
  const { deliveryNotes, updateDeliveryNote, loading } = useDeliveryNotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  
  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: fr });
  };

  // Calculate totals for backward compatibility
  const calculateTotals = (note: DeliveryNote) => {
    if (note.totalHT !== undefined && note.totalTVA !== undefined && note.totalTTC !== undefined) {
      return {
        totalHT: note.totalHT,
        totalTVA: note.totalTVA,
        totalTTC: note.totalTTC
      };
    }
    const totalHT = note.items.reduce((sum, item) => sum + item.total, 0);
    const totalTVA = note.items.reduce((sum, item) => sum + (item.total * (item.vatRate || 19) / 100), 0);
    const fodecAmount = note.fodec || 0;
    const timbreFiscalAmount = note.timbreFiscal || 0;
    const totalTTC = totalHT + totalTVA + fodecAmount + timbreFiscalAmount;
    return { totalHT, totalTVA, totalTTC };
  };
  
  // Filter delivery notes based on search term and active tab
  const filteredDeliveryNotes = deliveryNotes.filter(note => {
    const matchesSearch = 
      note.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && note.status === "pending";
    if (activeTab === "delivered") return matchesSearch && note.status === "delivered";
    if (activeTab === "canceled") return matchesSearch && note.status === "canceled";
    
    return matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status: DeliveryNote["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-pastel-yellow text-amber-800">En attente</Badge>;
      case "delivered":
        return <Badge className="bg-pastel-green text-green-800">Livré</Badge>;
      case "canceled":
        return <Badge className="bg-pastel-pink text-red-800">Annulé</Badge>;
      default:
        return null;
    }
  };

  // Handle print delivery note
  const handlePrint = (note: DeliveryNote) => {
    const clientsData = localStorage.getItem('clients');
    if (!clientsData) {
      toast({ title: "Erreur", description: "Liste de clients non trouvée.", variant: "destructive" });
      return;
    }

    const allClients: Client[] = JSON.parse(clientsData);
    const client = allClients.find(c => c.id === note.clientId);

    if (!client) {
        toast({ title: "Erreur", description: `Client avec ID ${note.clientId} non trouvé.`, variant: "destructive" });
        return;
    }
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 3 }).format(amount);
    const htmlContent = generateModernDeliveryNoteHTML(note, client, settings, formatCurrency);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (e) {
                console.error("Print failed:", e);
                printWindow.close();
            }
        }, 500);
    }
  };

  // Handle accept delivery note
  async function handleAcceptDeliveryNote(id: string) {
    try {
      await updateDeliveryNote(id, { status: 'delivered' });
      
      toast({
        title: "Bon de livraison validé",
        description: "Le statut du bon de livraison a été changé à Livré",
        variant: "default",
      });
    } catch (error) {
      console.error('Error accepting delivery note:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le bon de livraison",
        variant: "destructive",
      });
    }
  }

  // Handle reject delivery note
  async function handleRejectDeliveryNote(id: string) {
    try {
      await updateDeliveryNote(id, { status: 'canceled' });
      
      toast({
        title: "Bon de livraison annulé",
        description: "Le statut du bon de livraison a été changé à Annulé",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error rejecting delivery note:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le bon de livraison",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="content-container">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement des bons de livraison...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <PageHeader 
        title="Bons de livraison" 
        addButtonLink="/delivery-notes/add" 
        addButtonText="Nouveau bon de livraison"
      >
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
      
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="delivered">Livrés</TabsTrigger>
          <TabsTrigger value="canceled">Annulés</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filteredDeliveryNotes.length > 0 ? (
          filteredDeliveryNotes.map((note) => {
            const { totalHT, totalTVA, totalTTC } = calculateTotals(note);
            
            return (
              <Card key={note.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <div>
                          <h3 className="text-lg font-semibold">Bon de livraison #{note.reference}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Date: {formatDate(note.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(note.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Client:</h4>
                        <p className="text-sm">{note.clientName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Produits ({note.items.length}):</h4>
                        <ul className="text-sm list-disc ml-5">
                          {note.items.slice(0, 2).map((item, index) => (
                            <li key={index}>
                              {item.quantity} x {item.productName}
                            </li>
                          ))}
                          {note.items.length > 2 && (
                            <li className="text-muted-foreground">
                              + {note.items.length - 2} autres produits
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t p-4 bg-muted/20 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total HT: {totalHT.toFixed(3)} TND |
                        TVA: {totalTVA.toFixed(3)} TND
                        {note.fodec && note.fodec > 0 && ` | FODEC: ${note.fodec.toFixed(3)} TND`}
                        {note.timbreFiscal && note.timbreFiscal > 0 && ` | Timbre: ${note.timbreFiscal.toFixed(3)} TND`}
                      </div>
                      <div className="text-lg font-semibold">
                        Total TTC: {totalTTC.toFixed(3)} TND
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePrint(note)}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                      </Button>
                      
                      {note.status === "pending" && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAcceptDeliveryNote(note.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Valider
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRejectDeliveryNote(note.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Aucun bon de livraison trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore créé de bon de livraison ou votre recherche ne correspond à aucun résultat.
            </p>
            <Link to="/delivery-notes/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau bon de livraison
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryNotes;
