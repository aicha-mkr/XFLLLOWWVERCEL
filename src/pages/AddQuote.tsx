
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";
import ProductSelector from "@/components/ProductSelector";
import { Client, Product } from "@/types";
import { ArrowLeft, Plus, Trash, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/use-products";
import { useQuotes } from "@/contexts/QuotesContext";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { cn } from "@/lib/utils";

// Génération de référence
const generateReference = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DEV-${randomNum}`;
};

// Schema de validation
const formSchema = z.object({
  reference: z.string().min(1, "La référence est requise"),
  clientId: z.string().min(1, "Le client est requis"),
  validUntil: z.date({
    required_error: "La date de validité est requise",
  }),
  includeFodec: z.boolean().default(false),
  includeTimbreFiscal: z.boolean().default(true),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Le produit est requis"),
      quantity: z.number().positive("La quantité doit être positive"),
      unitPrice: z.number().positive("Le prix doit être positif"),
      vatRate: z.number(),
      total: z.number(),
    })
  ).min(1, "Au moins un produit est requis"),
});

type FormValues = z.infer<typeof formSchema>;

const AddQuote = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products } = useProducts();
  const { addQuote } = useQuotes();
  const { settings } = useCompanySettings();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Charger les clients depuis le localStorage
  useEffect(() => {
    const loadClients = () => {
      try {
        const savedClients = localStorage.getItem('clients');
        if (savedClients) {
          setClients(JSON.parse(savedClients));
        }
      } catch (error) {
        console.error("Error loading clients:", error);
      }
    };
    
    loadClients();
  }, []);

  // Initialiser le formulaire avec validité par défaut de 30 jours
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference: generateReference(),
      clientId: "",
      validUntil: addDays(new Date(), 30),
      includeFodec: false,
      includeTimbreFiscal: true,
      items: [{ productId: "", quantity: 1, unitPrice: 0, vatRate: 0, total: 0 }],
    },
  });

  // Watch for form changes to recalculate totals
  const watchedItems = form.watch("items");
  const includeFodec = form.watch("includeFodec");
  const includeTimbreFiscal = form.watch("includeTimbreFiscal");
  
  // Gérer la sélection du client
  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
  };
  
  // Gérer la sélection d'un produit
  const handleProductChange = (productId: string, product: Product, index: number) => {
    const currentItems = form.getValues("items");
    const quantity = currentItems[index]?.quantity || 1;
    const unitPrice = product.sellingPrice;
    const vatRate = product.vatRate;
    const total = quantity * unitPrice;
    
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      productId,
      quantity,
      unitPrice,
      vatRate,
      total
    };
    
    form.setValue("items", updatedItems);
  };
  
  // Gérer le changement de quantité
  const handleQuantityChange = (value: number, index: number) => {
    const currentItems = form.getValues("items");
    const productId = currentItems[index].productId;
    const product = products.find(p => p.id === productId);
    
    if (product) {
      const unitPrice = product.sellingPrice;
      const total = value * unitPrice;
      
      const updatedItems = [...currentItems];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: value,
        total
      };
      
      form.setValue("items", updatedItems);
    }
  };
  
  // Ajouter un élément
  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      { productId: "", quantity: 1, unitPrice: 0, vatRate: 0, total: 0 }
    ]);
  };
  
  // Supprimer un élément
  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };
  
  // Calculer les totaux avec FODEC et timbre fiscal
  const calculateTotals = () => {
    const totalHT = watchedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalTVA = watchedItems.reduce((sum, item) => {
      const tva = ((item.total || 0) * (item.vatRate || 0)) / 100;
      return sum + tva;
    }, 0);
    
    const fodecAmount = includeFodec ? totalHT * 0.01 : 0;
    const timbreFiscalAmount = includeTimbreFiscal ? 1 : 0;
    const totalTTC = totalHT + totalTVA + fodecAmount + timbreFiscalAmount;
    
    return { totalHT, totalTVA, totalTTC, fodecAmount, timbreFiscalAmount };
  };

  // Handle print quote
  const handlePrint = (quote: any) => {
    const { totalHT, totalTVA, totalTTC, fodecAmount, timbreFiscalAmount } = calculateTotals();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Devis - ${quote.reference}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 30px; 
                color: #333;
                line-height: 1.4;
              }
              .document-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 3px solid #2563eb;
              }
              .company-info {
                flex: 1;
              }
              .company-name {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
              }
              .company-details {
                font-size: 14px;
                color: #666;
                line-height: 1.6;
              }
              .logo {
                max-width: 120px;
                max-height: 80px;
                margin-left: 20px;
              }
              .document-title {
                text-align: center;
                margin: 30px 0;
              }
              .document-title h1 {
                font-size: 32px;
                color: #2563eb;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
              }
              .document-info {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
              }
              .info-group h4 {
                color: #2563eb;
                margin-bottom: 8px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .client-info {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .client-info h3 {
                color: #2563eb;
                margin-bottom: 15px;
                font-size: 18px;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
                background: #fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              .items-table th {
                background: #2563eb;
                color: white;
                padding: 15px 12px;
                text-align: left;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .items-table td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 14px;
              }
              .items-table tr:last-child td {
                border-bottom: none;
              }
              .items-table tr:nth-child(even) {
                background: #f8fafc;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .totals-section {
                margin-top: 40px;
                display: flex;
                justify-content: flex-end;
              }
              .totals-table {
                width: 400px;
                border-collapse: collapse;
                background: #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              .totals-table td {
                padding: 12px 20px;
                border-bottom: 1px solid #e2e8f0;
              }
              .totals-table .label {
                font-weight: 600;
                color: #374151;
                background: #f8fafc;
              }
              .totals-table .amount {
                text-align: right;
                font-weight: 500;
              }
              .totals-table .total-final {
                background: #2563eb;
                color: white;
                font-weight: bold;
                font-size: 16px;
              }
              .footer {
                margin-top: 60px;
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #666;
                font-size: 12px;
              }
              .validity {
                margin: 30px 0;
                padding: 20px;
                background: #fef7ed;
                border-left: 4px solid #f59e0b;
                border-radius: 0 8px 8px 0;
              }
              .validity h4 {
                color: #f59e0b;
                margin-bottom: 10px;
              }
              @media print {
                body { padding: 20px; }
                .document-header { margin-bottom: 30px; }
                .totals-section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="document-header">
              <div class="company-info">
                <div class="company-name">${settings.name || 'Stock Pro'}</div>
                <div class="company-details">
                  ${settings.address ? `${settings.address}<br>` : ''}
                  ${settings.phone ? `Tél: ${settings.phone}<br>` : ''}
                  ${settings.email ? `Email: ${settings.email}<br>` : ''}
                  ${settings.website ? `Web: ${settings.website}` : ''}
                </div>
              </div>
              ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="logo" />` : ''}
            </div>

            <div class="document-title">
              <h1>Devis</h1>
            </div>

            <div class="document-info">
              <div class="info-group">
                <h4>Référence</h4>
                <div>${quote.reference}</div>
              </div>
              <div class="info-group">
                <h4>Date</h4>
                <div>${new Date().toLocaleDateString('fr-FR')}</div>
              </div>
              <div class="info-group">
                <h4>Valable jusqu'au</h4>
                <div>${form.watch("validUntil") ? new Date(form.watch("validUntil")).toLocaleDateString('fr-FR') : ''}</div>
              </div>
            </div>

            <div class="client-info">
              <h3>Client</h3>
              <div>
                <strong>${selectedClient?.name || 'Client'}</strong><br>
                ${selectedClient?.address || ''}<br>
                ${selectedClient?.phone ? `Tél: ${selectedClient.phone}<br>` : ''}
                ${selectedClient?.email ? `Email: ${selectedClient.email}<br>` : ''}
                ${selectedClient?.fiscalId ? `Matricule fiscale: ${selectedClient.fiscalId}` : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th class="text-center">Quantité</th>
                  <th class="text-right">Prix Unitaire HT</th>
                  <th class="text-center">TVA</th>
                  <th class="text-right">Total HT</th>
                </tr>
              </thead>
              <tbody>
                ${watchedItems.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return `
                    <tr>
                      <td>${product?.name || 'Produit inconnu'}</td>
                      <td class="text-center">${item.quantity || 0}</td>
                      <td class="text-right">${(item.unitPrice || 0).toFixed(3)} TND</td>
                      <td class="text-center">${item.vatRate || 0}%</td>
                      <td class="text-right">${(item.total || 0).toFixed(3)} TND</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td class="label">Total HT</td>
                  <td class="amount">${totalHT.toFixed(3)} TND</td>
                </tr>
                <tr>
                  <td class="label">Total TVA</td>
                  <td class="amount">${totalTVA.toFixed(3)} TND</td>
                </tr>
                ${includeFodec ? `
                  <tr>
                    <td class="label">FODEC (1%)</td>
                    <td class="amount">${fodecAmount.toFixed(3)} TND</td>
                  </tr>
                ` : ''}
                ${includeTimbreFiscal ? `
                  <tr>
                    <td class="label">Timbre Fiscal</td>
                    <td class="amount">${timbreFiscalAmount.toFixed(3)} TND</td>
                  </tr>
                ` : ''}
                <tr class="total-final">
                  <td>Total TTC</td>
                  <td class="text-right">${totalTTC.toFixed(3)} TND</td>
                </tr>
              </table>
            </div>

            <div class="validity">
              <h4>Validité du devis</h4>
              <p>Ce devis est valable jusqu'au ${form.watch("validUntil") ? new Date(form.watch("validUntil")).toLocaleDateString('fr-FR') : ''}.</p>
            </div>

            <div class="footer">
              <p>Merci de votre confiance!</p>
              ${settings.taxId ? `<p>Matricule fiscale: ${settings.taxId}</p>` : ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };
  
  // Gérer la soumission du formulaire
  const onSubmit = (data: FormValues) => {
    const { totalHT, totalTVA, totalTTC, fodecAmount, timbreFiscalAmount } = calculateTotals();
    
    // Create items with proper QuoteItem structure
    const items = data.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || "Produit inconnu",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        total: item.total
      };
    });
    
    // Add to context with FODEC and timbre fiscal
    addQuote({
      reference: data.reference,
      clientId: data.clientId,
      clientName: selectedClient?.name || "Client inconnu",
      items,
      totalHT,
      totalTVA,
      totalTTC,
      status: "pending",
      date: new Date(),
      validUntil: data.validUntil,
      fodec: includeFodec ? fodecAmount : undefined,
      timbreFiscal: includeTimbreFiscal ? timbreFiscalAmount : undefined,
    });
    
    toast({
      title: "Devis créé",
      description: `Le devis ${data.reference} a été créé avec succès.`,
    });
    
    navigate("/quotes");
  };

  const { totalHT, totalTVA, totalTTC } = calculateTotals();

  return (
    <div className="content-container">
      <PageHeader 
        title="Nouveau devis" 
        addButtonLink="/quotes"
      />
      
      <Button 
        variant="ghost" 
        onClick={() => navigate("/quotes")} 
        className="mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence</FormLabel>
                      <FormControl>
                        <Input placeholder="Référence du devis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleClientChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valable jusqu'au</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Produits</h3>
                
                {form.watch("items").map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="col-span-5">
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Produit
                          </FormLabel>
                          <FormControl>
                            <ProductSelector
                              value={field.value}
                              onValueChange={(productId, product) => {
                                field.onChange(productId);
                                handleProductChange(productId, product, index);
                              }}
                              placeholder="Sélectionner un produit"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Quantité
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Quantité"
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                field.onChange(value);
                                handleQuantityChange(value, index);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Prix unitaire HT
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Prix unitaire"
                              {...field}
                              readOnly
                              className="bg-muted/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.total`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Total HT
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Total"
                              {...field}
                              readOnly
                              className="bg-muted/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={form.watch("items").length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Button>
                
                {/* Section de calcul des totaux et checkboxes */}
                <div className="mt-8 space-y-6">
                  {/* Checkboxes pour FODEC et timbre fiscal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted/20 rounded-lg border">
                    <FormField
                      control={form.control}
                      name="includeFodec"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              FODEC (1%)
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Fonds de développement de la compétitivité
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeTimbreFiscal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Timbre fiscal (1.000 DT)
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Timbre fiscal obligatoire
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Affichage des totaux */}
                  <div className="flex justify-end">
                    <div className="bg-white border rounded-lg p-6 w-80 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total HT:</span>
                          <span className="font-medium">{totalHT.toFixed(3)} TND</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total TVA:</span>
                          <span className="font-medium">{totalTVA.toFixed(3)} TND</span>
                        </div>
                        {includeFodec && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">FODEC (1%):</span>
                            <span className="font-medium">{(totalHT * 0.01).toFixed(3)} TND</span>
                          </div>
                        )}
                        {includeTimbreFiscal && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Timbre fiscal:</span>
                            <span className="font-medium">1.000 TND</span>
                          </div>
                        )}
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="text-lg font-bold">Total TTC:</span>
                            <span className="text-lg font-bold text-primary">
                              {totalTTC.toFixed(3)} TND
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/quotes")}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePrint({ reference: form.watch("reference") })}
                  disabled={!form.watch("clientId") || form.watch("items").length === 0}
                >
                  Aperçu d'impression
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddQuote;
