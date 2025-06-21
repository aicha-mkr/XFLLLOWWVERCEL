export const generateModernPurchaseOrderHTML = (purchase: any, formatCurrency: (amount: number) => string, settings: any) => {
  const logoBase64 = settings.logo ? `data:image/png;base64,${settings.logo}` : '';
  
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed': return { text: 'Reçu', color: '#059669', bgColor: '#D1FAE5' };
      case 'pending': return { text: 'En attente', color: '#D97706', bgColor: '#FEF3C7' };
      case 'canceled': return { text: 'Annulé', color: '#DC2626', bgColor: '#FEE2E2' };
      default: return { text: 'Non défini', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const purchaseStatus = getStatusDisplay(purchase.status);
  
  const displayItems = purchase.items || [];
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bon de Commande ${purchase.reference || purchase.id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.4; color: #374151; background: white; }
        @page { size: A4; margin: 0; }
        .invoice-container { width: 21cm; min-height: 29.7cm; margin: 0 auto; background: white; display: flex; flex-direction: column; padding: 1cm; }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1cm; border-bottom: 4px solid #3b82f6; padding-bottom: 0.5cm; }
        .company-info h1 { font-size: 24px; font-weight: 700; color: #1d4ed8; }
        .company-info p { font-size: 14px; color: #374151; margin-bottom: 2px; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { font-size: 28px; font-weight: 700; color: #3b82f6; margin-bottom: 0.5cm; }
        .invoice-details p { font-size: 14px; font-weight: 500; }
        .customer-info { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 0.5cm; border-radius: 8px; margin-bottom: 1cm; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1cm; }
        .items-table th, .items-table td { border-bottom: 1px solid #e5e7eb; padding: 0.4cm; text-align: left; }
        .items-table th { background-color: #f3f4f6; font-weight: 600; text-transform: uppercase; font-size: 12px; }
        .items-table .text-right { text-align: right; }
        .totals-section { display: flex; justify-content: flex-end; }
        .totals-table { width: 50%; }
        .totals-table td { padding: 0.4cm; border-bottom: 1px solid #e5e7eb; }
        .totals-table .label { font-weight: 600; }
        .totals-table .amount { text-align: right; }
        .totals-table .grand-total td { font-size: 18px; font-weight: 700; background-color: #3b82f6; color: white; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: auto; padding-top: 1cm; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <header class="invoice-header">
          <div class="company-info">
            <h1>${settings.companyName || 'Votre Entreprise'}</h1>
            <p>${settings.address || ''}</p>
            <p>${settings.phone || ''}</p>
            <p>${settings.email || ''}</p>
          </div>
          <div class="invoice-details">
            <h2>BON DE COMMANDE</h2>
            <p><strong>Référence :</strong> ${purchase.reference}</p>
            <p><strong>Date :</strong> ${new Date(purchase.date).toLocaleDateString('fr-FR')}</p>
          </div>
        </header>
        <main>
          <section class="customer-info">
            <h3>Fournisseur</h3>
            <p><strong>${purchase.supplier}</strong></p>
          </section>
          <table class="items-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th class="text-right">Quantité</th>
                <th class="text-right">Prix Unitaire HT</th>
                <th class="text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${displayItems.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right">${formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <section class="totals-section">
            <table class="totals-table">
              <tbody>
                <tr class="grand-total">
                  <td class="label">Total Général</td>
                  <td class="amount">${formatCurrency(purchase.total)}</td>
                </tr>
              </tbody>
            </table>
          </section>
          ${purchase.notes ? `<section class="notes-section" style="margin-top: 1cm;"><p><strong>Notes:</strong> ${purchase.notes}</p></section>` : ''}
        </main>
        <footer class="footer">
          <p>Merci pour votre collaboration.</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}; 