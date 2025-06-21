export const generateModernInvoiceHTML = (sale: any, client: any, formatCurrency: (amount: number) => string, settings: any) => {
  const logoBase64 = settings.logo ? `data:image/png;base64,${settings.logo}` : '';
  
  // Get payment status display
  const getPaymentStatusDisplay = (status: string) => {
    switch (status) {
      case 'paid': return { text: 'Payé', color: '#059669', bgColor: '#D1FAE5' };
      case 'pending': return { text: 'En attente', color: '#D97706', bgColor: '#FEF3C7' };
      case 'partial': return { text: 'Partiel', color: '#2563EB', bgColor: '#DBEAFE' };
      case 'canceled': return { text: 'Annulé', color: '#DC2626', bgColor: '#FEE2E2' };
      default: return { text: 'Non défini', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const paymentStatus = getPaymentStatusDisplay(sale.paymentStatus);
  
  // Function to convert number to words in French
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
        
        if (tensDigit === 7) {
          const remainder = n % 10;
          if (remainder > 0) {
            result += teens[remainder];
          }
        } else if (tensDigit === 9) {
          const remainder = n % 10;
          if (remainder > 0) {
            result += teens[remainder];
          }
        } else {
          const remainder = n % 10;
          if (remainder > 0) result += '-' + units[remainder];
        }
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
    
    if (decimalPart > 0) {
      result += ' virgule ' + convertHundreds(decimalPart) + ' millimes';
    }
    
    return result.charAt(0).toUpperCase() + result.slice(1);
  };
  
  // Calculate real TVA breakdown by rate
  const tvaBreakdown = sale.items.reduce((acc: any, item: any) => {
    const vatRate = item.vatRate || 19;
    const itemHT = item.quantity * item.unitPrice;
    const itemTVA = itemHT * (vatRate / 100);
    
    if (!acc[vatRate]) {
      acc[vatRate] = { baseHT: 0, montantTVA: 0 };
    }
    acc[vatRate].baseHT += itemHT;
    acc[vatRate].montantTVA += itemTVA;
    
    return acc;
  }, {});

  // Display all items from the sale + add empty rows to reach minimum 7 rows
  const displayItems = sale.items || [];
  const minRows = 2;
  const emptyRowsNeeded = Math.max(0, minRows - displayItems.length);
  
  // Create empty rows
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Facture ${sale.invoiceNumber || sale.id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.3;
          color: #374151;
          background: white;
          padding: 0;
          margin: 0;
        }
        
        @page {
          size: A4;
          margin: 0.5cm;
        }
        
        .invoice-container {
          width: 21cm;
          height: 28.7cm;
          margin: 0 auto;
          background: white;
          display: flex;
          flex-direction: column;
          border: 3px solid #87CEEB;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        
        .invoice-header {
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%);
          color: #0891B2;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-shrink: 0;
          border-bottom: 2px solid #87CEEB;
        }
        
        .company-section {
          flex: 1;
        }
        
        .logo {
          max-width: 50px;
          max-height: 50px;
          margin-bottom: 6px;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        
        .company-info h1 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #0891B2;
        }
        
        .company-info p {
          font-size: 12px;
          color: #0891B2;
          margin-bottom: 2px;
        }
        
        .invoice-section {
          background: rgba(255,255,255,0.95);
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          min-width: 180px;
          box-shadow: 0 3px 10px rgba(135, 206, 235, 0.1);
          border: 2px solid #87CEEB;
        }
        
        .invoice-section h2 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #0891B2;
        }
        
        .invoice-number {
          font-size: 14px;
          margin-bottom: 4px;
          font-weight: 600;
          color: #0891B2;
        }
        
        .invoice-date {
          font-size: 12px;
          color: #0891B2;
        }
        
        .content-wrapper {
          flex: 1;
          padding: 12px 20px 50px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        
        .client-section {
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          border-left: 4px solid #87CEEB;
          border: 2px solid #B0E0E6;
          flex-shrink: 0;
        }
        
        .client-section h3 {
          color: #0891B2;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .client-details p {
          font-size: 12px;
          margin-bottom: 2px;
          color: #475569;
        }
        
        .client-name {
          font-weight: 700;
          font-size: 14px;
          color: #1E293B;
          margin-bottom: 4px;
        }
        
        .items-section {
          margin-bottom: 10px;
          flex-shrink: 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          border: 2px solid #87CEEB;
          table-layout: fixed;
        }
        
        .items-table thead {
          background: linear-gradient(135deg, #87CEEB 0%, #5FB3D3 100%);
        }
        
        .items-table th {
          padding: 8px 4px;
          text-align: center;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #FFFFFF;
          border-right: 1px solid rgba(255,255,255,0.2);
          vertical-align: middle;
        }
        
        .items-table th:last-child {
          border-right: none;
        }
        
        .items-table tbody tr {
          border-bottom: 1px solid #E2E8F0;
          height: 28px;
        }
        
        .items-table tbody tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        
        .items-table tbody tr:nth-child(odd) {
          background-color: #FFFFFF;
        }
        
        .items-table td {
          padding: 4px 3px;
          font-size: 10px;
          text-align: center;
          color: #374151;
          height: 28px;
          vertical-align: middle;
          border-right: 1px solid #E2E8F0;
          word-wrap: break-word;
          overflow: hidden;
        }
        
        .items-table td:last-child {
          border-right: none;
        }
        
        .text-left {
          text-align: left !important;
          padding-left: 4px !important;
        }
        
        .text-right {
          text-align: right !important;
          padding-right: 4px !important;
        }
        
        .text-center {
          text-align: center !important;
        }
        
        /* Updated column widths for both HT and TTC prices */
        .col-ref { 
          width: 10%; 
          text-align: center;
        }
        .col-designation { 
          width: 28%; 
          text-align: left;
          padding-left: 4px;
        }
        .col-qty { 
          width: 8%; 
          text-align: center;
        }
        .col-price-ht { 
          width: 12%; 
          text-align: right;
          padding-right: 4px;
        }
        .col-price-ttc { 
          width: 12%; 
          text-align: right;
          padding-right: 4px;
        }
        .col-discount { 
          width: 8%; 
          text-align: center;
        }
        .col-vat { 
          width: 8%; 
          text-align: center;
        }
        .col-total { 
          width: 14%; 
          text-align: right;
          padding-right: 4px;
        }
        
        .totals-section {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          margin-bottom: 8px;
          flex-shrink: 0;
        }
        
        .tva-section {
          flex: 1;
        }
        
        .tva-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          border: 2px solid #20B2AA;
        }
        
        .tva-table th {
          background: linear-gradient(135deg, #20B2AA 0%, #48D1CC 100%);
          color: #FFFFFF;
          padding: 6px 4px;
          font-size: 10px;
          font-weight: 600;
          text-align: center;
        }
        
        .tva-table td {
          padding: 4px;
          font-size: 10px;
          border: 1px solid #E2E8F0;
          text-align: center;
          background: white;
          color: #374151;
        }
        
        .totals-table {
          width: 220px;
          border-collapse: collapse;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          border: 2px solid #87CEEB;
        }
        
        .totals-table td {
          padding: 6px 8px;
          font-size: 11px;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .totals-table .label {
          text-align: left;
          background: #F0F9FF;
          font-weight: 500;
          color: #475569;
        }
        
        .totals-table .amount {
          text-align: right;
          font-weight: 600;
          background: white;
          color: #1E293B;
        }
        
        .totals-table .total-row {
          background: linear-gradient(135deg, #87CEEB 0%, #5FB3D3 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 12px;
        }
        
        .amount-in-words {
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%);
          padding: 8px;
          border-radius: 6px;
          margin: 8px 0;
          border: 2px solid #B0E0E6;
          font-style: italic;
          font-weight: 600;
          color: #0891B2;
          text-align: center;
          font-size: 12px;
          flex-shrink: 0;
        }
        
        .payment-section {
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%);
          padding: 8px;
          display: flex;
          gap: 10px;
          border-radius: 6px;
          margin-bottom: 8px;
          border: 2px solid #B0E0E6;
          flex-shrink: 0;
        }
        
        .payment-info {
          flex: 1;
        }
        
        .payment-info h4 {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #0891B2;
          text-transform: uppercase;
        }
        
        .payment-info p {
          font-size: 11px;
          color: #475569;
          margin-bottom: 2px;
        }
        
        .payment-status-badge {
          display: inline-block;
          padding: 3px 6px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 4px;
          background-color: ${paymentStatus.bgColor};
          color: ${paymentStatus.color};
          border: 1px solid ${paymentStatus.color};
        }
        
        .signature-section {
          flex: 1;
          max-width: 220px;
        }
        
        .signature-container {
          border: 2px solid #B0E0E6;
          border-radius: 6px;
          padding: 8px;
          height: 100px;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }
        
        .signature-titles {
          display: flex;
          justify-content: space-around;
          width: 100%;
          margin-bottom: 6px;
        }
        
        .signature-title {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-align: center;
        }
        
        .signature-space {
          flex: 1;
          width: 100%;
          border: 1px dashed #D1D5DB;
          border-radius: 4px;
          background: #FAFAFA;
        }
        
        .bank-footer {
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%);
          padding: 8px 20px;
          text-align: center;
          font-size: 11px;
          color: #0891B2;
          border-top: 2px solid #87CEEB;
          border-radius: 0 0 6px 6px;
          flex-shrink: 0;
        }
        
        .bank-footer p {
          margin: 2px 0;
          font-weight: 500;
        }
        
        .bank-details {
          display: flex;
          justify-content: center;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .bank-info {
          font-weight: 600;
        }
        
        /* Print styles */
        @media print {
          body { 
            padding: 0 !important; 
            margin: 0 !important;
            background: white !important;
            font-size: 10px !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .invoice-container { 
            box-shadow: none !important;
            border-radius: 0 !important;
            height: auto !important;
            max-height: 28.7cm !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            border: 2px solid #87CEEB !important;
          }
          
          .invoice-header {
            border-radius: 0 !important;
            background: linear-gradient(135deg, #F0F9FF 0%, #E0F7FA 100%) !important;
            color: #0891B2 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            padding: 6px 12px !important;
            border-bottom: 2px solid #87CEEB !important;
          }
          
          .content-wrapper {
            padding: 8px 12px !important;
          }
          
          .items-table tbody tr {
            height: 25px !important;
          }
          
          .items-table td {
            height: 25px !important;
            padding: 2px !important;
          }
          
          .bank-footer {
            page-break-inside: avoid !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="company-section">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo">` : '<div style="width:50px;height:50px;border:2px solid rgba(135,206,235,0.15);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;margin-bottom:6px;background:rgba(135,206,235,0.05);color:#0891B2;">LOGO</div>'}
            <div class="company-info">
              <h1>${settings.companyName || settings.name || 'Xflow'}</h1>
              <p>${settings.address || 'Adresse non spécifiée'}</p>
              <p>MF: ${settings.taxNumber || settings.taxId || 'Non spécifié'}</p>
              <p>Téléphone: ${settings.phone || 'Non spécifié'}</p>
              <p>Email: ${settings.email || 'Non spécifié'}</p>
            </div>
          </div>
          
          <div class="invoice-section">
            <h2>FACTURE</h2>
            <p class="invoice-number">${sale.invoiceNumber || `FACT-${sale.id}`}</p>
            <p class="invoice-date">Date: ${new Intl.DateTimeFormat('fr-TN').format(new Date(sale.date))}</p>
          </div>
        </div>
        
        <div class="content-wrapper">
          <div class="client-section">
            <h3>Informations du client</h3>
            <div class="client-details">
              <p class="client-name"><strong>${client?.name || sale.clientName}</strong></p>
              <p>${client?.address || sale.clientAddress || ''}</p>
              ${client?.city ? `<p>${client.city}${client.postalCode ? ' ' + client.postalCode : ''}${client.country ? ', ' + client.country : ''}</p>` : ''}
              <p>Tél: ${client?.phone || sale.clientPhone || ''}</p>
              <p>Email: ${client?.email || sale.clientEmail || ''}</p>
              <p>MF: ${client?.fiscalId || sale.clientFiscalId || ''}</p>
            </div>
          </div>
          
          <div class="items-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th class="col-ref">REF</th>
                  <th class="col-designation">DESIGNATION</th>
                  <th class="col-qty">QTÉ</th>
                  <th class="col-price-ht">P.U.HT</th>
                  <th class="col-price-ttc">P.U.TTC</th>
                  <th class="col-discount">REMISE</th>
                  <th class="col-vat">TVA</th>
                  <th class="col-total">TOTAL HT</th>
                </tr>
              </thead>
              <tbody>
                ${allRows.map((item: any, index: number) => {
                  if (item.isEmpty) {
                    return `
                    <tr>
                      <td class="col-ref">&nbsp;</td>
                      <td class="col-designation text-left">&nbsp;</td>
                      <td class="col-qty">&nbsp;</td>
                      <td class="col-price-ht text-right">&nbsp;</td>
                      <td class="col-price-ttc text-right">&nbsp;</td>
                      <td class="col-discount">&nbsp;</td>
                      <td class="col-vat">&nbsp;</td>
                      <td class="col-total text-right">&nbsp;</td>
                    </tr>
                  `;
                  }
                  
                  const quantity = item.quantity || 0;
                  const unitPrice = item.unitPrice || 0;
                  const vatRate = item.vatRate || 19;
                  
                  const itemHT = quantity * unitPrice;
                  const unitPriceTTC = unitPrice * (1 + vatRate / 100);
                  
                  // Generate REF from product data or create one
                  const productRef = item.productRef || 
                                   item.ref || 
                                   item.sku || 
                                   item.code ||
                                   `REF-${String(index + 1).padStart(3, '0')}`;
                  
                  const productName = item.productName || item.name || item.description || '';
                  
                  return `
                  <tr>
                    <td class="col-ref">${productRef}</td>
                    <td class="col-designation text-left">${productName}</td>
                    <td class="col-qty">${quantity}</td>
                    <td class="col-price-ht text-right">${formatCurrency(unitPrice)}</td>
                    <td class="col-price-ttc text-right">${formatCurrency(unitPriceTTC)}</td>
                    <td class="col-discount">-</td>
                    <td class="col-vat">${vatRate}%</td>
                    <td class="col-total text-right">${formatCurrency(itemHT)}</td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="totals-section">
            <div class="tva-section">
              <table class="tva-table">
                <thead>
                  <tr>
                    <th>Taux TVA</th>
                    <th>Base HT</th>
                    <th>Montant TVA</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(tvaBreakdown).map(([rate, data]: [string, any]) => `
                    <tr>
                      <td>${rate}%</td>
                      <td>${formatCurrency(data.baseHT)}</td>
                      <td>${formatCurrency(data.montantTVA)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <table class="totals-table">
              <tr>
                <td class="label">MONTANT TOTAL HT:</td>
                <td class="amount">${formatCurrency(sale.totalHT)}</td>
              </tr>
              <tr>
                <td class="label">FODEC 1%:</td>
                <td class="amount">${formatCurrency(sale.totalHT * 0.01)}</td>
              </tr>
              <tr>
                <td class="label">TOTAL TVA:</td>
                <td class="amount">${formatCurrency(sale.totalTVA)}</td>
              </tr>
              <tr>
                <td class="label">TIMBRE FISCAL:</td>
                <td class="amount">1.000 DT</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL TTC:</td>
                <td class="text-right">${formatCurrency(sale.totalTTC)}</td>
              </tr>
            </table>
          </div>
          
          <div class="amount-in-words">
            <strong>Arrêté la présente facture à la somme de: ${numberToWords(sale.totalTTC)}</strong>
          </div>
          
          <div class="payment-section">
            <div class="payment-info">
              <h4>Informations de Paiement</h4>
              <p><strong>Mode:</strong> ${sale.paymentMethod === 'cash' ? 'Espèces' : 
                                        sale.paymentMethod === 'check' ? 'Chèque' :
                                        sale.paymentMethod === 'transfer' ? 'Virement' : 
                                        sale.paymentMethod === 'bill' ? 'Traite' : sale.paymentMethod}</p>
              <div class="payment-status-badge">${paymentStatus.text}</div>
            </div>
            
            <div class="signature-section">
              <div class="signature-container">
                <div class="signature-titles">
                  <div class="signature-title" style="text-align: center; width: 100%;">Signature</div>
                </div>
                <div class="signature-space"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bank-footer">
          <div class="bank-details">
            <p class="bank-info">
              <strong>RIB:</strong> ${settings.bankRib || settings.rib || 'RIB non spécifié'}
            </p>
            <p class="bank-info">
              <strong>Banque:</strong> ${settings.bankName || settings.bankAccount || 'BNA'}
            </p>
          </div>
        </div>
      </div>
      
      <script>
        // Auto-print for Desktop/Electron
        if (typeof window !== 'undefined') {
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              // Auto-close after print for better UX
              window.onafterprint = function() {
                window.close();
              };
            }, 200);
          };
        }
      </script>
    </body>
    </html>
  `;
};
