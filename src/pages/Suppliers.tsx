import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Building2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  fiscalId?: string;
  bankRib?: string;
  notes?: string;
  createdAt: Date;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
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
  
  const filteredSuppliers = suppliers.filter(
    supplier => 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-TN').format(new Date(date));
  };

  const handleDeleteSupplier = (id: string) => {
    const updatedSuppliers = suppliers.filter(supplier => supplier.id !== id);
    setSuppliers(updatedSuppliers);
    localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));
    
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('suppliersUpdated'));
    
    toast({
      title: "Fournisseur supprimé",
      description: "Le fournisseur a été supprimé avec succès",
    });
  };

  return (
    <div className="content-container animate-fade-in">
      <PageHeader title="Fournisseurs">
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Link to="/suppliers/add">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus size={16} />
              <span>Nouveau fournisseur</span>
            </Button>
          </Link>
        </div>
      </PageHeader>
      
      <Card className="border-blue-200 shadow-lg">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg p-4 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800">Liste des fournisseurs</h3>
          <p className="text-sm text-blue-600">Gérez vos fournisseurs et leurs informations</p>
        </div>
        
        <div className="table-container">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <TableHead className="text-blue-800 font-semibold">Nom</TableHead>
                <TableHead className="text-blue-800 font-semibold">Contact</TableHead>
                <TableHead className="text-blue-800 font-semibold">Matricule Fiscal</TableHead>
                <TableHead className="text-blue-800 font-semibold">RIB Bancaire</TableHead>
                <TableHead className="text-blue-800 font-semibold">Téléphone</TableHead>
                <TableHead className="text-blue-800 font-semibold">Email</TableHead>
                <TableHead className="text-blue-800 font-semibold">Date création</TableHead>
                <TableHead className="text-center text-blue-800 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <TableRow 
                    key={supplier.id} 
                    className="hover:bg-blue-50 transition-colors border-blue-100"
                  >
                    <TableCell className="font-medium text-blue-700">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-blue-600" />
                        <Link to={`/suppliers/edit/${supplier.id}`} className="hover:underline">{supplier.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.contact}</TableCell>
                    <TableCell>{supplier.fiscalId || 'N/A'}</TableCell>
                    <TableCell>{supplier.bankRib || 'N/A'}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{formatDate(supplier.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-red-600 hover:text-red-800 hover:bg-red-100"
                              title="Supprimer le fournisseur"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le fournisseur "{supplier.name}" ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchTerm ? "Aucun fournisseur trouvé" : "Aucun fournisseur enregistré"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Suppliers;
