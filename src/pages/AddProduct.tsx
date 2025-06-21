import { useState, ChangeEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Image } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { Supplier } from "@/types";

// VAT rate options
const vatRates = [
  { value: "0", label: "0%" },
  { value: "7", label: "7%" },
  { value: "13", label: "13%" },
  { value: "19", label: "19%" },
];

type FormData = {
  name: string;
  description: string;
  barcode: string;
  category: string;
  supplierName: string;
  expirationDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  vatRate: string;
  reorderLevel: number;
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addProduct } = useProducts();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    try {
      const savedSuppliers = localStorage.getItem('suppliers');
      if (savedSuppliers) {
        setSuppliers(JSON.parse(savedSuppliers));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  }, []);
  
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      barcode: "",
      category: "",
      supplierName: "",
      expirationDate: "",
      quantity: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      vatRate: "19",
      reorderLevel: 10,
    },
  });
  
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image.",
        variant: "destructive",
      });
      return;
    }
    
    setImageFile(file);
    
    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setImagePreview(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };
  
  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Create product object
      const productData = {
        name: data.name,
        description: data.description,
        barcode: data.barcode,
        category: data.category,
        supplier: data.supplierName,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
        quantity: data.quantity,
        stock: data.quantity,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        vatRate: parseInt(data.vatRate),
        reorderLevel: data.reorderLevel,
        imageUrl: imagePreview || "placeholder.svg",
      };
      
      // Use the addProduct function from useProducts hook
      await addProduct(productData);
      
      // Redirect to products list
      navigate("/products");
    } catch (error) {
      console.error('Failed to add product:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du produit.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="content-container w-full p-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/products")} 
        className="mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </Button>
      
      <PageHeader title="Ajouter un produit" />
      
      <Card className="shadow-md w-full">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex flex-col items-center justify-center">
                  <div className="w-full max-w-[300px] aspect-square bg-muted rounded-md flex flex-col items-center justify-center border-2 border-dashed border-border relative overflow-hidden">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Aperçu du produit" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Image size={48} className="mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Image du produit</p>
                        <p className="text-xs text-muted-foreground mt-1">Formats acceptés: JPG, PNG, WEBP</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 w-full max-w-[300px]">
                    <label htmlFor="product-image" className="w-full">
                      <div className="flex items-center justify-center w-full">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => document.getElementById('product-image')?.click()}
                        >
                          <Upload size={16} className="mr-2" />
                          {imagePreview ? "Changer l'image" : "Télécharger une image"}
                        </Button>
                      </div>
                      <input 
                        id="product-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      rules={{ required: "Le nom du produit est obligatoire" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du produit *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du produit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="barcode"
                      rules={{ required: "Le code-barres est obligatoire" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code-barres *</FormLabel>
                          <FormControl>
                            <Input placeholder="Code-barres" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <FormControl>
                            <Input placeholder="Catégorie" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supplierName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du fournisseur</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un fournisseur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.name}>
                                  {supplier.name}
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
                      name="expirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'expiration</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      rules={{ required: "La quantité est obligatoire" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantité *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="purchasePrice"
                      rules={{ required: "Le prix d'achat est obligatoire" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix d'achat *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sellingPrice"
                      rules={{ required: "Le prix de vente est obligatoire" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix de vente *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vatRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TVA</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="TVA" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vatRates.map(rate => (
                                <SelectItem key={rate.value} value={rate.value}>
                                  {rate.label}
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
                      name="reorderLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau de réapprovisionnement</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description du produit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-8">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => navigate("/products")}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le produit"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
