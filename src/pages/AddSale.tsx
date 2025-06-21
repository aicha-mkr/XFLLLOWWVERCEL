import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";
import ProductSelector from "@/components/ProductSelector";
import ClientSelector from "@/components/ClientSelector";
import { Client, Product } from "@/types";
import { Plus, Trash, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useProducts } from "@/hooks/use-products";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { dbService } from "@/data/dbService";
import { useSales } from "@/contexts/SalesContext";

// Génération du numéro de facture auto-incrémenté
const generateInvoiceNumber = async (settings: any) => {
  try {
    const currentCounter = settings.invoiceCounter || 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `FACT-${year.toString().slice(2)}-${currentCounter.toString().padStart(6, '0')}`;
    return invoiceNumber;
  } catch (error) {
    console.error('Erreur génération numéro facture:', error);
    const fallback = `FACT-${Date.now()}`;
    return fallback;
  }
};

// Schema de validation
const formSchema = z.object({
  invoiceNumber: z.string().min(1, "Le numéro de facture est requis"),
  clientId: z.string().min(1, "Le client est requis"),
  paymentMethod: z.string().min(1, "Le mode de paiement est requis"),
  paymentStatus: z.string().min(1, "Le statut de paiement est requis"),
  checkNumber: z.string().optional(),
  transferNumber: z.string().optional(),
  notes: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  includeFodec: z.boolean().optional(),
  includeTimbreFiscal: z.boolean().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Le produit est requis"),
      quantity: z.number().positive("La quantité doit être positive"),
      unitPrice: z.number().positive("Le prix doit être positif"),
      vatRate: z.number(),
      discount: z.number().min(0).max(100).optional(),
      total: z.number(),
    })
  ).min(1, "Au moins un produit est requis"),
});

type FormValues = z.infer<typeof formSchema>;

const AddSale = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { products, refreshProducts } = useProducts();
  const { settings, updateSettings } = useCompanySettings();
  const { refreshSales } = useSales();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>("");

  // Charger les clients et générer le prochain numéro de facture
  useEffect(() => {
    try {
      const savedClients = localStorage.getItem('clients');
      if (savedClients) {
        setClients(JSON.parse(savedClients));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }

    // Générer le prochain numéro de facture
    const generateNext = async () => {
      const number = await generateInvoiceNumber(settings);
      setNextInvoiceNumber(number);
    };
    generateNext();
  }, [settings]);

  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: "",
      clientId: "",
      paymentMethod: "",
      paymentStatus: "paid",
      checkNumber: "",
      transferNumber: "",
      notes: "",
      discount: 0,
      includeFodec: false,
      includeTimbreFiscal: false,
      items: [{ productId: "", quantity: 1, unitPrice: 0, vatRate: 19, discount: 0, total: 0 }],
    },
  });

  // Pre-fill form if quote data is present
  useEffect(() => {
    const { quoteData } = location.state || {};
    if (quoteData) {
      form.setValue("clientId", quoteData.clientId);

      const quoteItems = quoteData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discount: 0, // Default discount, can be adjusted
        total: item.quantity * item.unitPrice,
      }));
      form.setValue("items", quoteItems);

      // Find and set the selected client
      const savedClients = localStorage.getItem('clients');
      if (savedClients) {
        const allClients: Client[] = JSON.parse(savedClients);
        const client = allClients.find(c => c.id === quoteData.clientId);
        if (client) {
          setSelectedClient(client);
        }
      }

      toast({
        title: "Détails du devis chargés",
        description: "Les informations du devis ont été pré-remplies.",
      });
    }
  }, [location.state, form, toast]);

  // Mettre à jour le numéro de facture quand nextInvoiceNumber change
  useEffect(() => {
    if (nextInvoiceNumber) {
      form.setValue("invoiceNumber", nextInvoiceNumber);
    }
  }, [nextInvoiceNumber, form]);
  
  // Gérer la sélection du client
  const handleClientChange = (clientId: string, client: Client) => {
    setSelectedClient(client);
  };
  
  // Gérer la sélection d'un produit - AUTO-REMPLIR PRIX ET TVA
  const handleProductChange = (productId: string, product: Product, index: number) => {
    const currentItems = form.getValues("items");
    const quantity = currentItems[index]?.quantity || 1;
    
    // Auto-remplir avec le prix de vente et le taux de TVA du produit
    const unitPrice = product.sellingPrice;
    const vatRate = product.vatRate;
    const discount = currentItems[index]?.discount || 0;
    const total = quantity * unitPrice * (1 - discount / 100);
    
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      productId,
      quantity,
      unitPrice,
      vatRate,
      discount,
      total
    };
    
    form.setValue("items", updatedItems);
    form.trigger();
  };
  
  // Gérer la quantité
  const handleQuantityChange = (value: number, index: number) => {
    const currentItems = form.getValues("items");
    const unitPrice = currentItems[index].unitPrice;
    const discount = currentItems[index].discount || 0;
    const total = value * unitPrice * (1 - discount / 100);
    
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: value,
      total
    };
    
    form.setValue("items", updatedItems);
    form.trigger();
  };

  const handleDiscountChange = (value: number, index: number) => {
    const currentItems = form.getValues("items");
    const quantity = currentItems[index].quantity;
    const unitPrice = currentItems[index].unitPrice;
    const total = quantity * unitPrice * (1 - value / 100);
    
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      discount: value,
      total
    };
    
    form.setValue("items", updatedItems);
    form.trigger();
  };

  const handleVatRateChange = (value: number, index: number) => {
    const currentItems = form.getValues("items");
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      vatRate: value
    };
    
    form.setValue("items", updatedItems);
    form.trigger();
  };

  const handleUnitPriceChange = (value: number, index: number) => {
    const currentItems = form.getValues("items");
    const quantity = currentItems[index].quantity;
    const discount = currentItems[index].discount || 0;
    const total = quantity * value * (1 - discount / 100);
    
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      unitPrice: value,
      total
    };
    
    form.setValue("items", updatedItems);
    form.trigger();
  };
  
  // Ajouter un élément
  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      { productId: "", quantity: 1, unitPrice: 0, vatRate: 19, discount: 0, total: 0 }
    ]);
  };
  
  // Supprimer un élément
  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };
  
  // Calculer les totaux avec FODEC dynamique
  const calculateTotals = () => {
    const items = form.getValues("items");
    const globalDiscount = form.getValues("discount") || 0;
    const includeFodec = form.getValues("includeFodec");
    const includeTimbreFiscal = form.getValues("includeTimbreFiscal");
    let totalHT = 0;
    let totalTVA = 0;
    
    items.forEach(item => {
      totalHT += item.total;
      totalTVA += (item.total * item.vatRate) / 100;
    });
    
    // Appliquer la remise globale
    totalHT = totalHT * (1 - globalDiscount / 100);
    totalTVA = totalTVA * (1 - globalDiscount / 100);
    
    // FODEC (1% sur total HT) - seulement si coché
    const fodec = includeFodec ? totalHT * 0.01 : 0;
    
    // Timbre fiscal - seulement si coché
    const timbreFiscal = includeTimbreFiscal ? 1.000 : 0;
    
    const totalTTC = totalHT + totalTVA + fodec + timbreFiscal;
    
    return {
      totalHT,
      totalTVA,
      fodec,
      timbreFiscal,
      totalTTC
    };
  };
  
  // Gérer la soumission du formulaire
  const onSubmit = async (data: FormValues) => {
    const { totalHT, totalTVA, totalTTC, fodec, timbreFiscal } = calculateTotals();

    const itemsWithProductNames = data.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...item, productName: product?.name || 'Inconnu' };
    });

    const newSale = {
      id: `sale-${Date.now()}`,
      invoiceNumber: data.invoiceNumber,
      clientId: data.clientId,
      clientName: selectedClient?.name || "Client inconnu",
      items: itemsWithProductNames,
      totalHT,
      totalTVA,
      totalTTC,
      fodec: data.includeFodec ? fodec : undefined,
      timbreFiscal: data.includeTimbreFiscal ? timbreFiscal : undefined,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      date: new Date(),
      notes: data.notes || "",
      checkNumber: data.checkNumber || "",
      transferNumber: data.transferNumber || "",
    };

    try {
      const createdSale = await dbService.createSale(newSale);

      const currentCounter = settings.invoiceCounter || 1;
      const updatedSettings = { ...settings, invoiceCounter: currentCounter + 1 };
      updateSettings(updatedSettings);

      await refreshSales();
      await refreshProducts();

      toast({
        title: "Vente créée",
        description: `La vente ${createdSale.invoiceNumber} a été créée et le stock mis à jour.`,
      });
      
      navigate("/sales");

    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      toast({
        title: "Erreur",
        description: (error as Error).message || "Une erreur est survenue.",
        variant: "destructive"
      });
    }
  };

  const watchedPaymentMethod = form.watch("paymentMethod");
  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount");
  const watchedIncludeFodec = form.watch("includeFodec");
  const watchedIncludeTimbreFiscal = form.watch("includeTimbreFiscal");

  return (
    <div className="content-container">
      <PageHeader 
        title="Nouvelle vente" 
        addButtonLink="/sales"
      />
      
      <Button 
        variant="ghost" 
        onClick={() => navigate("/sales")} 
        className="mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations de la vente</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de facture</FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro de facture" {...field} />
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
                      <FormControl>
                        <ClientSelector
                          value={field.value}
                          onValueChange={(clientId, client) => {
                            field.onChange(clientId);
                            handleClientChange(clientId, client);
                          }}
                          placeholder="Sélectionner un client"
                          clients={clients}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode de paiement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Espèces</SelectItem>
                          <SelectItem value="check">Chèque</SelectItem>
                          <SelectItem value="transfer">Virement</SelectItem>
                          <SelectItem value="bill">Traite</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut de paiement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">Payé</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="partial">Partiel</SelectItem>
                          <SelectItem value="canceled">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Champs supplémentaires pour les modes de paiement */}
              {watchedPaymentMethod === "check" && (
                <FormField
                  control={form.control}
                  name="checkNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de chèque</FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro du chèque" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedPaymentMethod === "transfer" && (
                <FormField
                  control={form.control}
                  name="transferNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de virement</FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro de virement" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Produits</h3>
                
                {watchedItems.map((item, index) => {
                  const selectedProduct = products.find(p => p.id === item.productId);
                  
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-4 items-end">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="col-span-3">
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
                          <FormItem className="col-span-1">
                            <FormLabel className={index > 0 ? "sr-only" : ""}>
                              Qté
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Qté"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 1;
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
                              Prix unitaire
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Prix"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  field.onChange(value);
                                  handleUnitPriceChange(value, index);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.vatRate`}
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel className={index > 0 ? "sr-only" : ""}>
                              TVA
                            </FormLabel>
                            <Select onValueChange={(value) => {
                              const rate = parseFloat(value);
                              field.onChange(rate);
                              handleVatRateChange(rate, index);
                            }} value={field.value?.toString() || "19"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="7">7%</SelectItem>
                                <SelectItem value="13">13%</SelectItem>
                                <SelectItem value="19">19%</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.discount`}
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel className={index > 0 ? "sr-only" : ""}>
                              Remise %
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  field.onChange(value);
                                  handleDiscountChange(value, index);
                                }}
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
                              Total
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Total"
                                value={field.value || 0}
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
                          disabled={watchedItems.length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
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
                
                <div className="mt-4 space-y-4">
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem className="w-48">
                          <FormLabel>Remise globale (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="0"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                form.trigger();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeFodec"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                form.trigger();
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Inclure FODEC (1%)
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeTimbreFiscal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                form.trigger();
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Inclure Timbre fiscal (1.000 DT)
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-sm text-muted-foreground">Total HT:</p>
                      <p className="text-sm font-medium text-right">
                        {formatCurrency(calculateTotals().totalHT)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total TVA:</p>
                      <p className="text-sm font-medium text-right">
                        {formatCurrency(calculateTotals().totalTVA)}
                      </p>
                      {watchedIncludeFodec && (
                        <>
                          <p className="text-sm text-muted-foreground">FODEC (1%):</p>
                          <p className="text-sm font-medium text-right">
                            {formatCurrency(calculateTotals().fodec)}
                          </p>
                        </>
                      )}
                      {watchedIncludeTimbreFiscal && (
                        <>
                          <p className="text-sm text-muted-foreground">Timbre fiscal:</p>
                          <p className="text-sm font-medium text-right">
                            {formatCurrency(calculateTotals().timbreFiscal)}
                          </p>
                        </>
                      )}
                      <p className="text-base font-bold">Total TTC:</p>
                      <p className="text-base font-bold text-right">
                        {formatCurrency(calculateTotals().totalTTC)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notes ou informations supplémentaires" 
                        className="resize-none h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/sales")}
                >
                  Annuler
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

export default AddSale;
