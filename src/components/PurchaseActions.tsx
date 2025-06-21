import { useState } from "react";
import { Printer, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import { Purchase, Supplier } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useUserPermissions } from "@/hooks/use-user-permissions";

const generateModernPurchaseOrderHTML = (purchase: any, supplier: any, formatCurrency: (amount: number) => string, settings: any) => {
  const logoBase64 = settings.logo ? `data:image/png;base64,${settings.logo}` : '';
  
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
  
  const tvaBreakdown = (purchase.items || []).reduce((acc: any, item: any) => {
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

  const displayItems = (purchase.items || []).map((item:any) => {
    const totalHT = (item.quantity || 0) * (item.unitPrice || 0);
    const remise = item.discount || 0;
    const totalAfterRemise = totalHT * (1 - remise / 100);
    const unitPriceTTC = (item.unitPrice || 0) * (1 + ((item.vatRate || 19) / 100));
    return {
        ...item,
        totalHT,
        remise,
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
      <title>Bon de Commande ${purchase.reference || purchase.id}</title>
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
          .footer-info { margin-top: auto; padding-top: 10px; border-top: 1px solid #e5e7eb; flex-shrink: 0; }
          .footer-info p { font-size: 13px; color: #475569; background: #F0F9FF; padding: 8px; border-radius: 6px; border: 1px solid #B0E0E6; text-align: center; }
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
            <h2>BON DE COMMANDE</h2>
            <div class="invoice-number">${purchase.reference || purchase.id}</div>
            <div class="invoice-date">Date: ${new Date(purchase.date).toLocaleDateString('fr-FR')}</div>
          </div>
        </header>
        <main class="content-wrapper">
          <div class="client-section">
            <h3>INFORMATIONS DU FOURNISSEUR</h3>
            <div class="client-details">
                <p class="client-name"><strong>${supplier?.name || purchase.supplierName}</strong></p>
                <p>Adresse: ${supplier?.address || 'Non spécifiée'}</p>
                <p>MF: ${supplier?.taxId || 'Non spécifié'}</p>
                <p>Tél: ${supplier?.phone || 'Non spécifié'}</p>
                <p>Email: ${supplier?.email || 'Non spécifié'}</p>
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
                <p><strong>Montant Total HT:</strong> <span>${formatCurrency(purchase.totalHT || 0)}</span></p>
                <p><strong>FODEC 1%:</strong> <span>${formatCurrency(purchase.fodec || 0)}</span></p>
                <p><strong>Total TVA:</strong> <span>${formatCurrency(purchase.totalTVA || 0)}</span></p>
                <p><strong>Timbre Fiscal:</strong> <span>${formatCurrency(purchase.timbreFiscal || 0)}</span></p>
                <p class="total-ttc"><strong>Total TTC:</strong> <span>${formatCurrency(purchase.totalTTC || 0)}</span></p>
            </div>
          </div>
          <div class="footer-info">
             <p>Arrêté le présent bon de commande à la somme de: <strong>${numberToWords(purchase.totalTTC || 0)}</strong>.</p>
          </div>
          <div class="signature-section">
            <div class="signature-box-styled">
              <p>Signature</p>
              <div class="signature-pad"></div>
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

interface PurchaseActionsProps {
  purchase: any; 
  onDelete?: (id: string) => void;
}

const PurchaseActions = ({ purchase, onDelete }: PurchaseActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const { canDelete } = useUserPermissions();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-TN', { 
      style: 'currency', 
      currency: settings.currency || 'TND',
      minimumFractionDigits: 3 
    }).format(value);
  };
  
  const handlePrint = () => {
    const suppliersData = localStorage.getItem('suppliers');
    if (!suppliersData) {
      toast({ title: "Erreur", description: "Liste de fournisseurs non trouvée.", variant: "destructive" });
      return;
    }

    const allSuppliers: Supplier[] = JSON.parse(suppliersData);
    const supplier = allSuppliers.find(s => s.name === purchase.supplier);

    if (!supplier) {
        toast({ title: "Erreur", description: `Fournisseur '${purchase.supplier}' non trouvé.`, variant: "destructive" });
        return;
    }
    
    const totalHT = purchase.items.reduce((sum:any, item:any) => sum + item.total, 0);
    const totalTVA = purchase.items.reduce((sum:any, item:any) => {
        const vatRate = (item as any).vatRate || 19;
        return sum + (item.total * (vatRate / 100));
    }, 0);
    const fodec = totalHT * 0.01;
    const timbreFiscal = 1.000;
    const totalTTC = totalHT + totalTVA + fodec + timbreFiscal;

    const augmentedPurchase = {
        ...purchase,
        totalHT,
        totalTVA,
        fodec,
        timbreFiscal,
        totalTTC
    };
    
    const htmlContent = generateModernPurchaseOrderHTML(augmentedPurchase, supplier, formatCurrency, settings);
    
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

  const handleDelete = () => {
    if (onDelete) {
      onDelete(purchase.id);
      setShowDeleteDialog(false);
    } else {
      toast({
        title: "Erreur",
        description: "La fonction de suppression n'est pas disponible.",
        variant: "destructive",
      });
    }
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
            <span>Imprimer</span>
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Supprimer</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera définitivement le bon de commande.
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

export default PurchaseActions;
