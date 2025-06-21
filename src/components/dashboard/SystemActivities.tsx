import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, AlertTriangle, Clock, Activity as ActivityIcon, Package } from "lucide-react";
import { useSales } from '@/contexts/SalesContext';
import { useProducts } from '@/hooks/use-products';
import { useClients } from '@/contexts/ClientsContext';
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useCurrency } from '@/hooks/use-currency';

interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
  color: string;
}

const SystemActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { sales } = useSales();
  const { products } = useProducts();
  const { clients } = useClients();
  const { formatCurrency } = useCurrency();

  const generateActivities = useCallback(() => {
    console.log("Generating activities with:", { sales, products, clients });
    const generatedActivities: Activity[] = [];

    // Sales activities
    sales
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5) // Limit to 5 most recent sales
      .forEach(sale => {
        generatedActivities.push({
            id: `sale-${sale.id}`,
          title: 'Nouvelle vente',
          description: `${sale.clientName} - ${formatCurrency(sale.totalTTC)}`,
          timestamp: new Date(sale.date),
          icon: ShoppingCart,
          color: 'green',
        });
      });

    // Client activities
    clients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3) // Limit to 3 most recent clients
      .forEach(client => {
        generatedActivities.push({
          id: `client-${client.id}`,
          title: 'Nouveau client',
          description: `${client.name} a rejoint la base client.`,
          timestamp: new Date(client.createdAt),
          icon: Users,
          color: 'blue',
          });
        });

    // New product activities
    products
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3) // Limit to 3 most recent products
      .forEach(product => {
        generatedActivities.push({
          id: `product-${product.id}`,
          title: 'Nouveau produit ajouté',
          description: `${product.name} a été ajouté à l'inventaire.`,
          timestamp: new Date(product.createdAt),
          icon: Package,
          color: 'purple',
        });
        });

    // Low stock activities
    const lowStockProducts = products.filter(p => p.stock < (p.reorderLevel || 5));
    if (lowStockProducts.length > 0) {
        generatedActivities.push({
            id: 'low-stock-alert',
            title: 'Stock faible',
            description: `${lowStockProducts.length} produit(s) en dessous du seuil.`,
            timestamp: new Date(), // This alert is always "now"
            icon: AlertTriangle,
            color: 'red',
          });
        }

    const sortedActivities = generatedActivities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10); // Show latest 10 activities overall
    
    console.log("Generated Activities:", sortedActivities);
    setActivities(sortedActivities);

  }, [sales, products, clients, formatCurrency]);

  useEffect(() => {
    // Generate activities when data changes
    generateActivities();
  }, [generateActivities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Activités du système</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <ScrollArea className="h-72">
        <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-${activity.color}-100 text-${activity.color}-600`}>
                      <activity.icon className="h-5 w-5" />
                    </div>
                </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <time dateTime={activity.timestamp.toISOString()}>
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: fr })}
                      </time>
                    </p>
                  </div>
                </div>
              ))}
              </div>
          </ScrollArea>
          ) : (
          <div className="flex flex-col items-center justify-center h-72 text-center">
            <ActivityIcon className="h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-600">Aucune activité à afficher</p>
            <p className="mt-1 text-xs text-gray-500">Les nouvelles ventes ou les nouveaux clients apparaîtront ici.</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default SystemActivities;
