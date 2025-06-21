import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/ui/PageHeader";
import ProductSelector from "@/components/ProductSelector";
import SupplierSelector from "@/components/SupplierSelector";
import { ArrowLeft, X, Plus } from "lucide-react";
import { Product, Purchase, PurchaseItem, Supplier } from "@/types";
import { usePurchases } from "@/contexts/PurchasesContext";
import { v4 as uuidv4 } from "uuid";
import { useProducts } from "@/hooks/use-products";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { updateProductStock } from "@/utils/stockTracker";

// Form data type
type FormData = {
  supplierId: string;
  date: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes: string;
};

const AddPurchase = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addPurchase } = usePurchases();
  const { products, getProductById } = useProducts();
  const { settings } = useCompanySettings();
  
  const [selectedProductDetails, setSelectedProductDetails] = useState<{
    [key: string]: { name: string; price: number }
  }>({});
  
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Initialize form with one empty item
  const form = useForm<FormData>({
    defaultValues: {
      supplierId: "",
      date: new Date().toISOString().split('T')[0],
      items: [{ productId: "", quantity: 1, unitPrice: 0 }],
      notes: "",
    },
  });

  // Use fieldArray to manage dynamic items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate totals
  const calculateTotal = () => {
    const items = form.getValues().items;
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleProductSelect = (productId: string, product: Product, index: number) => {
    // Store product details
    setSelectedProductDetails(prev => ({
      ...prev,
      [index]: { name: product.name, price: product.purchasePrice }
    }));
    
    // Update the unit price in the form with the purchase price automatically
    form.setValue(`items.${index}.unitPrice`, product.purchasePrice);
  };

  const handleSupplierSelect = (supplierId: string, supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedSupplier) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fournisseur",
        variant: "destructive",
      });
      return;
    }

    // Create purchase items array
    const purchaseItems: PurchaseItem[] = data.items.map(item => {
      const productDetails = selectedProductDetails[data.items.indexOf(item)];
      return {
        productId: item.productId,
        productName: productDetails?.name || "Produit inconnu",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      };
    });
    
    // Generate a unique reference number
    const reference = `ACHAT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Create the purchase object
    const newPurchase: Purchase = {
      id: uuidv4(),
      reference,
      supplier: selectedSupplier.name,
      status: "completed",
      items: purchaseItems,
      total: calculateTotal(),
      notes: data.notes,
      date: new Date(data.date),
    };
    
    // Save the purchase
    addPurchase(newPurchase);
    
    // Update stock levels for each product
    for (const item of purchaseItems) {
      const product = getProductById(item.productId);
      if (product) {
        const newStock = (product.stock || 0) + item.quantity;
        await updateProductStock(product.id, newStock, 'purchase');
      }
    }
    
    // Show success message
    toast({
      title: "Achat créé",
      description: "L'achat a été créé avec succès et les stocks ont été mis à jour.",
    });
    
    // Redirect
    navigate("/purchases");
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-TN', { 
      style: 'currency', 
      currency: settings.currency || 'TND',
      minimumFractionDigits: 3 
    }).format(value);
  };
  
  return (
    <div className="content-container animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/purchases")} 
        className="mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </Button>
      
      <PageHeader title="Créer un achat" />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FormField
                  control={form.control}
                  name="supplierId"
                  rules={{ required: "Le fournisseur est obligatoire" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fournisseur *</FormLabel>
                      <FormControl>
                        <SupplierSelector
                          value={field.value}
                          onValueChange={(supplierId, supplier) => {
                            field.onChange(supplierId);
                            handleSupplierSelect(supplierId, supplier);
                          }}
                          placeholder="Sélectionner un fournisseur"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  rules={{ required: "La date est obligatoire" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Produits</h3>
                
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="py-3 px-4 text-left">Produit</th>
                        <th className="py-3 px-4 text-right w-28">Quantité</th>
                        <th className="py-3 px-4 text-right w-36">Prix unitaire</th>
                        <th className="py-3 px-4 text-right w-36">Total</th>
                        <th className="py-3 px-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => {
                        const itemTotal = form.watch(`items.${index}.quantity`, 1) * 
                                         form.watch(`items.${index}.unitPrice`, 0);
                                         
                        return (
                          <tr key={field.id} className="border-t first:border-t-0">
                            <td className="py-3 px-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.productId`}
                                rules={{ required: "Le produit est obligatoire" }}
                                render={({ field }) => (
                                  <FormItem>
                                    <ProductSelector
                                      value={field.value}
                                      onValueChange={(productId, product) => {
                                        field.onChange(productId);
                                        handleProductSelect(productId, product, index);
                                      }}
                                      placeholder="Sélectionnez un produit"
                                    />
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                rules={{ required: "Quantité obligatoire", min: { value: 1, message: "Min 1" } }}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={1}
                                        step={1}
                                        className="text-right"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                rules={{ required: "Prix obligatoire" }}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={0}
                                        step={0.001}
                                        className="text-right"
                                        placeholder="Prix d'achat"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              {formatCurrency(itemTotal)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                >
                                  <X size={16} />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={5} className="py-2 px-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
                          >
                            <Plus size={16} />
                            <span>Ajouter un produit</span>
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-t bg-muted/50">
                        <td colSpan={3} className="py-3 px-4 text-right font-medium">Total</td>
                        <td colSpan={2} className="py-3 px-4 text-right font-bold">
                          {formatCurrency(calculateTotal())}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes ou instructions spéciales"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/purchases")}
            >
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddPurchase;
