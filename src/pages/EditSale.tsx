import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Client, Product, Sale, SaleItem } from "@/types";
import { Plus, Trash, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useProducts } from "@/hooks/use-products";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useSales } from "@/contexts/SalesContext";

const formSchema = z.object({
  invoiceNumber: z.string().min(1, "Le numéro de facture est requis"),
  clientId: z.string().min(1, "Le client est requis"),
  paymentMethod: z.string().min(1, "Le mode de paiement est requis"),
  paymentStatus: z.string().min(1, "Le statut de paiement est requis"),
  date: z.date(),
  checkNumber: z.string().optional(),
  transferNumber: z.string().optional(),
  notes: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  includeFodec: z.boolean().optional(),
  includeTimbreFiscal: z.boolean().optional(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      productId: z.string().min(1, "Le produit est requis"),
      quantity: z.number().positive("La quantité doit être positive"),
      unitPrice: z.number().nonnegative("Le prix ne peut être négatif"),
      vatRate: z.number(),
      discount: z.number().min(0).max(100).optional(),
      total: z.number(),
    })
  ).min(1, "Au moins un produit est requis"),
});

type FormValues = z.infer<typeof formSchema>;

const EditSale = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { products } = useProducts();
  const { settings } = useCompanySettings();
  const { getSaleById, updateSale, isLoading } = useSales();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
      date: new Date(),
      paymentStatus: "paid",
      paymentMethod: "cash",
      discount: 0,
      includeFodec: false,
      includeTimbreFiscal: false,
    },
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const dbClients = await (window as any).electronAPI.dbAll('SELECT * FROM clients');
        setClients(dbClients || []);
      } catch (error) {
        console.error("Failed to fetch clients from DB:", error);
        toast({ title: "Erreur", description: "Impossible de charger les clients.", variant: "destructive" });
      }
    };
    fetchClients();
  }, [toast]);

  useEffect(() => {
    const fetchSaleData = async () => {
      console.log(`[EditSale] useEffect triggered. ID from params: ${id}, isLoading: ${isLoading}`);
      if (!id) {
        console.log('[EditSale] No ID found, returning.');
        return;
      }
      
      console.log('[EditSale] Calling getSaleById...');
      const saleToEdit = getSaleById(id);
      console.log('[EditSale] Result from getSaleById:', saleToEdit);

      if (saleToEdit) {
        console.log('[EditSale] Sale found, fetching client and resetting form.');
        const clientOfSale = await (window as any).electronAPI.dbGet('SELECT * FROM clients WHERE id = ?', [saleToEdit.clientId]);
        if (clientOfSale) {
          setSelectedClient(clientOfSale);
        }
        
        form.reset({
          ...saleToEdit,
          date: new Date(saleToEdit.date),
          discount: saleToEdit.discount || 0,
          includeFodec: !!saleToEdit.fodec,
          includeTimbreFiscal: !!saleToEdit.timbreFiscal,
        });
      } else if (!isLoading) {
        console.log('[EditSale] Sale not found and context is not loading. Navigating away.');
        toast({ title: "Erreur", description: "Vente non trouvée.", variant: "destructive" });
        navigate("/sales");
      } else {
        console.log('[EditSale] Sale not found, but context is loading. Waiting for next render.');
      }
    };
    fetchSaleData();
  }, [id, navigate, form, toast, getSaleById, isLoading]);

  const handleClientChange = (clientId: string, client: Client) => {
    setSelectedClient(client);
    form.setValue("clientId", clientId);
  };

  const recalculateItemTotal = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const discount = item.discount || 0;
    item.total = quantity * unitPrice * (1 - discount / 100);
    form.setValue(`items.${index}.total`, item.total);
    form.trigger('items');
  };

  const handleProductChange = (productId: string, product: Product, index: number) => {
    const items = form.getValues("items");
    items[index] = {
      ...items[index],
      productId,
      unitPrice: product.sellingPrice || 0,
      vatRate: product.vatRate || 19,
    };
    form.setValue("items", items);
    recalculateItemTotal(index);
  };

  const addItem = () => {
    const items = form.getValues("items");
    form.setValue("items", [...items, { productId: "", quantity: 1, unitPrice: 0, vatRate: 19, discount: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items");
    if (items.length > 1) {
      form.setValue("items", items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const { items, discount = 0, includeFodec, includeTimbreFiscal } = form.getValues();
    if (!items) return { totalHT: 0, totalTVA: 0, fodec: 0, timbreFiscal: 0, totalTTC: 0 };
    let totalHTAfterItemsDiscount = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalHT = totalHTAfterItemsDiscount * (1 - (discount || 0) / 100);
    
    let totalTVA = items.reduce((sum, item) => {
      const itemTotal = item.total || 0;
      const itemVatRate = item.vatRate || 0;
      return sum + (itemTotal * itemVatRate / 100);
    }, 0);
    totalTVA = totalTVA * (1 - (discount || 0) / 100);

    const fodecAmount = includeFodec ? totalHT * 0.01 : 0;
    const timbreFiscalAmount = includeTimbreFiscal ? 1.000 : 0;
    const totalTTC = totalHT + totalTVA + fodecAmount + timbreFiscalAmount;
    return { totalHT, totalTVA, fodec: fodecAmount, timbreFiscal: timbreFiscalAmount, totalTTC };
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.clientId || !clients.find(c => c.id === data.clientId)) {
      toast({ title: "Erreur de validation", description: "Le client sélectionné n'est pas valide. Veuillez le resélectionner.", variant: "destructive" });
      return;
    }

    const { totalHT, totalTVA, totalTTC, fodec, timbreFiscal } = calculateTotals();
    const clientName = clients.find(c => c.id === data.clientId)?.name || "Inconnu";
    
    const saleData: Partial<Sale> = {
      invoiceNumber: data.invoiceNumber,
      clientId: data.clientId,
      clientName: clientName,
      totalHT, 
      totalTVA, 
      totalTTC, 
      fodec, 
      timbreFiscal,
      discount: data.discount,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus as any,
      date: new Date(data.date),
      notes: data.notes,
      checkNumber: data.checkNumber,
      transferNumber: data.transferNumber,
      amountPaid: data.paymentStatus === 'paid' ? totalTTC : 0,
      items: data.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
            ...item, 
            id: item.id || `sitem-${Date.now()}-${Math.random()}`,
            productName: product?.name || 'N/A'
        };
    }) as SaleItem[],
    };

    try {
      if (!id) throw new Error("Sale ID is missing");
      await updateSale(id, saleData);

      toast({ title: 'Vente mise à jour' });
      navigate("/sales");
    } catch (error) {
      console.error("Erreur sauvegarde vente:", error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder la vente.", variant: "destructive" });
    }
  };

  const watchedItems = form.watch("items");
  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="content-container">
        <PageHeader title="Modifier la vente" />
        <Button variant="ghost" onClick={() => navigate("/sales")} className="mb-4 flex items-center gap-1"><ArrowLeft size={16} /> Retour</Button>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Informations Générales</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="invoiceNumber" render={({ field }) => (<FormItem><FormLabel>N° Facture</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><ClientSelector value={field.value} onValueChange={handleClientChange} placeholder="Sélectionner un client" clients={clients} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={e => field.onChange(new Date(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Articles</CardTitle></CardHeader>
              <CardContent>
                {watchedItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-4 items-end">
                    <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (<FormItem className="col-span-3"><FormLabel className={index > 0 ? "sr-only" : ""}>Produit</FormLabel><FormControl><ProductSelector value={field.value} onValueChange={(prodId, prod) => handleProductChange(prodId, prod, index)} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem className="col-span-1"><FormLabel className={index > 0 ? "sr-only" : ""}>Qté</FormLabel><FormControl><Input type="number" {...field} onChange={e => { field.onChange(Number(e.target.value)); recalculateItemTotal(index); }} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (<FormItem className="col-span-2"><FormLabel className={index > 0 ? "sr-only" : ""}>Prix U.</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => { field.onChange(Number(e.target.value)); recalculateItemTotal(index); }} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`items.${index}.vatRate`} render={({ field }) => (<FormItem className="col-span-2"><FormLabel className={index > 0 ? "sr-only" : ""}>TVA (%)</FormLabel><FormControl><Input type="number" {...field} onChange={e => { field.onChange(Number(e.target.value)); recalculateItemTotal(index); }} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`items.${index}.discount`} render={({ field }) => (<FormItem className="col-span-1"><FormLabel className={index > 0 ? "sr-only" : ""}>Remise (%)</FormLabel><FormControl><Input type="number" {...field} onChange={e => { field.onChange(Number(e.target.value)); recalculateItemTotal(index); }} /></FormControl></FormItem>)} />
                    <div className="col-span-2 flex items-center pt-8">
                      <p className="font-medium">{formatCurrency(watchedItems[index]?.total || 0)}</p>
                    </div>
                    <div className="col-span-1 flex items-end justify-end pt-8"><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={watchedItems.length <= 1}><Trash className="h-4 w-4" /></Button></div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Ajouter un article</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Détails de Paiement</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (<FormItem><FormLabel>Mode de Paiement</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Espèces</SelectItem><SelectItem value="check">Chèque</SelectItem><SelectItem value="transfer">Virement</SelectItem><SelectItem value="card">Carte</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="paymentStatus" render={({ field }) => (<FormItem><FormLabel>Statut de Paiement</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="paid">Payée</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="partial">Partiel</SelectItem><SelectItem value="canceled">Annulée</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                {form.watch('paymentMethod') === 'check' && <FormField control={form.control} name="checkNumber" render={({ field }) => (<FormItem><FormLabel>Numéro de Chèque</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
                {form.watch('paymentMethod') === 'transfer' && <FormField control={form.control} name="transferNumber" render={({ field }) => (<FormItem><FormLabel>Numéro de Virement</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Résumé et Options</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Notes additionnelles sur la vente..." {...field} /></FormControl></FormItem>)} />
                  <div className="flex items-center space-x-2"><FormField control={form.control} name="includeFodec" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Inclure FODEC (1%)</FormLabel></div></FormItem>)} /></div>
                  <div className="flex items-center space-x-2"><FormField control={form.control} name="includeTimbreFiscal" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Inclure Timbre Fiscal (1.000 TND)</FormLabel></div></FormItem>)} /></div>
                  <FormField control={form.control} name="discount" render={({ field }) => (<FormItem><FormLabel>Remise Globale (%)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>)} />
                  
                  <div className="text-right space-y-2 text-lg font-semibold">
                    <div>Total HT: {formatCurrency(totals.totalHT)}</div>
                    <div>Total TVA: {formatCurrency(totals.totalTVA)}</div>
                    {totals.fodec > 0 && <div>FODEC: {formatCurrency(totals.fodec)}</div>}
                    {totals.timbreFiscal > 0 && <div>Timbre Fiscal: {formatCurrency(totals.timbreFiscal)}</div>}
                    <div className="text-2xl">Total TTC: {formatCurrency(totals.totalTTC)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/sales")}>Annuler</Button>
              <Button type="submit">Mettre à jour la vente</Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className="content-container">
      <PageHeader title="Modifier la vente" />
      <Button variant="ghost" onClick={() => navigate("/sales")} className="mb-4 flex items-center gap-1"><ArrowLeft size={16} /> Retour</Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informations Générales</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="invoiceNumber" render={({ field }) => (<FormItem><FormLabel>N° Facture</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><ClientSelector value={field.value} onValueChange={handleClientChange} placeholder="Sélectionner un client" clients={clients} /><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={e => field.onChange(new Date(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Articles</CardTitle></CardHeader>
            <CardContent>
              {watchedItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-4 items-end">
                  <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (<FormItem className="col-span-3"><FormLabel className={index > 0 ? "sr-only" : ""}>Produit</FormLabel><FormControl><ProductSelector value={field.value} onValueChange={(prodId, prod) => handleProductChange(prodId, prod, index)} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (<FormItem className="col-span-1"><FormLabel className={index > 0 ? "sr-only" : ""}>Qté</FormLabel><FormControl><Input type="number" {...field} onChange={e => { field.onChange(Number(e.target.value)); recalculateItemTotal(index); }} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (<FormItem className="col-span-2"><FormLabel className={index > 0 ? "sr-only" : ""}>Prix U.</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => { field.onChange(Number(e.target.value)); recalculateItemTotal(index); }} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`items.${index}.vatRate`} render={({ field }) => (<FormItem className="col-span-2"><FormLabel className={index > 0 ? "sr-only" : ""}>TVA (%)</FormLabel><FormControl><Input type="number" {...field} onChange={e => { field.onChange(Number(e.target.value)); recalculateItemTotal(index); }} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`items.${index}.discount`} render={({ field }) => (<FormItem className="col-span-1"><FormLabel className={index > 0 ? "sr-only" : ""}>Remise (%)</FormLabel><FormControl><Input type="number" {...field} onChange={e => { field.onChange(Number(e.target.value)); recalculateItemTotal(index); }} /></FormControl></FormItem>)} />
                  <div className="col-span-2 flex items-center pt-8">
                    <p className="font-medium">{formatCurrency(watchedItems[index]?.total || 0)}</p>
                  </div>
                  <div className="col-span-1 flex items-end justify-end pt-8"><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={watchedItems.length <= 1}><Trash className="h-4 w-4" /></Button></div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Ajouter un article</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Détails de Paiement</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="paymentMethod" render={({ field }) => (<FormItem><FormLabel>Mode de Paiement</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Espèces</SelectItem><SelectItem value="check">Chèque</SelectItem><SelectItem value="transfer">Virement</SelectItem><SelectItem value="card">Carte</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="paymentStatus" render={({ field }) => (<FormItem><FormLabel>Statut de Paiement</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="paid">Payée</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="partial">Partiel</SelectItem><SelectItem value="canceled">Annulée</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              {form.watch('paymentMethod') === 'check' && <FormField control={form.control} name="checkNumber" render={({ field }) => (<FormItem><FormLabel>Numéro de Chèque</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
              {form.watch('paymentMethod') === 'transfer' && <FormField control={form.control} name="transferNumber" render={({ field }) => (<FormItem><FormLabel>Numéro de Virement</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Résumé et Options</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Notes additionnelles sur la vente..." {...field} /></FormControl></FormItem>)} />
                <div className="flex items-center space-x-2"><FormField control={form.control} name="includeFodec" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Inclure FODEC (1%)</FormLabel></div></FormItem>)} /></div>
                <div className="flex items-center space-x-2"><FormField control={form.control} name="includeTimbreFiscal" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Inclure Timbre Fiscal (1.000 TND)</FormLabel></div></FormItem>)} /></div>
                <FormField control={form.control} name="discount" render={({ field }) => (<FormItem><FormLabel>Remise Globale (%)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>)} />
                
                <div className="text-right space-y-2 text-lg font-semibold">
                  <div>Total HT: {formatCurrency(totals.totalHT)}</div>
                  <div>Total TVA: {formatCurrency(totals.totalTVA)}</div>
                  {totals.fodec > 0 && <div>FODEC: {formatCurrency(totals.fodec)}</div>}
                  {totals.timbreFiscal > 0 && <div>Timbre Fiscal: {formatCurrency(totals.timbreFiscal)}</div>}
                  <div className="text-2xl">Total TTC: {formatCurrency(totals.totalTTC)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/sales")}>Annuler</Button>
            <Button type="submit">Mettre à jour la vente</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditSale;
