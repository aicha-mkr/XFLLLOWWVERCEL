import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/ui/PageHeader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { dbService } from "@/data/dbService";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  contact: z.string().min(1, "Le contact est requis"),
  phone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  fiscalId: z.string().optional(),
  bankRib: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddSupplier = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
      fiscalId: "",
      bankRib: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const newSupplier = {
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
      };

      await dbService.createSupplier(newSupplier);
      
      // Déclencher un événement pour notifier les autres composants (si nécessaire)
      window.dispatchEvent(new CustomEvent('suppliers-changed'));
      
      toast({
        title: "Fournisseur créé",
        description: `Le fournisseur ${data.name} a été créé avec succès.`,
      });
      
      navigate("/suppliers");
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le fournisseur",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="content-container">
      <PageHeader 
        title="Nouveau fournisseur" 
        addButtonLink="/suppliers"
      />
      
      <Button 
        variant="ghost" 
        onClick={() => navigate("/suppliers")} 
        className="mb-4 flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations du fournisseur</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personne de contact</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du contact" {...field} />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fiscalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matricule Fiscal (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Matricule Fiscal" {...field} />
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
                      <FormLabel>RIB Bancaire (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="RIB Bancaire" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adresse complète" 
                        className="resize-none h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                  onClick={() => navigate("/suppliers")}
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

export default AddSupplier;
