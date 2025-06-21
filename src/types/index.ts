export interface Product {
  id: string;
  name: string;
  reference?: string;
  description?: string;
  barcode?: string;
  category?: string;
  supplier?: string;
  quantity: number;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  vatRate: number;
  reorderLevel?: number;
  imageUrl?: string;
  createdAt: Date;
  active?: boolean;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount?: number;
  total: number;
}

export type PaymentStatus = "paid" | "pending" | "partial" | "canceled";

export interface Sale {
  id: string;
  invoiceNumber?: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientFiscalId?: string;
  items: SaleItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  amountPaid?: number;
  fodec?: number;
  timbreFiscal?: number;
  discount?: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  date: Date;
  checkNumber?: string;
  transferNumber?: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  reference: string;
  supplier: string;
  status: "completed" | "pending" | "canceled";
  items: PurchaseItem[];
  total: number;
  notes?: string;
  date: Date;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logoUrl: string;
  currency: string;
  lowStockThreshold: number;
  enableLowStockAlert: boolean;
  invoiceCounter: number;
  companyName: string;
  taxNumber: string;
  bankAccount: string;
  rib: string;
  bankName: string;
  bankRib: string;
  directPrint?: boolean;
}

export interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface Quote {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  items: QuoteItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  validUntil: Date;
  status: "pending" | "accepted" | "rejected" | "expired";
  date: Date;
  fodec?: number;
  timbreFiscal?: number;
}

// User roles
export type UserRole = 'admin' | 'employee' | 'manager';

// User permissions - simplified
export interface UserPermissions {
  canAccessClients: boolean;
  canAccessProducts: boolean;
  canAccessSales: boolean;
  canAccessPurchases: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canChangeSettings: boolean;
}

// User type
export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  passwordHash: string; // Added passwordHash field
  tempPassword?: string; // Optional for temporary passwords
  tempPasswordExpiry?: Date; // Optional for temp password expiry
  role: UserRole;
  permissions: UserPermissions;
  lastLogin?: Date;
  active: boolean;
  createdAt: Date;
}

// Update CompanySettingsContextType to include availableCurrencies
export type CompanySettingsContextType = {
  settings: CompanySettings;
  updateSettings: (newSettings: CompanySettings) => void;
  availableCurrencies: { code: string; name: string; }[];
};

// Stock Movement type
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment';
  source: 'sale' | 'purchase' | 'return' | 'manual' | 'inventory';
  reference?: string;
  date: Date;
  notes?: string;
}

// User context type
export interface UserContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  createUser: (user: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<User>;
  updateUser: (userId: string, userData: Partial<User> & { newPassword?: string }) => Promise<User | null>;
  deleteUser: (userId: string) => Promise<boolean>;
  resetPassword: (userId: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isProcessing: boolean;
  validatePassword: (password: string) => { isValid: boolean; message?: string };
  checkPasswordStrength: (password: string) => { score: number; feedback: string };
  getRolePermissions: (role: UserRole) => UserPermissions;
}

// Add the missing Client interface
export interface Client {
  id: string;
  name: string;
  fiscalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  company?: string;
  siret?: string;
  fax?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt: Date;
}

// Add the missing Payment interface
export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  date: Date;
  reference?: string;
}

// Updated DeliveryNote interface with missing properties
export interface DeliveryNote {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  saleId?: string;
  saleReference?: string;
  items: QuoteItem[];
  total: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  status: DeliveryStatus;
  notes?: string;
  date: Date;
  deliveryAddress?: string;
  deliveryDelay?: string;
  fodec?: number;
  timbreFiscal?: number;
}

// Add the missing DeliveryStatus type
export type DeliveryStatus = "pending" | "delivered" | "canceled";

// Updated PurchaseOrder interface with fodec and timbreFiscal
export interface PurchaseOrder {
  id: string;
  reference: string;
  supplier: string;
  status: OrderStatus;
  items: PurchaseItem[];
  total: number;
  notes?: string;
  date: Date;
  deliveryAddress?: string;
  deliveryDelay?: string;
  fodec?: number;
  timbreFiscal?: number;
}

// Add the missing OrderStatus type
export type OrderStatus = "pending" | "received" | "canceled";

// Add the missing Supplier interface
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
}
