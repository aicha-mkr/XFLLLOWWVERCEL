
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@/types";
import { useToast } from "@/hooks/use-toast";

const EditClient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const savedClients = localStorage.getItem('clients');
      if (savedClients) {
        const clients: Client[] = JSON.parse(savedClients);
        const foundClient = clients.find(c => c.id === id);
        if (foundClient) {
          setClient(foundClient);
        } else {
          toast({
            title: "Erreur",
            description: "Client non trouvé",
            variant: "destructive"
          });
          navigate("/clients");
        }
      }
    }
    setLoading(false);
  }, [id, navigate, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      const clients: Client[] = JSON.parse(savedClients);
      const updatedClients = clients.map(c => c.id === client.id ? client : c);
      localStorage.setItem('clients', JSON.stringify(updatedClients));
      
      toast({
        title: "Client modifié",
        description: "Le client a été modifié avec succès"
      });
      
      navigate("/clients");
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!client) {
    return <div>Client non trouvé</div>;
  }

  return (
    <div className="content-container">
      <PageHeader title="Modifier le client" />
      
      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du client *</Label>
                <Input
                  id="name"
                  value={client.name}
                  onChange={(e) => setClient({...client, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="fiscalId">Matricule fiscal</Label>
                <Input
                  id="fiscalId"
                  value={client.fiscalId || ''}
                  onChange={(e) => setClient({...client, fiscalId: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={client.phone || ''}
                  onChange={(e) => setClient({...client, phone: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={client.email || ''}
                  onChange={(e) => setClient({...client, email: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={client.address || ''}
                onChange={(e) => setClient({...client, address: e.target.value})}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={client.notes || ''}
                onChange={(e) => setClient({...client, notes: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">Modifier le client</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/clients")}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditClient;
