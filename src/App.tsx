import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

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

function App() {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Index />} />
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
  );
}

export default App;
