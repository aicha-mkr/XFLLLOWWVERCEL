import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Client, Product, SaleItem } from "@/types";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/use-products";
import { useDeliveryNotes } from "@/contexts/DeliveryNotesContext";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";

// Génération de référence
const generateReference = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BL-${randomNum}`;
};

// Mock clients
const mockClients: Client[] = [
  {
    id: "1",
    name: "Client A",
    address: "123 Rue Principale, Tunis",
    fiscalId: "TN123456789",
    phone: "71 123 456",
    email: "clienta@example.com",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Client B",
    address: "45 Avenue de la Liberté, Sfax",
    fiscalId: "TN987654321",
    phone: "74 789 123",
    email: "clientb@example.com",
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Client C",
    address: "12 Rue de la Médina, Sousse",
    fiscalId: "TN456123789",
    phone: "73 456 789",
    email: "clientc@example.com",
    createdAt: new Date(),
  },
];

// Schema de validation amélioré
const formSchema = z.object({
  reference: z.string().min(1, "La référence est requise"),
  clientId: z.string().min(1, "Le client est requis"),
  deliveryAddress: z.string().optional(),
  deliveryDelay: z.string().optional(),
  saleReference: z.string().optional(),
  notes: z.string().optional(),
  includeFodec: z.boolean().default(false),
  includeTimbreFiscal: z.boolean().default(true),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Le produit est requis"),
      quantity: z.number().positive("La quantité doit être positive"),
      unitPrice: z.number().nonnegative("Le prix doit être positif ou nul"),
      vatRate: z.number().nonnegative("Le taux de TVA doit être positif ou nul"),
      total: z.number().nonnegative("Le total doit être positif ou nul"),
    })
  ).min(1, "Au moins un produit est requis"),
});

type FormValues = z.infer<typeof formSchema>;

const AddDeliveryNote = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products } = useProducts();
  const { addDeliveryNote } = useDeliveryNotes();
  const { settings } = useCompanySettings();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference: generateReference(),
      clientId: "",
      deliveryAddress: "",
      deliveryDelay: "",
      saleReference: "",
      notes: "",
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
  
  // Calculer les totaux dynamiquement
  const calculateTotals = () => {
    const totalHT = watchedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalTVA = watchedItems.reduce((sum, item) => {
      const tvaAmount = (item.total || 0) * (item.vatRate || 0) / 100;
      return sum + tvaAmount;
    }, 0);
    
    const fodecAmount = includeFodec ? totalHT * 0.01 : 0;
    const timbreFiscalAmount = includeTimbreFiscal ? 1 : 0;
    
    const totalTTC = totalHT + totalTVA + fodecAmount + timbreFiscalAmount;
    
    return { 
      totalHT, 
      totalTVA, 
      totalTTC, 
      fodecAmount, 
      timbreFiscalAmount 
    };
  };

  const onSubmit = async (data: FormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!selectedClient) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un client.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const { totalHT, totalTVA, totalTTC, fodecAmount, timbreFiscalAmount } = calculateTotals();
      
      const items = data.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...item,
          productName: product?.name || 'Produit inconnu',
        };
      });

      const deliveryNoteData = {
        id: `bl_${Date.now()}`,
        reference: data.reference,
        clientId: data.clientId,
        clientName: selectedClient.name,
        clientAddress: selectedClient.address,
        clientPhone: selectedClient.phone,
        clientEmail: selectedClient.email,
        saleReference: data.saleReference,
        deliveryAddress: data.deliveryAddress,
        deliveryDelay: data.deliveryDelay,
        items,
        total: totalTTC,
        totalHT,
        totalTVA,
        totalTTC,
        fodec: fodecAmount,
        timbreFiscal: timbreFiscalAmount,
        status: 'pending',
        date: new Date(),
        notes: data.notes,
      };

      await addDeliveryNote(deliveryNoteData as any); 

      toast({
        title: "Bon de livraison créé",
        description: `Le bon de livraison ${data.reference} a été créé avec succès.`,
        variant: "default",
      });

      navigate("/delivery-notes");
    } catch (error) {
      console.error("Error creating delivery note:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création du bon de livraison.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { totalHT, totalTVA, totalTTC } = calculateTotals();

  return (
    <div className="content-container">
      <PageHeader 
        title="Nouveau bon de livraison" 
        addButtonLink="/delivery-notes"
      />
      
      <Button 
        variant="ghost" 
        onClick={() => navigate("/delivery-notes")} 
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence</FormLabel>
                      <FormControl>
                        <Input placeholder="Référence du bon de livraison" {...field} />
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
                  name="saleReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence vente (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Référence de la vente associée" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse de livraison</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Adresse de livraison (si différente de l'adresse du client)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDelay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date / Délai de livraison</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 24/12/2024 ou 'Sous 48h'" {...field} />
                      </FormControl>
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
                                const value = parseFloat(e.target.value) || 0;
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
                              min="0"
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
                            Total
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
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notes ou instructions spéciales pour cette livraison" 
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
                  onClick={() => navigate("/delivery-notes")}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddDeliveryNote;
