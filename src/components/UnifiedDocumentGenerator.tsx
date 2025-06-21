
import { Sale, Quote, DeliveryNote, Purchase } from "@/types";

interface CompanySettings {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  logoUrl?: string;
}

const generateDocumentHeader = (
  title: string,
  reference: string,
  date: Date,
  settings: CompanySettings
) => {
  return `
    <div class="document-header">
      <div class="company-info">
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="company-logo" />` : ''}
        <h1 class="company-name">${settings.name || 'Mon Entreprise'}</h1>
        <p class="company-details">
          ${settings.address || ''}<br/>
          Tél: ${settings.phone || ''}<br/>
          Email: ${settings.email || ''}<br/>
          ${settings.website ? `Web: ${settings.website}<br/>` : ''}
          ${settings.taxId ? `Matricule fiscal: ${settings.taxId}` : ''}
        </p>
      </div>
      <div class="document-info">
        <h2 class="document-title">${title}</h2>
        <div class="document-meta">
          <p><strong>Référence:</strong> ${reference}</p>
          <p><strong>Date:</strong> ${new Intl.DateTimeFormat('fr-TN').format(date)}</p>
        </div>
      </div>
    </div>
  `;
};

const generateModernDocumentStyles = () => {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #1e293b;
        background: #ffffff;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        background: #ffffff;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        overflow: hidden;
      }
      
      .document-header {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 40px;
        position: relative;
        overflow: hidden;
      }
      
      .document-header::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 200px;
        height: 200px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        transform: translate(50px, -50px);
      }
      
      .document-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 150px;
        height: 150px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 50%;
        transform: translate(-50px, 50px);
      }
      
      .company-info {
        position: relative;
        z-index: 2;
        flex: 1;
      }
      
      .document-info {
        position: relative;
        z-index: 2;
        text-align: right;
        flex: 1;
      }
      
      .document-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 40px;
      }
      
      .company-logo {
        max-height: 80px;
        max-width: 200px;
        margin-bottom: 20px;
        filter: brightness(0) invert(1);
      }
      
      .company-name {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 16px;
        letter-spacing: -0.025em;
      }
      
      .company-details {
        font-size: 14px;
        line-height: 1.8;
        opacity: 0.95;
        font-weight: 300;
      }
      
      .document-title {
        font-size: 36px;
        font-weight: 800;
        margin-bottom: 20px;
        letter-spacing: -0.025em;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .document-meta p {
        margin: 8px 0;
        font-size: 16px;
        font-weight: 500;
      }
      
      .client-info, .supplier-info {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        margin: 30px;
        padding: 30px;
        border-radius: 12px;
        border-left: 6px solid #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      }
      
      .info-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .info-title::before {
        content: '👤';
        font-size: 16px;
      }
      
      .supplier-info .info-title::before {
        content: '🏢';
      }
      
      .info-details {
        font-size: 15px;
        line-height: 1.8;
        color: #334155;
        font-weight: 400;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 30px 0;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      
      .items-table thead tr {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      }
      
      .items-table th {
        color: white;
        padding: 20px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        border: none;
      }
      
      .items-table td {
        padding: 18px 16px;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: middle;
        font-size: 14px;
      }
      
      .items-table tbody tr {
        transition: background-color 0.2s ease;
      }
      
      .items-table tbody tr:hover {
        background-color: #f8fafc;
      }
      
      .items-table tbody tr:nth-child(even) {
        background-color: #fafbfc;
      }
      
      .items-table .text-right {
        text-align: right;
        font-weight: 500;
      }
      
      .items-table .text-center {
        text-align: center;
        font-weight: 500;
      }
      
      .totals-section {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        margin: 30px;
        padding: 30px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      
      .totals-table {
        width: 100%;
        max-width: 450px;
        margin-left: auto;
      }
      
      .totals-table td {
        padding: 12px 0;
        border: none;
        font-size: 15px;
      }
      
      .totals-table td:first-child {
        font-weight: 500;
        color: #475569;
      }
      
      .totals-table td:last-child {
        text-align: right;
        font-weight: 600;
        color: #1e293b;
      }
      
      .totals-table .total-row td {
        padding-top: 16px;
        border-top: 3px solid #3b82f6;
        font-weight: 700;
        font-size: 18px;
        color: #1d4ed8;
      }
      
      .footer {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        color: white;
        padding: 30px;
        text-align: center;
        font-size: 14px;
        font-weight: 400;
      }
      
      .expiration-notice {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 2px solid #f59e0b;
        color: #92400e;
        padding: 20px;
        margin: 30px;
        border-radius: 12px;
        text-align: center;
        font-weight: 600;
        font-size: 15px;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
      }
      
      .expiration-notice::before {
        content: '⏰';
        margin-right: 8px;
        font-size: 18px;
      }
      
      .delivery-info {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        border: 2px solid #3b82f6;
        color: #1e40af;
        padding: 20px;
        margin: 30px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
      }
      
      .delivery-info h4 {
        margin: 0 0 12px 0;
        color: #1d4ed8;
        font-size: 16px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .delivery-info p {
        margin: 8px 0;
        font-size: 14px;
        font-weight: 500;
      }
      
      .signature-section {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        margin: 30px;
        padding: 30px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        text-align: center;
      }
      
      .signature-section p {
        font-size: 15px;
        font-weight: 500;
        color: #475569;
        margin-bottom: 20px;
      }
      
      .signature-box {
        border: 2px dashed #cbd5e1;
        height: 80px;
        width: 250px;
        margin: 0 auto;
        border-radius: 8px;
        background: white;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        
        .invoice-container {
          box-shadow: none;
          border-radius: 0;
          max-width: none;
        }
        
        @page {
          margin: 0.5in;
          size: A4;
        }
      }
    </style>
  `;
};

export const generateInvoiceHTML = (
  sale: Sale, 
  formatCurrency: (amount: number) => string, 
  settings: CompanySettings
) => {
  const clientInfo = `
    <div class="client-info">
      <h3 class="info-title">Informations Client</h3>
      <div class="info-details">
        <strong>${sale.clientName}</strong><br/>
        ${sale.clientAddress || ''}<br/>
        ${sale.clientPhone || ''}<br/>
        ${sale.clientEmail || ''}
      </div>
    </div>
  `;

  const itemsTable = `
    <table class="items-table">
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="text-center">Qté</th>
          <th class="text-right">Prix Unit.</th>
          <th class="text-right">TVA</th>
          <th class="text-right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items.map(item => `
          <tr>
            <td>${item.productName}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${item.vatRate}%</td>
            <td class="text-right">${formatCurrency(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const totalsSection = `
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Total HT:</td>
          <td class="text-right">${formatCurrency(sale.totalHT)}</td>
        </tr>
        <tr>
          <td>TVA:</td>
          <td class="text-right">${formatCurrency(sale.totalTVA)}</td>
        </tr>
        <tr class="total-row">
          <td>Total TTC:</td>
          <td class="text-right">${formatCurrency(sale.totalTTC)}</td>
        </tr>
      </table>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Facture ${sale.invoiceNumber || sale.id}</title>
      ${generateModernDocumentStyles()}
    </head>
    <body>
      <div class="invoice-container">
        ${generateDocumentHeader('FACTURE', sale.invoiceNumber || sale.id, sale.date, settings)}
        ${clientInfo}
        ${itemsTable}
        ${totalsSection}
        <div class="footer">
          <p>Merci pour votre confiance !</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateQuoteHTML = (
  quote: Quote, 
  formatCurrency: (amount: number) => string, 
  settings: CompanySettings
) => {
  const clientInfo = `
    <div class="client-info">
      <h3 class="info-title">Informations Client</h3>
      <div class="info-details">
        <strong>${quote.clientName}</strong><br/>
        ${quote.clientAddress || ''}<br/>
        ${quote.clientPhone || ''}<br/>
        ${quote.clientEmail || ''}
      </div>
    </div>
  `;

  const expirationNotice = `
    <div class="expiration-notice">
      Ce devis est valable jusqu'au ${new Intl.DateTimeFormat('fr-TN').format(new Date(quote.validUntil))}
    </div>
  `;

  const itemsTable = `
    <table class="items-table">
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="text-center">Qté</th>
          <th class="text-right">Prix Unit.</th>
          <th class="text-right">TVA</th>
          <th class="text-right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${quote.items.map(item => `
          <tr>
            <td>${item.productName}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${item.vatRate}%</td>
            <td class="text-right">${formatCurrency(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const totalsSection = `
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Total HT:</td>
          <td class="text-right">${formatCurrency(quote.totalHT)}</td>
        </tr>
        <tr>
          <td>TVA:</td>
          <td class="text-right">${formatCurrency(quote.totalTVA)}</td>
        </tr>
        <tr class="total-row">
          <td>Total TTC:</td>
          <td class="text-right">${formatCurrency(quote.totalTTC)}</td>
        </tr>
      </table>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Devis ${quote.reference}</title>
      ${generateModernDocumentStyles()}
    </head>
    <body>
      <div class="invoice-container">
        ${generateDocumentHeader('DEVIS', quote.reference, quote.date, settings)}
        ${clientInfo}
        ${expirationNotice}
        ${itemsTable}
        ${totalsSection}
        <div class="footer">
          <p>En attente de votre validation</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateDeliveryNoteHTML = (
  deliveryNote: DeliveryNote,
  formatCurrency: (amount: number) => string,
  settings: CompanySettings
) => {
  const clientInfo = `
    <div class="client-info">
      <h3 class="info-title">Informations Client</h3>
      <div class="info-details">
        <strong>${deliveryNote.clientName}</strong><br/>
        ${deliveryNote.clientAddress || ''}<br/>
        ${deliveryNote.clientPhone || ''}<br/>
        ${deliveryNote.clientEmail || ''}
      </div>
    </div>
  `;

  const deliveryInfo = deliveryNote.deliveryAddress || deliveryNote.deliveryDelay ? `
    <div class="delivery-info">
      <h4>📍 Informations de livraison</h4>
      ${deliveryNote.deliveryAddress ? `<p><strong>Adresse de livraison:</strong> ${deliveryNote.deliveryAddress}</p>` : ''}
      ${deliveryNote.deliveryDelay ? `<p><strong>Délai de livraison:</strong> ${deliveryNote.deliveryDelay}</p>` : ''}
    </div>
  ` : '';

  const itemsTable = `
    <table class="items-table">
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="text-center">Qté livrée</th>
          <th class="text-right">Prix Unit.</th>
          <th class="text-right">TVA</th>
          <th class="text-right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${deliveryNote.items.map(item => `
          <tr>
            <td>${item.productName}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${item.vatRate}%</td>
            <td class="text-right">${formatCurrency(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const totalsSection = `
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Total HT:</td>
          <td class="text-right">${formatCurrency(deliveryNote.totalHT)}</td>
        </tr>
        <tr>
          <td>TVA:</td>
          <td class="text-right">${formatCurrency(deliveryNote.totalTVA)}</td>
        </tr>
        <tr class="total-row">
          <td>Total TTC:</td>
          <td class="text-right">${formatCurrency(deliveryNote.totalTTC)}</td>
        </tr>
      </table>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bon de livraison ${deliveryNote.reference}</title>
      ${generateModernDocumentStyles()}
    </head>
    <body>
      <div class="invoice-container">
        ${generateDocumentHeader('BON DE LIVRAISON', deliveryNote.reference, deliveryNote.date, settings)}
        ${clientInfo}
        ${deliveryInfo}
        ${itemsTable}
        ${totalsSection}
        <div class="signature-section">
          <p>Signature du destinataire:</p>
          <div class="signature-box"></div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generatePurchaseOrderHTML = (
  purchase: Purchase,
  formatCurrency: (amount: number) => string,
  settings: CompanySettings
) => {
  const supplierInfo = `
    <div class="supplier-info">
      <h3 class="info-title">Fournisseur</h3>
      <div class="info-details">
        <strong>${purchase.supplier}</strong>
      </div>
    </div>
  `;

  const itemsTable = `
    <table class="items-table">
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="text-center">Qté</th>
          <th class="text-right">Prix Unit.</th>
          <th class="text-right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${purchase.items.map(item => `
          <tr>
            <td>${item.productName}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${formatCurrency(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const totalsSection = `
    <div class="totals-section">
      <table class="totals-table">
        <tr class="total-row">
          <td>TOTAL:</td>
          <td class="text-right">${formatCurrency(purchase.total)}</td>
        </tr>
      </table>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bon de commande ${purchase.reference}</title>
      ${generateModernDocumentStyles()}
    </head>
    <body>
      <div class="invoice-container">
        ${generateDocumentHeader('BON DE COMMANDE', purchase.reference, purchase.date, settings)}
        ${supplierInfo}
        ${itemsTable}
        ${totalsSection}
        <div class="signature-section">
          <p>Signature et cachet:</p>
          <div class="signature-box"></div>
        </div>
      </div>
    </body>
    </html>
  `;
};
