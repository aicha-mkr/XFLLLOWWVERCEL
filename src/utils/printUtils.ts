
// Extend the Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      print?: (htmlContent: string) => Promise<void>;
      [key: string]: any;
    };
  }
}

// Utilitaire pour l'impression compatible avec Desktop et Electron
export const printDocument = (htmlContent: string, title: string = 'Document') => {
  console.log('Starting print process...');
  
  // Vérifier si nous sommes dans Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
  
  if (isElectron) {
    console.log('Printing with Electron API...');
    // Utiliser l'API Electron pour l'impression directe
    const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Attendre que le contenu se charge puis déclencher l'impression automatiquement
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // Fermer la fenêtre après l'impression pour desktop
          printWindow.onafterprint = () => {
            setTimeout(() => printWindow.close(), 500);
          };
        }, 300);
      };
    }
  } else {
    // Fallback pour les navigateurs web standard et desktop
    console.log('Printing with standard web API...');
    const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // Auto-close pour desktop
          printWindow.onafterprint = () => {
            setTimeout(() => printWindow.close(), 500);
          };
        }, 300);
      };
    }
  }
};

export const viewDocument = (htmlContent: string, title: string = 'Document') => {
  const detailsWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
  if (detailsWindow) {
    detailsWindow.document.write(htmlContent);
    detailsWindow.document.close();
    detailsWindow.document.title = title;
  }
};

// Fonction optimisée pour Desktop et Electron qui force l'impression directe immédiate
export const printDocumentElectron = (htmlContent: string, title: string = 'Document') => {
  console.log('Initiating immediate Desktop/Electron print...');
  
  const printWindow = window.open('', '_blank', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes');
  if (printWindow) {
    // Ajouter des styles pour l'impression et script d'auto-impression optimisé pour desktop
    const styledContent = htmlContent.replace(
      '</head>',
      `
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            @page { margin: 0.5in; size: A4; }
            .invoice-container { 
              max-width: 100%; 
              margin: 0; 
              padding: 0;
              border: none !important;
            }
          }
        </style>
        <script>
          window.onload = function() {
            // Focus sur la fenêtre puis impression immédiate pour desktop
            window.focus();
            setTimeout(function() {
              console.log('Triggering print dialog...');
              window.print();
              // Auto-fermer après impression pour desktop
              window.onafterprint = function() {
                console.log('Print completed, closing window...');
                setTimeout(function() {
                  window.close();
                }, 500);
              };
              // Fallback pour fermer si onafterprint ne fonctionne pas
              setTimeout(function() {
                if (!window.closed) {
                  window.close();
                }
              }, 10000);
            }, 200);
          };
        </script>
      </head>`
    );
    
    printWindow.document.write(styledContent);
    printWindow.document.close();
  }
};

// Fonction spéciale pour l'impression directe sur desktop sans popup
export const directPrintDesktop = (htmlContent: string, title: string = 'Document') => {
  console.log('Direct desktop print initiated...');
  
  // Créer un iframe caché pour l'impression directe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Nettoyer après impression
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } catch (error) {
        console.error('Direct print failed, falling back to popup:', error);
        document.body.removeChild(iframe);
        printDocumentElectron(htmlContent, title);
      }
    }, 300);
  }
};
