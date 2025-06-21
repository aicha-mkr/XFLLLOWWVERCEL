import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
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
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        <Route path="/" element={<Layout />}>
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
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
