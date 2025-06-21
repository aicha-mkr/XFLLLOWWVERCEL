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
import PageHeader from "@/components/ui/PageHeader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import ProductSelector from "@/components/ProductSelector";
import SupplierSelector from "@/components/SupplierSelector";
import { Product, PurchaseItem } from "@/types";
import { Plus, Trash, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useProducts } from "@/hooks/use-products";
import { usePurchaseOrders } from "@/contexts/PurchaseOrdersContext";

const formSchema = z.object({
  reference: z.string().min(1, "La référence est requise"),
  supplierId: z.string().min(1, "Le fournisseur est requis"),
  supplierName: z.string().min(1, "Le nom du fournisseur est requis"),
  deliveryAddress: z.string().optional(),
  deliveryDelay: z.string().optional(),
  notes: z.string().optional(),
  includeFodec: z.boolean().optional(),
  includeTimbreFiscal: z.boolean().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Le produit est requis"),
      productName: z.string().min(1, "Le nom du produit est requis"),
      quantity: z.number().positive("La quantité doit être positive"),
      unitPrice: z.number().positive("Le prix doit être positif"),
      total: z.number(),
    })
  ).min(1, "Au moins un produit est requis"),
});

type FormValues = z.infer<typeof formSchema>;

const AddPurchaseOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { products } = useProducts();
  const { addPurchaseOrder } = usePurchaseOrders();
  const [nextReference, setNextReference] = useState<string>("");

  useEffect(() => {
    const generateReference = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const time = Date.now().toString().slice(-4);
      setNextReference(`BC-${year}${month}${day}-${time}`);
    };
    generateReference();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference: "",
      supplierId: "",
      supplierName: "",
      deliveryAddress: "",
      deliveryDelay: "",
      notes: "",
      includeFodec: false,
      includeTimbreFiscal: false,
      items: [{ productId: "", productName: "", quantity: 1, unitPrice: 0, total: 0 }],
    },
  });

  useEffect(() => {
    if (nextReference) {
      form.setValue("reference", nextReference);
    }
  }, [nextReference, form]);

  const handleSupplierChange = (supplierId: string, supplier: any) => {
    form.setValue("supplierId", supplierId);
    form.setValue("supplierName", supplier.name);
    form.trigger(["supplierId", "supplierName"]);
  };

  const handleProductChange = (productId: string, product: Product, index: number) => {
    const currentItems = form.getValues("items");
    const quantity = currentItems[index]?.quantity || 1;
    const unitPrice = product.sellingPrice;
    const total = quantity * unitPrice;

    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      productId,
      productName: product.name,
      quantity,
      unitPrice,
      total
    };

    form.setValue("items", updatedItems);
    form.trigger();
  };

  const handleQuantityChange = (value: number, index: number) => {
    const currentItems = form.getValues("items");
    const unitPrice = currentItems[index].unitPrice;
    const total = value * unitPrice;

    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: value,
      total
    };

    form.setValue("items", updatedItems);
    form.trigger();
  };

  const handleUnitPriceChange = (value: number, index: number) => {
    const currentItems = form.getValues("items");
    const quantity = currentItems[index].quantity;
    const total = quantity * value;

    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      unitPrice: value,
      total
    };

    form.setValue("items", updatedItems);
    form.trigger();
  };

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      { productId: "", productName: "", quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const items = form.getValues("items");
    const includeFodec = form.getValues("includeFodec");
    const includeTimbreFiscal = form.getValues("includeTimbreFiscal");
    
    let total = 0;
    items.forEach(item => {
      total += item.total;
    });
    
    const fodec = includeFodec ? total * 0.01 : 0;
    const timbreFiscal = includeTimbreFiscal ? 1.000 : 0;
    const totalWithExtras = total + fodec + timbreFiscal;
    
    return {
      subtotal: total,
      fodec,
      timbreFiscal,
      total: totalWithExtras
    };
  };

  const onSubmit = async (data: FormValues) => {
    const { total, fodec, timbreFiscal } = calculateTotals();
    
    // Convert form items to PurchaseItem format
    const purchaseItems: PurchaseItem[] = data.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    }));
    
    const newPurchaseOrder = {
      reference: data.reference,
      supplier: data.supplierName,
      deliveryAddress: data.deliveryAddress,
      deliveryDelay: data.deliveryDelay,
      items: purchaseItems,
      total,
      fodec: data.includeFodec ? fodec : undefined,
      timbreFiscal: data.includeTimbreFiscal ? timbreFiscal : undefined,
      status: "pending" as const,
      date: new Date(),
      notes: data.notes,
    };

    try {
      await addPurchaseOrder(newPurchaseOrder);
      
      toast({
        title: "Bon de commande créé",
        description: `Le bon de commande ${data.reference} a été créé avec succès.`,
      });
      
      navigate("/purchase-orders");
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le bon de commande",
        variant: "destructive",
      });
    }
  };

  const watchedItems = form.watch("items");
  const watchedIncludeFodec = form.watch("includeFodec");
  const watchedIncludeTimbreFiscal = form.watch("includeTimbreFiscal");

  return (
    <div className="content-container">
      <PageHeader 
        title="Nouveau bon de commande" 
        addButtonLink="/purchase-orders"
      />
      
      <Button 
        variant="ghost" 
        onClick={() => navigate("/purchase-orders")} 
        className="mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations du bon de commande</CardTitle>
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
                        <Input placeholder="Référence" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fournisseur</FormLabel>
                      <FormControl>
                        <SupplierSelector
                          value={field.value}
                          onValueChange={handleSupplierChange}
                          placeholder="Sélectionner un fournisseur"
                        />
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
                      <FormLabel>Adresse de livraison (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Adresse de livraison" {...field} />
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
                      <FormLabel>Délai de livraison (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Délai de livraison" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Produits</h3>
                
                {watchedItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-4 mb-4 items-end">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
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
                              min="1"
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
                        <FormItem className="col-span-1">
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
                      name={`items.${index}.total`}
                      render={({ field }) => (
                        <FormItem className="col-span-1">
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
                
                <div className="mt-4 space-y-4">
                  <div className="flex gap-4">
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
                      <p className="text-sm text-muted-foreground">Sous-total:</p>
                      <p className="text-sm font-medium text-right">
                        {formatCurrency(calculateTotals().subtotal)}
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
                      <p className="text-base font-bold">Total:</p>
                      <p className="text-base font-bold text-right">
                        {formatCurrency(calculateTotals().total)}
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
                  onClick={() => navigate("/purchase-orders")}
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

export default AddPurchaseOrder;
