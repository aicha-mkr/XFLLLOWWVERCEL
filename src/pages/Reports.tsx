import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calculator, Target, Printer } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import PageHeader from "@/components/ui/PageHeader";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useToast } from "@/hooks/use-toast";
import { usePurchases } from "@/contexts/PurchasesContext";
import { useSales } from "@/contexts/SalesContext";
import { useProducts } from "@/hooks/use-products";
import { useClients } from "@/contexts/ClientsContext";
import { Sale } from "@/types";
import { dbService } from "@/data/dbService";

const Reports = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const { getPurchaseStats } = usePurchases();
  const { products } = useProducts();
  const { clients } = useClients();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const { formatCurrency } = useCurrency();
  const { settings } = useCompanySettings();
  const { toast } = useToast();

  useEffect(() => {
    const loadSales = async () => {
      try {
        const salesData = await dbService.getSales();
        // Ensure totalTTC is a number
        const formattedSales = salesData.map(sale => ({
          ...sale,
          totalTTC: parseFloat(sale.totalTTC) || 0
        }));
        setSales(formattedSales);
      } catch (error) {
        console.error('Error loading sales from database in Reports:', error);
      }
    };

    loadSales();
    // Rafraîchir les données toutes les 30 secondes
    const interval = setInterval(loadSales, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateMetrics = () => {
    // Filtrer les ventes selon la période sélectionnée
    const now = new Date();
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return saleDate >= weekAgo;
        case 'month':
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          return saleDate >= quarterStart;
        case 'year':
          return saleDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + (sale.totalTTC || 0), 0);
    const { totalSpent: totalPurchasesAmount, totalPurchases: totalPurchasesCount } = getPurchaseStats();
    const totalProfit = totalSalesAmount - totalPurchasesAmount;
    const profitMargin = totalSalesAmount > 0 ? (totalProfit / totalSalesAmount) * 100 : 0;
    
    const paidSales = filteredSales.filter(sale => sale.paymentStatus === 'paid');
    const pendingSales = filteredSales.filter(sale => sale.paymentStatus === 'pending');
    const partialSales = filteredSales.filter(sale => sale.paymentStatus === 'partial');
    
    const lowStockProductsList = products.filter(p => p.quantity <= (p.reorderLevel || settings.lowStockThreshold || 10));

    return {
      totalSalesAmount,
      totalPurchasesAmount,
      totalProfit,
      profitMargin,
      totalSalesCount: filteredSales.length,
      totalPurchasesCount,
      totalProducts: products.length,
      totalClients: clients.length,
      paidSalesAmount: paidSales.reduce((sum, sale) => sum + (sale.totalTTC || 0), 0),
      pendingSalesAmount: pendingSales.reduce((sum, sale) => sum + (sale.totalTTC || 0), 0),
      partialSalesAmount: partialSales.reduce((sum, sale) => sum + (sale.totalTTC || 0), 0),
      paidSalesCount: paidSales.length,
      pendingSalesCount: pendingSales.length,
      partialSalesCount: partialSales.length,
      lowStockProducts: lowStockProductsList,
    };
  };

  const metrics = calculateMetrics();

  // Données pour les graphiques
  const salesData = sales.slice(0, 10).map(sale => ({
    name: sale.clientName,
    value: sale.totalTTC,
    status: sale.paymentStatus
  }));

  const monthlyData = [
    { month: 'Jan', ventes: 12000, achats: 8000, benefice: 4000 },
    { month: 'Fév', ventes: 19000, achats: 12000, benefice: 7000 },
    { month: 'Mar', ventes: 15000, achats: 9000, benefice: 6000 },
    { month: 'Avr', ventes: 22000, achats: 14000, benefice: 8000 },
    { month: 'Mai', ventes: 18000, achats: 11000, benefice: 7000 },
    { month: 'Juin', ventes: 25000, achats: 16000, benefice: 9000 },
  ];

  const paymentStatusData = [
    { 
      name: 'Payé', 
      value: metrics.paidSalesAmount, 
      count: metrics.paidSalesCount,
      color: '#10B981' 
    },
    { 
      name: 'En attente', 
      value: metrics.pendingSalesAmount, 
      count: metrics.pendingSalesCount,
      color: '#F59E0B' 
    },
    { 
      name: 'Partiel', 
      value: metrics.partialSalesAmount, 
      count: metrics.partialSalesCount,
      color: '#3B82F6' 
    },
  ].filter(status => status.value > 0);  // Ne montrer que les statuts qui ont des ventes

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Rapport - ${new Date().toLocaleDateString('fr-TN')}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              
              body { 
                font-family: 'Inter', sans-serif; 
                padding: 2cm; 
                color: #333; 
                line-height: 1.6;
                font-size: 14px;
              }
              .header { 
                text-align: center; 
                margin-bottom: 40px; 
                border-bottom: 3px solid #3b82f6; 
                padding-bottom: 20px; 
              }
              .header h1 { 
                color: #3b82f6; 
                font-size: 32px; 
                margin-bottom: 10px; 
              }
              .metrics-grid { 
                display: grid; 
                grid-template-columns: repeat(2, 1fr); 
                gap: 20px; 
                margin-bottom: 40px; 
              }
              .metric-card { 
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                padding: 20px; 
                border-radius: 10px; 
                border-left: 5px solid #3b82f6; 
              }
              .metric-title { 
                color: #1e40af; 
                font-weight: 600; 
                margin-bottom: 10px; 
              }
              .metric-value { 
                font-size: 24px; 
                font-weight: bold; 
                color: #1e3a8a; 
              }
              .footer { 
                text-align: center; 
                margin-top: 40px; 
                color: #666; 
                font-size: 12px; 
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>RAPPORT FINANCIER</h1>
              <p><strong>Entreprise:</strong> ${settings.name || 'Stock Pro'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-TN')}</p>
              <p><strong>Période:</strong> ${selectedPeriod === 'month' ? 'Ce mois' : selectedPeriod === 'week' ? 'Cette semaine' : selectedPeriod === 'quarter' ? 'Ce trimestre' : 'Cette année'}</p>
            </div>
            
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-title">TOTAL VENTES</div>
                <div class="metric-value">${formatCurrency(metrics.totalSalesAmount)}</div>
                <p>Nombre de ventes: ${metrics.totalSalesCount}</p>
              </div>
              
              <div class="metric-card">
                <div class="metric-title">TOTAL ACHATS</div>
                <div class="metric-value">${formatCurrency(metrics.totalPurchasesAmount)}</div>
                <p>Nombre d'achats: ${metrics.totalPurchasesCount}</p>
              </div>
              
              <div class="metric-card">
                <div class="metric-title">BÉNÉFICE NET</div>
                <div class="metric-value">${formatCurrency(metrics.totalProfit)}</div>
                <p>Marge: ${metrics.profitMargin.toFixed(1)}%</p>
              </div>
              
              <div class="metric-card">
                <div class="metric-title">INVENTAIRE</div>
                <div class="metric-value">${metrics.totalProducts} produits</div>
                <p>Stock faible: ${metrics.lowStockProducts.length}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Rapport généré automatiquement par ${settings.name || 'Stock Pro'}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "Impression en cours",
      description: "Le rapport est en cours d'impression",
    });
  };

  return (
    <div className="content-container">
      <PageHeader title="Rapports et Analytics">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrintReport}
            className="flex items-center gap-2"
          >
            <Printer size={16} />
            Imprimer le rapport
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Ventes</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalSalesAmount)}</div>
            <p className="text-xs text-blue-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metrics.totalSalesCount} ventes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Achats</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPurchasesAmount)}</div>
            <p className="text-xs text-muted-foreground">{metrics.totalPurchasesCount} achats au total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Bénéfice Total</CardTitle>
            <Calculator className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(metrics.totalProfit)}</div>
            <p className="text-xs text-green-600 flex items-center">
              <Target className="h-3 w-3 mr-1" />
              Marge: {metrics.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Stock Faible</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{metrics.lowStockProducts.length}</div>
            <p className="text-xs text-purple-600 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              Sur {metrics.totalProducts} produits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Évolution Mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="ventes" stroke="#3b82f6" strokeWidth={3} name="Ventes" />
                <Line type="monotone" dataKey="achats" stroke="#f59e0b" strokeWidth={3} name="Achats" />
                <Line type="monotone" dataKey="benefice" stroke="#10b981" strokeWidth={3} name="Bénéfice" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Statut des Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, count }) => `${name}: ${formatCurrency(value)} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${formatCurrency(value)} (${props.payload.count} ventes)`,
                    name
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Analyse de rentabilité détaillée */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            Analyse de Rentabilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Chiffre d'Affaires</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalSalesAmount)}</p>
              <p className="text-sm text-blue-600">Revenus totaux des ventes</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-2">Coûts d'Achat</h4>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(metrics.totalPurchasesAmount)}</p>
              <p className="text-sm text-orange-600">Coûts totaux des achats</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Bénéfice Net</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.totalProfit)}</p>
              <p className="text-sm text-green-600">
                Marge bénéficiaire: {metrics.profitMargin > 0 ? '+' : ''}{metrics.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Formule de Calcul:</h5>
            <p className="text-sm text-gray-600">
              <strong>Bénéfice Net</strong> = Chiffre d'Affaires - Coûts d'Achat
            </p>
            <p className="text-sm text-gray-600">
              <strong>Marge Bénéficiaire</strong> = (Bénéfice Net ÷ Chiffre d'Affaires) × 100
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top ventes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Top 10 des Ventes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((sale, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{sale.name}</TableCell>
                  <TableCell className="font-semibold text-green-600">{formatCurrency(sale.value)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      sale.status === 'paid' ? 'default' : 
                      sale.status === 'pending' ? 'secondary' : 'outline'
                    }>
                      {sale.status === 'paid' ? 'Payé' : 
                       sale.status === 'pending' ? 'En attente' : 
                       sale.status === 'partial' ? 'Partiel' : 'Annulé'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date().toLocaleDateString('fr-TN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
