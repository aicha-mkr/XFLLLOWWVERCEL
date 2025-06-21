
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Client } from "@/types";
import { Search, Edit, Printer, Eye, Download, FileText, MoreHorizontal, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { clientService } from "@/services/clientService";

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Charger les clients
  const loadClients = async () => {
    try {
      setIsLoading(true);
      const clientsData = clientService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [location.key]);
  
  // Filtrer les clients basé sur le terme de recherche
  const filteredClients = searchTerm 
    ? clientService.searchClients(searchTerm)
    : clients;
  
  // Gérer la vue des détails du client
  const handleViewClient = (clientId: string) => {
    navigate(`/clients/details/${clientId}`);
  };
  
  // Gérer la modification du client
  const handleEditClient = (clientId: string) => {
    navigate(`/clients/edit/${clientId}`);
  };

  // Gérer la suppression du client
  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  // Confirmer la suppression du client
  const confirmDeleteClient = async () => {
    if (clientToDelete) {
      try {
        clientService.deleteClient(clientToDelete.id);
        await loadClients(); // Recharger la liste
        
        toast({
          title: "Client supprimé",
          description: `Le client ${clientToDelete.name} a été supprimé avec succès.`,
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Impossible de supprimer le client.",
          variant: "destructive",
        });
      }
    }
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };
  
  // Gérer l'impression des détails du client
  const handlePrintClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
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
                .client-info div { margin-bottom: 10px; }
                .label { font-weight: bold; }
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
                <div><span class="label">Nom:</span> ${client.name}</div>
                ${client.fiscalId ? `<div><span class="label">Matricule fiscal:</span> ${client.fiscalId}</div>` : ''}
                ${client.phone ? `<div><span class="label">Téléphone:</span> ${client.phone}</div>` : ''}
                ${client.email ? `<div><span class="label">Email:</span> ${client.email}</div>` : ''}
                ${client.address ? `<div><span class="label">Adresse:</span> ${client.address}</div>` : ''}
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
  
  // Exporter les données clients en CSV
  const exportClientsToCSV = () => {
    try {
      const csvContent = clientService.exportToCSV();
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `clients-export-${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export réussi",
        description: "Les données clients ont été exportées au format CSV."
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive"
      });
    }
  };
  
  // Exporter les données clients en PDF
  const exportClientsToPDF = () => {
    toast({
      title: "Export en cours",
      description: "Préparation du fichier PDF..."
    });
    
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Liste des clients - ${settings.name}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; text-align: center; margin-bottom: 20px; }
                .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .company-info { text-align: right; }
                .logo { max-width: 150px; max-height: 60px; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Liste des clients</h1>
                <div class="company-info">
                  ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${settings.name}" class="logo" />` : ''}
                  <h3>${settings.name || 'Stock Pro'}</h3>
                  ${settings.address ? `<p>${settings.address}</p>` : ''}
                  ${settings.phone ? `<p>Tél: ${settings.phone}</p>` : ''}
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Matricule fiscal</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Adresse</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.map(client => `
                    <tr>
                      <td>${client.name}</td>
                      <td>${client.fiscalId || '-'}</td>
                      <td>${client.phone || '-'}</td>
                      <td>${client.email || '-'}</td>
                      <td>${client.address || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                <p>Document généré le ${new Date().toLocaleDateString()}</p>
                <p>Total clients: ${clients.length}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }, 500);
  };

  // Actualiser la liste
  const handleRefresh = () => {
    loadClients();
    toast({
      title: "Actualisation",
      description: "Liste des clients actualisée."
    });
  };

  return (
    <div className="content-container w-full p-4 md:p-6 max-w-full">
      <PageHeader title="Clients" addButtonLink="/clients/add" addButtonText="Ajouter un client">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[200px] md:w-[300px]"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} />
            <span className="hidden md:inline">Actualiser</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download size={16} />
                <span className="hidden md:inline">Exporter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={exportClientsToCSV} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Exporter en CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportClientsToPDF} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Exporter en PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>
      
      <Card className="shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead>Nom</TableHead>
                <TableHead>Matricule fiscal</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="animate-fade-in hover:bg-muted/30">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.fiscalId}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.address}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewClient(client.id)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClient(client.id)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintClient(client.id)} className="cursor-pointer">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClient(client)} 
                            className="cursor-pointer text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    {searchTerm ? "Aucun client trouvé pour cette recherche" : "Aucun client trouvé"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le client "{clientToDelete?.name}" ? 
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClient} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
