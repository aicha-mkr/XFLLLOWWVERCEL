-- Schéma de base de données SQLite pour l'application StockPro

-- Structure de la table users (utilisateurs)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  fullName TEXT,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'manager')),
  lastLogin TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL
);

-- Structure de la table user_permissions (permissions des utilisateurs)
CREATE TABLE IF NOT EXISTS user_permissions (
  userId TEXT NOT NULL,
  canViewClients INTEGER NOT NULL DEFAULT 0,
  canCreateClients INTEGER NOT NULL DEFAULT 0,
  canEditClients INTEGER NOT NULL DEFAULT 0,
  canDeleteClients INTEGER NOT NULL DEFAULT 0,
  canViewProducts INTEGER NOT NULL DEFAULT 0,
  canCreateProducts INTEGER NOT NULL DEFAULT 0,
  canEditProducts INTEGER NOT NULL DEFAULT 0,
  canDeleteProducts INTEGER NOT NULL DEFAULT 0,
  canViewSales INTEGER NOT NULL DEFAULT 0,
  canCreateSales INTEGER NOT NULL DEFAULT 0,
  canEditSales INTEGER NOT NULL DEFAULT 0,
  canDeleteSales INTEGER NOT NULL DEFAULT 0,
  canViewPurchases INTEGER NOT NULL DEFAULT 0,
  canCreatePurchases INTEGER NOT NULL DEFAULT 0,
  canEditPurchases INTEGER NOT NULL DEFAULT 0,
  canDeletePurchases INTEGER NOT NULL DEFAULT 0,
  canViewReports INTEGER NOT NULL DEFAULT 0,
  canManageUsers INTEGER NOT NULL DEFAULT 0,
  canChangeSettings INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (userId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Structure de la table products (produits)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reference TEXT UNIQUE,
  description TEXT,
  barcode TEXT,
  category TEXT,
  supplier TEXT,
  quantity REAL NOT NULL DEFAULT 0,
  purchasePrice REAL,
  sellingPrice REAL,
  vatRate REAL,
  reorderLevel REAL,
  imageUrl TEXT,
  createdAt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

-- Structure de la table clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fiscalId TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL
);

-- Structure de la table sales (ventes)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoiceNumber TEXT UNIQUE NOT NULL,
  clientId TEXT NOT NULL,
  clientName TEXT NOT NULL,
  totalHT REAL NOT NULL,
  totalTVA REAL NOT NULL,
  totalTTC REAL NOT NULL,
  paymentMethod TEXT NOT NULL,
  paymentStatus TEXT CHECK(paymentStatus IN ('paid', 'pending', 'partial', 'canceled')),
  date TEXT NOT NULL,
  FOREIGN KEY (clientId) REFERENCES clients(id)
);

-- Structure de la table sale_items (articles vendus)
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  saleId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity REAL NOT NULL,
  unitPrice REAL NOT NULL,
  vatRate REAL NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Structure de la table payments (paiements)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  saleId TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
);

-- Structure de la table purchases (achats)
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  supplier TEXT NOT NULL,
  status TEXT CHECK(status IN ('completed', 'pending', 'canceled')),
  total REAL NOT NULL,
  notes TEXT,
  date TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]'
);

-- Structure de la table purchase_items (articles achetés)
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchaseId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity REAL NOT NULL,
  unitPrice REAL NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (purchaseId) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Structure de la table quotes (devis)
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  clientId TEXT NOT NULL,
  clientName TEXT NOT NULL,
  totalHT REAL NOT NULL,
  totalTVA REAL NOT NULL,
  totalTTC REAL NOT NULL,
  validUntil TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'accepted', 'rejected', 'expired', 'facture')) DEFAULT 'pending',
  date TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]'
);

-- Structure de la table delivery_notes (bons de livraison)
CREATE TABLE IF NOT EXISTS delivery_notes (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  clientId TEXT NOT NULL,
  clientName TEXT NOT NULL,
  clientAddress TEXT,
  saleId TEXT,
  saleReference TEXT,
  total REAL NOT NULL,
  status TEXT CHECK(status IN ('pending', 'delivered', 'canceled')) DEFAULT 'pending',
  notes TEXT,
  date TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]'
);

-- Structure de la table purchase_orders (commandes d'achat)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  supplier TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'received', 'canceled')),
  items TEXT NOT NULL,
  total REAL NOT NULL,
  notes TEXT,
  date TEXT NOT NULL
);

-- Structure de la table company_settings (paramètres de l'entreprise)
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT NOT NULL,
  taxId TEXT NOT NULL,
  logoUrl TEXT NOT NULL,
  currency TEXT NOT NULL,
  lowStockThreshold REAL NOT NULL,
  enableLowStockAlert INTEGER NOT NULL,
  bankName TEXT,
  bankRib TEXT,
  invoiceCounter INTEGER NOT NULL DEFAULT 1
);

-- Structure de la table stock_movements (mouvements de stock)
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity REAL NOT NULL,
  type TEXT CHECK(type IN ('in', 'out', 'adjustment')),
  source TEXT CHECK(source IN ('sale', 'purchase', 'return', 'manual', 'inventory')),
  reference TEXT,
  date TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (productId) REFERENCES products(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(clientId);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoiceNumber);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(productId);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(clientId);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_date ON delivery_notes(date);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_client ON delivery_notes(clientId);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier);
