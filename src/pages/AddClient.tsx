import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/ui/PageHeader";
import { ArrowLeft } from "lucide-react";
import { Client } from "@/types";
import { dbService } from "@/data/dbService";

type FormData = {
  name: string;
  fiscalId: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const AddClient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      fiscalId: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });
  
  const onSubmit = async (data: FormData) => {
    // Generate a client ID
    const clientId = `C-${Math.floor(Math.random() * 10000)}`;
    
    // Create the new client object
    const newClient: Client = {
      id: clientId,
      name: data.name,
      fiscalId: data.fiscalId,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
      createdAt: new Date(),
    };
    
    console.log("New client data:", newClient);
    
    // Save to database
    try {
      await dbService.createClient(newClient);
      
      // Notify other parts of the app
      window.dispatchEvent(new CustomEvent('clients-changed'));

      // Show success message
      toast({
        title: "Client ajouté",
        description: `${data.name} a été ajouté avec succès.`,
      });
      
      // Redirect to clients list
      navigate("/clients");
    } catch (error) {
      console.error("Error saving client:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du client.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="content-container animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/clients")} 
        className="mb-4 flex items-center gap-1 hover:bg-muted"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </Button>
      
      <PageHeader title="Ajouter un client" />
      
      <Card className="shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Le nom du client est obligatoire" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du client *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du client" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fiscalId"
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
                    <FormItem className="md:col-span-2">
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notes additionnelles"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/clients")}
                  className="hover:bg-muted/50 transition-all"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 transition-all"
                >
                  Enregistrer
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddClient;
