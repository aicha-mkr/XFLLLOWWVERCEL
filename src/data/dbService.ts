/**
 * Service de base de données pour l'intégration avec SQLite (Electron) ou localStorage (Web)
 */
export class DatabaseService {
  private isElectron: boolean;
  private ready: boolean;
  private initPromise: Promise<void> | null;

  constructor() {
    // Fix environment detection
    this.isElectron = typeof window !== 'undefined' && window?.electronAPI?.dbQuery !== undefined;
    console.info(this.isElectron ? 'Mode Electron: Utilisation de SQLite3 avec l\'API native.' : 'Mode Web: Utilisation du localStorage.');
    this.ready = false;
    this.initPromise = null;
    
    // Initialize default data in web mode if not exists
    if (!this.isElectron) {
      // Initialize users with default admin
      const users = this._getFromStorage('users', []);
      if (users.length === 0) {
        const defaultAdmin = {
          id: 'admin-1',
          username: 'admin',
          email: 'admin@stockpro.com',
          fullName: 'Administrateur',
          // Pre-hashed password for "Admin123!"
          passwordHash: "$2a$10$XQxkZH1.7SmPv6ZQ.qRZZOyYzCv6.sYvVS.OJGF9GBi3YQjFXmk7y",
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString()
        };
        this._saveToStorage('users', [defaultAdmin]);
      }

      // Initialize other collections
      if (!this._getFromStorage('products', null)) this._saveToStorage('products', []);
      if (!this._getFromStorage('sales', null)) this._saveToStorage('sales', []);
      if (!this._getFromStorage('purchases', null)) this._saveToStorage('purchases', []);
      if (!this._getFromStorage('clients', null)) this._saveToStorage('clients', []);
      if (!this._getFromStorage('suppliers', null)) this._saveToStorage('suppliers', []);
      if (!this._getFromStorage('quotes', null)) this._saveToStorage('quotes', []);
      if (!this._getFromStorage('delivery_notes', null)) this._saveToStorage('delivery_notes', []);
      if (!this._getFromStorage('purchase_orders', null)) this._saveToStorage('purchase_orders', []);
    }
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = new Promise((resolve) => {
      console.log(this.isElectron ? "Initialisation du service de base de données Electron SQLite3" : "Initialisation du service de base de données Web");
      this.ready = true;
      resolve();
    });
    
    return this.initPromise;
  }

  // Helper methods for web storage
  _getFromStorage(key, defaultValue = []) {
    if (!this.isElectron) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
      } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return defaultValue;
      }
    }
    return defaultValue;
  }

  _saveToStorage(key, data) {
    if (!this.isElectron) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }
  }

  // Products
  async getProducts() {
    try {
      console.log('Loading products...');
      if (this.isElectron) {
        return await window.electronAPI.dbQuery('SELECT * FROM products');
      } else {
        return this._getFromStorage('products', []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  // Sales
  async getSales() {
    try {
      console.log('Loading sales...');
      if (this.isElectron) {
        const sales = await window.electronAPI.dbQuery('SELECT * FROM sales ORDER BY date DESC');
        return sales.map(sale => ({
          ...sale,
          date: new Date(sale.date),
          items: typeof sale.items === 'string' ? JSON.parse(sale.items) : []
        }));
      } else {
        return this._getFromStorage('sales', []).map(sale => ({
          ...sale,
          date: new Date(sale.date)
        }));
      }
    } catch (error) {
      console.error('Error loading sales:', error);
      return [];
    }
  }

  // Purchases
  async getPurchases() {
    try {
      console.log('Loading purchases...');
      if (this.isElectron) {
        const purchases = await window.electronAPI.dbQuery('SELECT * FROM purchases');
        return purchases.map(p => ({
          ...p,
          date: new Date(p.date),
          items: p.items ? JSON.parse(p.items) : []
        }));
      } else {
        return this._getFromStorage('purchases', []).map(p => ({
          ...p,
          date: new Date(p.date)
        }));
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      return [];
    }
  }

  // Clients
  async getClients() {
    try {
      console.log('Loading clients...');
      if (this.isElectron) {
        return await window.electronAPI.dbQuery('SELECT * FROM clients');
      } else {
        return this._getFromStorage('clients', []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  }

  // Purchase Orders
  async getPurchaseOrders() {
    try {
      console.log('Loading purchase orders...');
      if (this.isElectron) {
        const orders = await window.electronAPI.dbQuery('SELECT * FROM purchase_orders ORDER BY date DESC');
        return orders.map(order => ({
          ...order,
          date: new Date(order.date),
          items: typeof order.items === 'string' ? JSON.parse(order.items) : []
        }));
      } else {
        return this._getFromStorage('purchase_orders', []).map(order => ({
          ...order,
          date: new Date(order.date)
        }));
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      return [];
    }
  }

  // Delivery Notes
  async getDeliveryNotes() {
    try {
      console.log('Loading delivery notes...');
      if (this.isElectron) {
        const notes = await window.electronAPI.dbQuery('SELECT * FROM delivery_notes ORDER BY date DESC');
        return notes.map(note => ({
          ...note,
          date: new Date(note.date),
          items: typeof note.items === 'string' ? JSON.parse(note.items) : []
        }));
      } else {
        return this._getFromStorage('delivery_notes', []).map(note => ({
          ...note,
          date: new Date(note.date)
        }));
      }
    } catch (error) {
      console.error('Error loading delivery notes:', error);
      return [];
    }
  }

  // Quotes
  async getQuotes() {
    try {
      console.log('Loading quotes...');
      if (this.isElectron) {
        const quotes = await window.electronAPI.dbQuery('SELECT * FROM quotes ORDER BY date DESC');
        return quotes.map(quote => ({
          ...quote,
          date: new Date(quote.date),
          validUntil: new Date(quote.validUntil),
          items: typeof quote.items === 'string' ? JSON.parse(quote.items) : []
        }));
      } else {
        return this._getFromStorage('quotes', []).map(quote => ({
          ...quote,
          date: new Date(quote.date),
          validUntil: new Date(quote.validUntil)
        }));
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      return [];
    }
  }

  // Users
  async getUsers() {
    try {
      console.log('Loading users...');
      if (this.isElectron) {
        return await window.electronAPI.dbQuery('SELECT * FROM users');
      } else {
        return this._getFromStorage('users', []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  async getUserByUsername(username) {
    try {
      console.log('Finding user by username:', username);
      if (this.isElectron) {
        return await window.electronAPI.dbGet('SELECT * FROM users WHERE username = ?', [username]);
      } else {
        const users = this._getFromStorage('users', []);
        return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
      }
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const dbService = new DatabaseService();
