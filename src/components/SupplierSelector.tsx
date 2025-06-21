
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
}

interface SupplierSelectorProps {
  value?: string;
  onValueChange: (supplierId: string, supplier: Supplier) => void;
  placeholder?: string;
}

const SupplierSelector = ({
  value,
  onValueChange,
  placeholder = "Sélectionner un fournisseur"
}: SupplierSelectorProps) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const loadSuppliers = () => {
      try {
        const savedSuppliers = localStorage.getItem('suppliers');
        if (savedSuppliers) {
          setSuppliers(JSON.parse(savedSuppliers));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des fournisseurs:', error);
      }
    };

    loadSuppliers();

    // Écouter les changements de fournisseurs
    const handleSuppliersUpdate = () => {
      loadSuppliers();
    };

    window.addEventListener('suppliersUpdated', handleSuppliersUpdate);
    window.addEventListener('storage', handleSuppliersUpdate);

    return () => {
      window.removeEventListener('suppliersUpdated', handleSuppliersUpdate);
      window.removeEventListener('storage', handleSuppliersUpdate);
    };
  }, []);

  const handleValueChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      onValueChange(supplierId, supplier);
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
        {suppliers.length > 0 ? (
          suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              <div className="flex flex-col">
                <span className="font-medium">{supplier.name}</span>
                <span className="text-sm text-gray-500">{supplier.contact}</span>
              </div>
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-suppliers" disabled>
            Aucun fournisseur disponible
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default SupplierSelector;
