
import { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CompanySettings } from "@/types";
import { useCompanySettings, availableCurrencies } from "@/contexts/CompanySettingsContext";
import { Upload, Image, Bell, Globe, User, CreditCard } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const { settings, updateSettings } = useCompanySettings();
  const { hasPermission } = useUser();
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoUrl || null);
  const navigate = useNavigate();
  
  // Extended form to include new settings
  const form = useForm<CompanySettings>({
    defaultValues: {
      name: settings.name || "Xflow",
      address: settings.address || "",
      phone: settings.phone || "",
      email: settings.email || "",
      website: settings.website || "",
      taxId: settings.taxId || "",
      logoUrl: settings.logoUrl || "",
      currency: settings.currency || "TND",
      lowStockThreshold: settings.lowStockThreshold || 10,
      enableLowStockAlert: settings.enableLowStockAlert ?? true,
      companyName: settings.companyName || "Xflow",
      taxNumber: settings.taxNumber || "",
      bankAccount: settings.bankAccount || "",
      rib: settings.rib || "",
      invoiceCounter: settings.invoiceCounter || 1,
      bankName: settings.bankName || "",
      bankRib: settings.bankRib || "",
    },
  });
  
  // Update form when settings change
  useEffect(() => {
    form.reset({
      name: settings.name || "Xflow",
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      taxId: settings.taxId,
      logoUrl: settings.logoUrl,
      currency: settings.currency || "TND",
      lowStockThreshold: settings.lowStockThreshold || 10,
      enableLowStockAlert: settings.enableLowStockAlert ?? true,
      companyName: settings.companyName || "Xflow",
      taxNumber: settings.taxNumber || "",
      bankAccount: settings.bankAccount || "",
      rib: settings.rib || "",
      invoiceCounter: settings.invoiceCounter || 1,
      bankName: settings.bankName || "",
      bankRib: settings.bankRib || "",
    });
    setLogoPreview(settings.logoUrl || null);
  }, [settings, form]);
  
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
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
    
    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result as string;
      setLogoPreview(result);
      form.setValue('logoUrl', result);
    };
    fileReader.readAsDataURL(file);
  };
  
  const onSubmit = (data: CompanySettings) => {
    // Ensure required name field is present
    const updatedSettings: CompanySettings = {
      name: data.name || "Xflow", // Provide default if empty
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      taxId: data.taxId,
      logoUrl: data.logoUrl,
      currency: data.currency || "TND",
      lowStockThreshold: data.lowStockThreshold || 10,
      enableLowStockAlert: data.enableLowStockAlert ?? true,
      companyName: data.companyName || "Xflow",
      taxNumber: data.taxNumber || "",
      bankAccount: data.bankAccount || "",
      rib: data.rib || "",
      invoiceCounter: data.invoiceCounter || 1,
      bankName: data.bankName || "",
      bankRib: data.bankRib || "",
    };
    
    updateSettings(updatedSettings);
    
    toast({
      title: "Paramètres mis à jour",
      description: "Les paramètres de l'entreprise ont été mis à jour avec succès.",
    });
  };

  const handleNavigateToUsers = () => {
    navigate('/users');
  };
  
  return (
    <div className="content-container w-full p-4 md:p-6 max-w-full animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Paramètres</h1>
      
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="company">Informations de l'entreprise</TabsTrigger>
          <TabsTrigger value="banking">Informations bancaires</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 w-full">
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                      <div className="flex flex-col items-center">
                        <div className="w-full max-w-[250px] aspect-video bg-muted rounded-md flex flex-col items-center justify-center border-2 border-dashed border-border relative overflow-hidden">
                          {logoPreview ? (
                            <img 
                              src={logoPreview} 
                              alt="Logo de l'entreprise" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                              <Image size={48} className="mb-3 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Logo de l'entreprise</p>
                              <p className="text-xs text-muted-foreground mt-1">Format recommandé: PNG, JPEG</p>
                            </div>
                          )}
                        </div>
                        
                        <label htmlFor="company-logo" className="w-full max-w-[250px] mt-4">
                          <div className="flex items-center justify-center w-full">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full hover:bg-muted/70"
                              onClick={() => document.getElementById('company-logo')?.click()}
                            >
                              <Upload size={16} className="mr-2" />
                              {logoPreview ? "Changer le logo" : "Télécharger un logo"}
                            </Button>
                          </div>
                          <input 
                            id="company-logo"
                            name="logo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-2/3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom de l'entreprise *</FormLabel>
                              <FormControl>
                                <Input placeholder="Nom de l'entreprise" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="taxId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Matricule fiscal</FormLabel>
                              <FormControl>
                                <Input placeholder="Matricule fiscal" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input placeholder="Téléphone" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Email" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <Input placeholder="Adresse" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site web</FormLabel>
                              <FormControl>
                                <Input placeholder="Site web" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 transition-all"
                    >
                      Enregistrer les modifications
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking">
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Informations bancaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la banque</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Banque de Tunisie" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bankRib"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RIB bancaire</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: 12 345 1234567890123456 78" 
                              {...field}
                              className="font-mono"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            Format: XX XXX XXXXXXXXXXXXXXXX XX
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">À quoi servent ces informations ?</h4>
                    <p className="text-sm text-blue-700">
                      Les informations bancaires seront affichées sur vos factures pour faciliter les paiements par virement bancaire de vos clients.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 transition-all"
                    >
                      Enregistrer les informations bancaires
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 w-full">
            <CardHeader>
              <CardTitle>Préférences système</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Globe className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-medium">Paramètres régionaux</h3>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Devise par défaut</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une devise" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCurrencies.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.name} ({currency.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Ce paramètre s'appliquera à l'ensemble du système.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Bell className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-medium">Notifications</h3>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="enableLowStockAlert"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">Alertes de stock faible</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Recevoir des alertes et notifications quand les produits sont en quantité limitée
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  // Update immediately to show/hide notifications
                                  const currentSettings = form.getValues();
                                  updateSettings({
                                    ...currentSettings,
                                    enableLowStockAlert: checked
                                  });
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lowStockThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seuil de stock faible</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 10)} 
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Les produits avec une quantité inférieure à ce seuil seront signalés comme "stock faible"
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 transition-all"
                    >
                      Enregistrer les préférences
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasPermission('canManageUsers') ? (
                <>
                  <p className="text-muted-foreground mb-4">
                    Gérez les comptes utilisateurs, leurs rôles et leurs permissions.
                  </p>
                  <Button 
                    onClick={handleNavigateToUsers}
                    className="flex items-center"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Accéder à la gestion des utilisateurs
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs.
                  Contactez un administrateur pour plus d'informations.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
