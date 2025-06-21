import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart, ArrowRight, FileText, Truck, AlertTriangle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SystemActivities from "@/components/dashboard/SystemActivities";
import { useCurrency } from "@/hooks/use-currency";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useQuotes } from "@/contexts/QuotesContext";
import { useDeliveryNotes } from "@/contexts/DeliveryNotesContext";
import { usePurchaseOrders } from "@/contexts/PurchaseOrdersContext";
import { usePurchases } from "@/contexts/PurchasesContext";
import { Sale } from '@/types';
import { dbService } from '@/data/dbService';
import {
  LineChart,
  ResponsiveContainer
} from "recharts";

const Index = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { settings } = useCompanySettings();
  const { quotes } = useQuotes();
  const { deliveryNotes } = useDeliveryNotes();
  const { purchaseOrders } = usePurchaseOrders();
  const { getPurchaseStats } = usePurchases();
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    totalPurchases: 0,
    totalQuotes: 0,
    totalDeliveryNotes: 0,
    pendingPayments: 0,
    lowStockAlerts: 0,
    recentSales: [] as any[],
    outOfStockCount: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Charger les ventes depuis la base de données
        const sales = await dbService.getSales();
        const parsedSales = sales.map(sale => ({
          ...sale,
          totalTTC: parseFloat(sale.totalTTC) || 0
        }));

        // Fetch other data from the main process
        const productsData = await window.electronAPI.dbQuery('SELECT * FROM products');
        const { totalPurchases: totalPurchasesCount } = getPurchaseStats();

        // Calculate metrics using the latest sales data from the database
        const totalRevenue = parsedSales.reduce((sum, sale) => sum + (sale.totalTTC || 0), 0);
        const pendingPayments = parsedSales.filter(sale => sale.paymentStatus === 'pending').length;
        
        const lowStockAlerts = productsData.filter((product: any) => product.stock <= (product.reorderLevel || 5)).length;
        const outOfStockCount = productsData.filter((product: any) => (product.stock || 0) === 0).length;
        
        // Get recent sales (last 5)
        const recentSales = parsedSales
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        setStats({
          totalRevenue,
          totalSales: parsedSales.length,
          totalProducts: productsData.length,
          totalPurchases: totalPurchasesCount,
          totalQuotes: quotes.length,
          totalDeliveryNotes: deliveryNotes.length,
          pendingPayments,
          lowStockAlerts,
          recentSales,
          outOfStockCount,
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
    
  }, [quotes, deliveryNotes, purchaseOrders, formatCurrency, getPurchaseStats]);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('fr-TN').format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Payé</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-amber-800 border-yellow-200">En attente</Badge>;
      case "partial":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Partiel</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="content-container space-y-8">
      {/* Header with enhanced animation */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="transform transition-all duration-500 hover:scale-105">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Bienvenue dans {settings.name || "Xflow"}
          </p>
        </div>
      </div>

      {/* Stats Cards with professional animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-300 animate-fade-in hover:scale-105 transform" 
              onClick={() => navigate('/sales')}
              style={{animationDelay: '0.1s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-blue-800">Chiffre d'affaires</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors duration-300">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-900 group-hover:text-blue-800 transition-colors duration-300">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-sm text-blue-700 flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
              Total des ventes
            </p>
          </CardContent>
        </Card>

        {/* Sales Card */}
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 border-emerald-300 animate-fade-in hover:scale-105 transform" 
              onClick={() => navigate('/sales')}
              style={{animationDelay: '0.2s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-emerald-800">Ventes</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-lg group-hover:bg-emerald-600 transition-colors duration-300">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-900 group-hover:text-emerald-800 transition-colors duration-300">
              {stats.totalSales}
            </div>
            <p className="text-sm text-emerald-700 mt-1">
              Nombre total de ventes
            </p>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 border-purple-300 animate-fade-in hover:scale-105 transform" 
              onClick={() => navigate('/products')}
              style={{animationDelay: '0.3s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-purple-800">Produits</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors duration-300">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-900 group-hover:text-purple-800 transition-colors duration-300">
              {stats.totalProducts}
            </div>
            <p className="text-sm text-purple-700 mt-1">
              Produits en stock
            </p>
          </CardContent>
        </Card>

         {/* Total Purchases Card */}
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 border-orange-300 animate-fade-in hover:scale-105 transform" 
               onClick={() => navigate('/purchases')}
              style={{animationDelay: '0.4s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
             <CardTitle className="text-sm font-semibold text-orange-800">Total Achats</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors duration-300">
               <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-900 group-hover:text-orange-800 transition-colors duration-300">
               {stats.totalPurchases}
            </div>
            <p className="text-sm text-orange-700 mt-1">
               Achats enregistrés
            </p>
          </CardContent>
        </Card>

        {/* Quotes Card */}
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200 border-indigo-300 animate-fade-in hover:scale-105 transform" 
              onClick={() => navigate('/quotes')}
              style={{animationDelay: '0.5s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-indigo-800">Devis</CardTitle>
            <div className="p-2 bg-indigo-500 rounded-lg group-hover:bg-indigo-600 transition-colors duration-300">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-indigo-900 group-hover:text-indigo-800 transition-colors duration-300">
              {stats.totalQuotes}
            </div>
            <p className="text-sm text-indigo-700 mt-1">
              Devis créés
            </p>
          </CardContent>
        </Card>

        {/* Delivery Notes Card */}
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-teal-50 via-teal-100 to-teal-200 border-teal-300 animate-fade-in hover:scale-105 transform" 
              onClick={() => navigate('/delivery-notes')}
              style={{animationDelay: '0.6s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-teal-800">Bons de livraison</CardTitle>
            <div className="p-2 bg-teal-500 rounded-lg group-hover:bg-teal-600 transition-colors duration-300">
              <Truck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-teal-900 group-hover:text-teal-800 transition-colors duration-300">
              {stats.totalDeliveryNotes}
            </div>
            <p className="text-sm text-teal-700 mt-1">
              Livraisons effectuées
            </p>
          </CardContent>
        </Card>

        {/* Pending Payments Card */}
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-amber-300 animate-fade-in hover:scale-105 transform" 
              onClick={() => navigate('/payments')}
              style={{animationDelay: '0.7s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-amber-800">Paiements en attente</CardTitle>
            <div className="p-2 bg-amber-500 rounded-lg group-hover:bg-amber-600 transition-colors duration-300">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-amber-900 group-hover:text-amber-800 transition-colors duration-300">
              {stats.pendingPayments}
            </div>
            <p className="text-sm text-amber-700 mt-1">
              À suivre
            </p>
          </CardContent>
        </Card>

         {/* Out of Stock Card */}
         <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-red-50 via-red-100 to-red-200 border-red-300 animate-fade-in hover:scale-105 transform" 
              onClick={() => navigate('/products')}
              style={{animationDelay: '0.8s'}}>
           <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
             <CardTitle className="text-sm font-semibold text-red-800">Rupture de stock</CardTitle>
             <div className="p-2 bg-red-500 rounded-lg group-hover:bg-red-600 transition-colors duration-300">
               <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
             <div className="text-3xl font-bold text-red-900 group-hover:text-red-800 transition-colors duration-300">
               {stats.outOfStockCount}
            </div>
             <p className="text-sm text-red-700 mt-1">
               Produits en rupture
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales and Activities with enhanced animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in" style={{animationDelay: '0.9s'}}>
        {/* Recent Sales */}
        <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ventes récentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sales')} 
                    className="text-blue-600 hover:text-blue-700 hover:scale-110 transition-all duration-300 hover:bg-blue-100">
              Voir tout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {stats.recentSales.length > 0 ? (
              <div className="space-y-4">
                {stats.recentSales.map((sale, index) => (
                  <div key={sale.id} 
                       className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:border-blue-200" 
                       style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Vente #{sale.id}</p>
                      <p className="text-sm text-gray-600">{sale.clientName}</p>
                      <p className="text-xs text-gray-500">{formatDate(sale.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-gray-900">{formatCurrency(sale.totalTTC)}</p>
                      {getStatusBadge(sale.paymentStatus)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 animate-fade-in">
                <div className="mb-4 p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-blue-500" />
                </div>
                <p className="text-gray-600 text-lg mb-4">Aucune vente récente</p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-300 text-white shadow-lg" 
                        onClick={() => navigate('/sales/add')}>
                  Créer une vente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Activities */}
        <div className="animate-fade-in transform transition-all duration-500 hover:scale-105" style={{animationDelay: '1s'}}>
          <SystemActivities />
        </div>
      </div>
    </div>
  );
};

export default Index;
