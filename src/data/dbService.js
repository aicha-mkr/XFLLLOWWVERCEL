/**
 * Service de base de données pour l'intégration avec SQLite (Electron) ou localStorage (Web)
 */
class DatabaseService {
  constructor() {
    this.isElectron = !!(window?.electronAPI);
    console.info(this.isElectron ? 'Mode Electron: Utilisation de SQLite3 avec l\'API native.' : 'Mode Web: Utilisation du localStorage.');
    this.ready = false;
    this.initPromise = null;
    
    // Initialize default admin in web mode if no users exist
    if (!this.isElectron) {
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
        users.push(defaultAdmin);
        this._saveToStorage('users', users);
      }
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

  // Méthodes pour les devis
  async getQuotes() {
    try {
      console.log('Loading quotes...');
      if (this.isElectron) {
        const quotes = await window.electronAPI.dbQuery('SELECT * FROM quotes ORDER BY date DESC');
        return quotes.map(quote => ({
          ...quote,
          date: new Date(quote.date),
          validUntil: new Date(quote.validUntil),
          items: typeof quote.items === 'string' && quote.items.trim().startsWith('[') ? JSON.parse(quote.items) : []
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

  async createQuote(quoteData) {
    try {
      console.log('Creating quote:', quoteData);
      const id = quoteData.id || Math.random().toString(36).substring(2, 9);
      const newQuote = { ...quoteData, id };
      
      if (this.isElectron) {
        await window.electronAPI.dbRun(
          `INSERT INTO quotes (
            id, reference, clientId, clientName, totalHT, totalTVA, totalTTC, 
            validUntil, status, date, items
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            quoteData.reference,
            quoteData.clientId,
            quoteData.clientName,
            quoteData.totalHT,
            quoteData.totalTVA,
            quoteData.totalTTC,
            quoteData.validUntil.toISOString(),
            quoteData.status,
            quoteData.date.toISOString(),
            JSON.stringify(quoteData.items || [])
          ]
        );
      } else {
        const quotes = this._getFromStorage('quotes', []);
        quotes.push(newQuote);
        this._saveToStorage('quotes', quotes);
      }
      
      return newQuote;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  // Add similar web storage handling for all other methods...
  
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

  async createProduct(productData) {
    try {
      const id = productData.id || Math.random().toString(36).substring(2, 9);
      const newProduct = { ...productData, id };
      
      if (this.isElectron) {
        await window.electronAPI.dbRun(
          `INSERT INTO products (
            id, name, description, reference, category, purchasePrice, sellingPrice,
            stock, minStock, maxStock, unit, barcode, supplier, location, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            productData.name,
            productData.description || '',
            productData.reference || '',
            productData.category || '',
            productData.purchasePrice || 0,
            productData.sellingPrice || 0,
            productData.stock || 0,
            productData.minStock || 0,
            productData.maxStock || 0,
            productData.unit || '',
            productData.barcode || '',
            productData.supplier || '',
            productData.location || '',
            productData.notes || ''
          ]
        );
      } else {
        const products = this._getFromStorage('products', []);
        products.push(newProduct);
        this._saveToStorage('products', products);
      }
      
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Users
  async getUsers() {
    try {
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

  async createUser(userData) {
    try {
      const id = userData.id || Math.random().toString(36).substring(2, 9);
      const newUser = { ...userData, id };
      
      if (this.isElectron) {
        await window.electronAPI.dbRun(
          'INSERT INTO users (id, username, email, passwordHash, role, active) VALUES (?, ?, ?, ?, ?, ?)',
          [id, userData.username, userData.email, userData.passwordHash, userData.role, userData.active]
        );
      } else {
        const users = this._getFromStorage('users', []);
        users.push(newUser);
        this._saveToStorage('users', users);
      }
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Add similar implementations for other methods...
}

// Export a singleton instance
export default new DatabaseService();
