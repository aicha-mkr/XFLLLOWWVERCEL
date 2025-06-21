
import { Sale } from "@/types";
import { CompanySettings } from "@/types";

export const generateInvoiceHTML = (
  sale: Sale, 
  formatCurrency: (amount: number) => string, 
  settings: CompanySettings
) => {
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const saleDate = new Date(sale.date).toLocaleDateString('fr-FR');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Facture #${sale.id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          background: white;
          font-size: 14px;
          padding: 0;
        }
        
        .invoice-container {
          max-width: 21cm;
          margin: 0 auto;
          background: white;
          padding: 2cm;
          min-height: 29.7cm;
          display: flex;
          flex-direction: column;
        }
        
        .invoice-header {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 40px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
        }
        
        .company-info h1 {
          font-size: 32px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .company-details {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
        }
        
        .invoice-meta {
          text-align: right;
          background: #f8fafc;
          padding: 25px;
          border-radius: 10px;
          border-left: 4px solid #2563eb;
          min-width: 280px;
        }
        
        .invoice-number {
          font-size: 28px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 8px;
        }
        
        .invoice-date {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .client-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 25px;
          margin-bottom: 25px;
          border-left: 4px solid #10b981;
        }
        
        .client-section h2 {
          color: #10b981;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .client-info {
          font-size: 14px;
          line-height: 1.5;
        }
        
        .client-name {
          font-weight: 600;
          font-size: 16px;
          color: #1f2937;
          margin-bottom: 6px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
          font-size: 13px;
          flex-grow: 1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .items-table thead {
          background: #2563eb;
          color: white;
        }
        
        .items-table th {
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .items-table td {
          padding: 12px;
          font-size: 13px;
        }
        
        .items-table .text-right {
          text-align: right;
          font-weight: 500;
        }
        
        .items-table .text-center {
          text-align: center;
        }
        
        .totals-section {
          margin-top: auto;
          background: #f8fafc;
          border-radius: 10px;
          padding: 25px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .totals-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 15px;
          max-width: 400px;
          margin-left: auto;
        }
        
        .total-row {
          display: contents;
        }
        
        .total-label {
          padding: 10px 0;
          font-size: 14px;
          color: #4b5563;
        }
        
        .total-value {
          padding: 10px 0;
          text-align: right;
          font-weight: 500;
          font-size: 14px;
        }
        
        .final-total {
          border-top: 2px solid #2563eb;
          margin-top: 10px;
          padding-top: 15px;
        }
        
        .final-total .total-label {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .final-total .total-value {
          font-size: 20px;
          font-weight: 700;
          color: #2563eb;
        }
        
        .payment-info {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 25px;
          margin-top: 20px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          border: 1px solid #d1d5db;
        }
        
        .payment-method {
          font-size: 14px;
          line-height: 1.5;
        }
        
        .payment-method strong {
          color: #1f2937;
        }
        
        .payment-status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-paid {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #22c55e;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
        }
        
        .status-partial {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #3b82f6;
        }
        
        .invoice-footer {
          margin-top: 25px;
          text-align: center;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        
        .footer-highlight {
          color: #2563eb;
          font-weight: 600;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          
          .invoice-container {
            margin: 0;
            padding: 1.5cm;
            min-height: auto;
            max-height: 29.7cm;
            page-break-inside: avoid;
          }
          
          .invoice-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
          }
          
          .company-info h1 {
            font-size: 26px;
          }
          
          .invoice-number {
            font-size: 22px;
          }
          
          .totals-section {
            page-break-inside: avoid;
            margin-top: 20px;
          }
          
          .invoice-footer {
            position: fixed;
            bottom: 1cm;
            left: 1.5cm;
            right: 1.5cm;
          }
        }
        
        @page {
          size: A4;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="company-info">
            <h1>${settings.name}</h1>
            <div class="company-details">
              ${settings.address ? `${settings.address}<br>` : ''}
              ${settings.phone ? `Tél: ${settings.phone}` : ''}
              ${settings.email ? ` • Email: ${settings.email}` : ''}
              ${settings.taxId ? `<br>Matricule fiscal: ${settings.taxId}` : ''}
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-number">FACTURE #${sale.invoiceNumber || sale.id}</div>
            <div class="invoice-date">Date: ${saleDate}</div>
            <div class="invoice-date">Générée le: ${currentDate}</div>
          </div>
        </div>
        
        <div class="client-section">
          <h2>Facturer à</h2>
          <div class="client-name">${sale.clientName}</div>
          <div class="client-info">
            ${sale.clientAddress ? `${sale.clientAddress}<br>` : ''}
            ${sale.clientFiscalId ? `Matricule fiscal: ${sale.clientFiscalId}` : ''}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40%;">Description</th>
              <th class="text-center" style="width: 12%;">Qté</th>
              <th class="text-right" style="width: 16%;">Prix unit.</th>
              <th class="text-center" style="width: 12%;">TVA</th>
              <th class="text-right" style="width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td style="font-weight: 500;">${item.productName}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                <td class="text-center">${item.vatRate}%</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="totals-grid">
            <div class="total-row">
              <div class="total-label">Sous-total HT:</div>
              <div class="total-value">${formatCurrency(sale.totalHT)}</div>
            </div>
            <div class="total-row">
              <div class="total-label">TVA:</div>
              <div class="total-value">${formatCurrency(sale.totalTVA)}</div>
            </div>
            ${sale.fodec ? `
              <div class="total-row">
                <div class="total-label">FODEC (1%):</div>
                <div class="total-value">${formatCurrency(sale.fodec)}</div>
              </div>
            ` : ''}
            ${sale.timbreFiscal ? `
              <div class="total-row">
                <div class="total-label">Timbre fiscal:</div>
                <div class="total-value">${formatCurrency(sale.timbreFiscal)}</div>
              </div>
            ` : ''}
            <div class="total-row final-total">
              <div class="total-label">TOTAL TTC:</div>
              <div class="total-value">${formatCurrency(sale.totalTTC)}</div>
            </div>
          </div>
          
          <div class="payment-info">
            <div class="payment-method">
              <strong>Paiement:</strong> ${
                sale.paymentMethod === 'cash' ? 'Espèces' :
                sale.paymentMethod === 'check' ? 'Chèque' :
                sale.paymentMethod === 'transfer' ? 'Virement' :
                sale.paymentMethod === 'bill' ? 'Traite' : sale.paymentMethod
              }
              ${sale.checkNumber ? `<br><small>N° ${sale.checkNumber}</small>` : ''}
              ${sale.transferNumber ? `<br><small>N° ${sale.transferNumber}</small>` : ''}
            </div>
            <div class="payment-status ${
              sale.paymentStatus === 'paid' ? 'status-paid' :
              sale.paymentStatus === 'partial' ? 'status-partial' : 'status-pending'
            }">
              ${
                sale.paymentStatus === 'paid' ? 'Payé' :
                sale.paymentStatus === 'partial' ? 'Partiel' : 'En attente'
              }
            </div>
          </div>
        </div>
        
        <div class="invoice-footer">
          <p><span class="footer-highlight">Merci pour votre confiance!</span></p>
          <p>Facture générée par ${settings.name} ${settings.website ? ` • ${settings.website}` : ''}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
