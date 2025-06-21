
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/types";
import { ArrowLeft, Edit, Printer, Mail, Phone, MapPin, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    // Load client from localStorage
    const loadClient = () => {
      try {
        const savedClients = localStorage.getItem('clients');
        if (savedClients && id) {
          const clients: Client[] = JSON.parse(savedClients);
          const foundClient = clients.find(c => c.id === id);
          setClient(foundClient || null);
        }
      } catch (error) {
        console.error("Error loading client:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails du client",
          variant: "destructive",
        });
      }
    };

    loadClient();
  }, [id, toast]);

  const handleEdit = () => {
    if (client) {
      navigate(`/clients/edit/${client.id}`);
    }
  };

  const handlePrint = () => {
    if (client) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Fiche Client: ${client.name}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .company-info { text-align: right; }
                .logo { max-width: 150px; max-height: 60px; margin-bottom: 10px; }
                .client-info { margin-bottom: 20px; }
                .client-info div { margin-bottom: 10px; display: flex; }
                .label { font-weight: bold; min-width: 150px; }
                .value { flex: 1; }
                .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Fiche Client</h1>
                <div class="company-info">
                  ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${settings.name}" class="logo" />` : ''}
                  <h3>${settings.name || 'Stock Pro'}</h3>
                  ${settings.address ? `<p>${settings.address}</p>` : ''}
                  ${settings.phone ? `<p>Tél: ${settings.phone}</p>` : ''}
                  ${settings.email ? `<p>Email: ${settings.email}</p>` : ''}
                </div>
              </div>
              
              <div class="client-info">
                <div><span class="label">Nom:</span> <span class="value">${client.name}</span></div>
                ${client.fiscalId ? `<div><span class="label">Matricule fiscal:</span> <span class="value">${client.fiscalId}</span></div>` : ''}
                ${client.phone ? `<div><span class="label">Téléphone:</span> <span class="value">${client.phone}</span></div>` : ''}
                ${client.email ? `<div><span class="label">Email:</span> <span class="value">${client.email}</span></div>` : ''}
                ${client.address ? `<div><span class="label">Adresse:</span> <span class="value">${client.address}</span></div>` : ''}
                <div><span class="label">Date de création:</span> <span class="value">${new Date(client.createdAt).toLocaleDateString()}</span></div>
              </div>
              
              <div class="footer">
                <p>Document généré le ${new Date().toLocaleDateString()}</p>
                ${settings.website ? `<p>${settings.website}</p>` : ''}
                ${settings.taxId ? `<p>Matricule fiscale: ${settings.taxId}</p>` : ''}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "Impression en cours",
        description: `Impression de la fiche client: ${client.name}`,
      });
    }
  };

  if (!client) {
    return (
      <div className="content-container">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Client non trouvé</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/clients")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/clients")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Détails du client</h1>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit size={16} />
            Modifier
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer size={16} />
            Imprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <p className="text-lg font-medium">{client.name}</p>
                </div>
                
                {client.fiscalId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Matricule fiscal</label>
                    <p className="text-lg">{client.fiscalId}</p>
                  </div>
                )}
              </div>

              {client.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </label>
                  <p className="text-lg">{client.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
              )}
              
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Date de création</p>
                <p className="font-medium">{new Date(client.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
