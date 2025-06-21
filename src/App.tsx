import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { ProductsProvider } from '@/hooks/use-products';

import Layout from '@/components/layout/Layout';
import Login from '@/pages/Login';
import Index from '@/pages/Index';
import Products from '@/pages/Products';
import AddProduct from '@/pages/AddProduct';
import EditProduct from '@/pages/EditProduct';
import Clients from '@/pages/Clients';
import AddClient from '@/pages/AddClient';
import EditClient from '@/pages/EditClient';
import ClientDetails from '@/pages/ClientDetails';
import Suppliers from '@/pages/Suppliers';
import AddSupplier from '@/pages/AddSupplier';
import Sales from '@/pages/Sales';
import AddSale from '@/pages/AddSale';
import EditSale from '@/pages/EditSale';
import SaleDetails from '@/pages/SaleDetails';
import Purchases from '@/pages/Purchases';
import AddPurchase from '@/pages/AddPurchase';
import PurchaseOrders from '@/pages/PurchaseOrders';
import AddPurchaseOrder from '@/pages/AddPurchaseOrder';
import DeliveryNotes from '@/pages/DeliveryNotes';
import AddDeliveryNote from '@/pages/AddDeliveryNote';
import Quotes from '@/pages/Quotes';
import AddQuote from '@/pages/AddQuote';
import Payments from '@/pages/Payments';
import Invoices from '@/pages/Invoices';
import Settings from '@/pages/Settings';
import UsersManagement from '@/pages/UsersManagement';
import Reports from '@/pages/Reports';
import NotFound from '@/pages/NotFound';
import './App.css';
import { Toaster } from './components/ui/toaster';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useUser();
  
  // Skip authentication check if running on Vercel
  if (import.meta.env.PROD) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PermissionRoute = ({ children, permission }: { children: React.ReactNode; permission?: string; }) => {
  const { hasPermission } = useUser();
  
  // Skip permission check if running on Vercel
  if (import.meta.env.PROD) {
    return <>{children}</>;
  }

  if (permission && !hasPermission(permission as any)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  // If on Vercel (production), redirect /login to dashboard
  if (import.meta.env.PROD) {
    return (
      <ProductsProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              {/* Rest of your routes without authentication checks */}
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={<EditProduct />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/add" element={<AddClient />} />
              <Route path="clients/edit/:id" element={<EditClient />} />
              <Route path="clients/details/:id" element={<ClientDetails />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="suppliers/add" element={<AddSupplier />} />
              <Route path="sales" element={<Sales />} />
              <Route path="sales/add" element={<AddSale />} />
              <Route path="sales/edit/:id" element={<EditSale />} />
              <Route path="sales/:id" element={<SaleDetails />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="purchases/add" element={<AddPurchase />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="purchase-orders/add" element={<AddPurchaseOrder />} />
              <Route path="delivery-notes" element={<DeliveryNotes />} />
              <Route path="delivery-notes/add" element={<AddDeliveryNote />} />
              <Route path="quotes" element={<Quotes />} />
              <Route path="quotes/add" element={<AddQuote />} />
              <Route path="payments" element={<Payments />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </ProductsProvider>
    );
  }

  // Regular routing with authentication for development
  return (
    <ProductsProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected app routes at root level */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Index />} />
            
            {/* Products routes */}
            <Route path="products" element={
              <PermissionRoute permission="canAccessProducts">
                <Products />
              </PermissionRoute>
            } />
            <Route path="products/add" element={
              <PermissionRoute permission="canAccessProducts">
                <AddProduct />
              </PermissionRoute>
            } />
            <Route path="products/edit/:id" element={
              <PermissionRoute permission="canAccessProducts">
                <EditProduct />
              </PermissionRoute>
            } />
            
            {/* Clients routes */}
            <Route path="clients" element={
              <PermissionRoute permission="canAccessClients">
                <Clients />
              </PermissionRoute>
            } />
            <Route path="clients/add" element={
              <PermissionRoute permission="canAccessClients">
                <AddClient />
              </PermissionRoute>
            } />
            <Route path="clients/edit/:id" element={
              <PermissionRoute permission="canAccessClients">
                <EditClient />
              </PermissionRoute>
            } />
            <Route path="clients/details/:id" element={
              <PermissionRoute permission="canAccessClients">
                <ClientDetails />
              </PermissionRoute>
            } />
            
            {/* Suppliers routes - Accessible à tous */}
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/add" element={<AddSupplier />} />
            
            {/* Sales routes */}
            <Route path="sales" element={
              <PermissionRoute permission="canAccessSales">
                <Sales />
              </PermissionRoute>
            } />
            <Route path="sales/add" element={
              <PermissionRoute permission="canAccessSales">
                <AddSale />
              </PermissionRoute>
            } />
            <Route path="sales/edit/:id" element={
              <PermissionRoute permission="canAccessSales">
                <EditSale />
              </PermissionRoute>
            } />
            <Route path="sales/:id" element={
              <PermissionRoute permission="canAccessSales">
                <SaleDetails />
              </PermissionRoute>
            } />
            
            {/* Purchases routes */}
            <Route path="purchases" element={
              <PermissionRoute permission="canAccessPurchases">
                <Purchases />
              </PermissionRoute>
            } />
            <Route path="purchases/add" element={
              <PermissionRoute permission="canAccessPurchases">
                <AddPurchase />
              </PermissionRoute>
            } />
            
            {/* Purchase Orders routes - Accessible à tous */}
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="purchase-orders/add" element={<AddPurchaseOrder />} />
            
            {/* Delivery Notes routes - Accessible à tous */}
            <Route path="delivery-notes" element={<DeliveryNotes />} />
            <Route path="delivery-notes/add" element={<AddDeliveryNote />} />
            
            {/* Quotes routes - Accessible à tous */}
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/add" element={<AddQuote />} />
            
            {/* Other sales-related routes */}
            <Route path="payments" element={
              <PermissionRoute permission="canAccessSales">
                <Payments />
              </PermissionRoute>
            } />
            <Route path="invoices" element={
              <PermissionRoute permission="canAccessSales">
                <Invoices />
              </PermissionRoute>
            } />
            
            {/* Admin routes */}
            <Route path="reports" element={
              <PermissionRoute permission="canViewReports">
                <Reports />
              </PermissionRoute>
            } />
            <Route path="users" element={
              <PermissionRoute permission="canManageUsers">
                <UsersManagement />
              </PermissionRoute>
            } />
            <Route path="settings" element={
              <PermissionRoute permission="canChangeSettings">
                <Settings />
              </PermissionRoute>
            } />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </ProductsProvider>
  );
}

export default App;
