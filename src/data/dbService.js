/**
 * Service de base de données pour l'intégration avec SQLite (Electron)
 */
class DatabaseService {
  constructor() {
    console.info('Mode Electron: Utilisation de SQLite3 avec l\'API native.');
    this.ready = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = new Promise((resolve) => {
      console.log("Initialisation du service de base de données Electron SQLite3");
      this.ready = true;
      resolve();
    });
    
    return this.initPromise;
  }

  // Méthodes pour les devis (SQLite)
  async getQuotes() {
    try {
      console.log('Loading quotes from SQLite...');
      const quotes = await window.electronAPI.dbQuery('SELECT * FROM quotes ORDER BY date DESC');
      console.log('Raw quotes from DB:', quotes);
      
      return quotes.map(quote => ({
        ...quote,
        date: new Date(quote.date),
        validUntil: new Date(quote.validUntil),
        items: typeof quote.items === 'string' && quote.items.trim().startsWith('[') ? JSON.parse(quote.items) : []
      }));
    } catch (error) {
      console.error('Error loading quotes from SQLite:', error);
      return [];
    }
  }

  async createQuote(quoteData) {
    try {
      console.log('Creating quote in SQLite:', quoteData);
      const id = quoteData.id || Math.random().toString(36).substring(2, 9);
      
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
      
      console.log('Quote created successfully with ID:', id);
      return { ...quoteData, id };
    } catch (error) {
      console.error('Error creating quote in SQLite:', error);
      throw error;
    }
  }

  async updateQuote(quoteId, quoteData) {
    try {
      console.log('Updating quote in SQLite:', quoteId, quoteData);
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(quoteData).forEach(key => {
        if (key !== 'id') {
          updateFields.push(`${key} = ?`);
          if (key === 'items') {
            updateValues.push(JSON.stringify(quoteData[key]));
          } else if (key === 'date' || key === 'validUntil') {
            updateValues.push(quoteData[key] instanceof Date ? quoteData[key].toISOString() : quoteData[key]);
          } else {
            updateValues.push(quoteData[key]);
          }
        }
      });
      
      updateValues.push(quoteId);
      
      await window.electronAPI.dbRun(
        `UPDATE quotes SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      console.log('Quote updated successfully');
      return { ...quoteData, id: quoteId };
    } catch (error) {
      console.error('Error updating quote in SQLite:', error);
      throw error;
    }
  }

  async deleteQuote(quoteId) {
    try {
      console.log('Deleting quote from SQLite:', quoteId);
      await window.electronAPI.dbRun('DELETE FROM quotes WHERE id = ?', [quoteId]);
      console.log('Quote deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting quote from SQLite:', error);
      throw error;
    }
  }

  // Méthodes pour les bons de livraison (SQLite)
  async getDeliveryNotes() {
    try {
      console.log('Loading delivery notes from SQLite...');
      const notes = await window.electronAPI.dbQuery('SELECT * FROM delivery_notes ORDER BY date DESC');
      console.log('Raw delivery notes from DB:', notes);
      
      return notes.map(note => ({
        ...note,
        date: new Date(note.date),
        items: typeof note.items === 'string' && note.items.trim().startsWith('[') ? JSON.parse(note.items) : []
      }));
    } catch (error) {
      console.error('Error loading delivery notes from SQLite:', error);
      return [];
    }
  }

  async createDeliveryNote(noteData) {
    try {
      console.log('Creating delivery note in SQLite:', noteData);
      const id = noteData.id || Math.random().toString(36).substring(2, 9);
      
      await window.electronAPI.dbRun(
        `INSERT INTO delivery_notes (
          id, reference, clientId, clientName, clientAddress, saleId, saleReference,
          total, status, notes, date, items
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          noteData.reference,
          noteData.clientId,
          noteData.clientName,
          noteData.clientAddress || '',
          noteData.saleId || null,
          noteData.saleReference || '',
          noteData.total,
          noteData.status,
          noteData.notes || '',
          noteData.date.toISOString(),
          JSON.stringify(noteData.items || [])
        ]
      );
      
      console.log('Delivery note created successfully with ID:', id);
      return { ...noteData, id };
    } catch (error) {
      console.error('Error creating delivery note in SQLite:', error);
      throw error;
    }
  }

  async updateDeliveryNote(noteId, noteData) {
    try {
      console.log('Updating delivery note in SQLite:', noteId, noteData);
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(noteData).forEach(key => {
        if (key !== 'id') {
          updateFields.push(`${key} = ?`);
          if (key === 'items') {
            updateValues.push(JSON.stringify(noteData[key]));
          } else if (key === 'date') {
            updateValues.push(noteData[key] instanceof Date ? noteData[key].toISOString() : noteData[key]);
          } else {
            updateValues.push(noteData[key]);
          }
        }
      });
      
      updateValues.push(noteId);
      
      await window.electronAPI.dbRun(
        `UPDATE delivery_notes SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      console.log('Delivery note updated successfully');
      return { ...noteData, id: noteId };
    } catch (error) {
      console.error('Error updating delivery note in SQLite:', error);
      throw error;
    }
  }

  async deleteDeliveryNote(noteId) {
    try {
      console.log('Deleting delivery note from SQLite:', noteId);
      await window.electronAPI.dbRun('DELETE FROM delivery_notes WHERE id = ?', [noteId]);
      console.log('Delivery note deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting delivery note from SQLite:', error);
      throw error;
    }
  }

  // Méthodes pour les bons de commande (SQLite)
  async getPurchaseOrders() {
    try {
      console.log('Loading purchase orders from SQLite...');
      const orders = await window.electronAPI.dbQuery('SELECT * FROM purchase_orders ORDER BY date DESC');
      console.log('Raw purchase orders from DB:', orders);
      
      return orders.map(order => ({
        ...order,
        date: new Date(order.date),
        items: typeof order.items === 'string' && order.items.trim().startsWith('[') ? JSON.parse(order.items) : []
      }));
    } catch (error) {
      console.error('Error loading purchase orders from SQLite:', error);
      return [];
    }
  }

  async createPurchaseOrder(orderData) {
    try {
      console.log('Creating purchase order in SQLite:', orderData);
      const id = orderData.id || `po-${Date.now()}`;
      
      const sql = `INSERT INTO purchase_orders (
        id, reference, supplier, total, status, notes, date, items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        id,
        orderData.reference,
        orderData.supplier,
        orderData.total,
        orderData.status,
        orderData.notes || '',
        orderData.date.toISOString(),
        JSON.stringify(orderData.items || [])
      ];
      
      await window.electronAPI.dbRun(sql, params);
      
      console.log('Purchase order created successfully with ID:', id);
      return { ...orderData, id };
    } catch (error) {
      console.error('Error creating purchase order in SQLite:', error);
      throw error;
    }
  }

  async updatePurchaseOrder(orderId, orderData) {
    try {
      console.log('Updating purchase order in SQLite:', orderId, orderData);
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(orderData).forEach(key => {
        if (key !== 'id') {
          updateFields.push(`${key} = ?`);
          if (key === 'items') {
            updateValues.push(JSON.stringify(orderData[key]));
          } else if (key === 'date') {
            updateValues.push(orderData[key] instanceof Date ? orderData[key].toISOString() : orderData[key]);
          } else {
            updateValues.push(orderData[key]);
          }
        }
      });
      
      updateValues.push(orderId);
      
      await window.electronAPI.dbRun(
        `UPDATE purchase_orders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      console.log('Purchase order updated successfully');
      return { ...orderData, id: orderId };
    } catch (error) {
      console.error('Error updating purchase order in SQLite:', error);
      throw error;
    }
  }

  async deletePurchaseOrder(orderId) {
    try {
      console.log('Deleting purchase order from SQLite:', orderId);
      await window.electronAPI.dbRun('DELETE FROM purchase_orders WHERE id = ?', [orderId]);
      console.log('Purchase order deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting purchase order from SQLite:', error);
      throw error;
    }
  }
  
  // Méthodes pour les achats (SQLite)
  async getPurchases() {
    const purchases = await window.electronAPI.dbQuery('SELECT * FROM purchases');
    return purchases.map(p => ({ 
      ...p, 
      date: new Date(p.date), 
      items: p.items ? JSON.parse(p.items) : [],
      total: parseFloat(p.total) || 0
    }));
  }

  async addPurchase(purchase) {
    await window.electronAPI.dbRun('INSERT INTO purchases (id, reference, supplier, status, items, total, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      purchase.id,
      purchase.reference,
      purchase.supplier,
      purchase.status,
      JSON.stringify(purchase.items),
      purchase.total,
      purchase.notes,
      purchase.date.toISOString()
    ]);
  }

  async deletePurchase(purchaseId) {
    try {
      console.log('Deleting purchase from SQLite:', purchaseId);
      await window.electronAPI.dbRun('DELETE FROM purchases WHERE id = ?', [purchaseId]);
      console.log('Purchase deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting purchase from SQLite:', error);
      throw error;
    }
  }

  // Méthodes pour les produits (SQLite)
  async getProducts(forceRefresh = false) {
    try {
      console.log('Loading products from SQLite...');
      const productsFromDb = await window.electronAPI.dbQuery('SELECT * FROM products ORDER BY name ASC');
      
      // Mapper 'quantity' vers 'stock' pour la cohérence du front-end
      const products = productsFromDb.map(p => ({
        ...p,
        stock: p.quantity,
      }));

      if (forceRefresh) {
        window.dispatchEvent(new CustomEvent('products-refreshed', { detail: products }));
      }
      
      return products;
    } catch (error) {
      console.error('Error loading products from SQLite:', error);
      return [];
    }
  }

  async getProductById(id) {
    try {
      console.log('Loading product by ID from SQLite:', id);
      const product = await window.electronAPI.dbGet('SELECT * FROM products WHERE id = ?', [id]);
      if (!product) return null;

      // Mapper 'quantity' vers 'stock' pour la cohérence
      return {
        ...product,
        stock: product.quantity,
      };
    } catch (error) {
      console.error(`Error loading product ${id} from SQLite:`, error);
      throw error;
    }
  }

  async createProduct(productData) {
    const id = productData.id || `prod-${Date.now()}`;
    const newProduct = {
      ...productData,
      id,
      createdAt: new Date().toISOString(),
      active: 1
    };

    await window.electronAPI.dbRun(
      `INSERT INTO products (
        id, name, reference, description, barcode, category, supplier, 
        quantity, purchasePrice, sellingPrice, vatRate, reorderLevel, 
        imageUrl, createdAt, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newProduct.id,
        newProduct.name,
        newProduct.reference,
        newProduct.description,
        newProduct.barcode,
        newProduct.category,
        newProduct.supplier,
        newProduct.quantity,
        newProduct.purchasePrice,
        newProduct.sellingPrice,
        newProduct.vatRate,
        newProduct.reorderLevel,
        newProduct.imageUrl,
        newProduct.createdAt,
        newProduct.active
      ]
    );
    return newProduct;
  }

  async updateProduct(productId, productData) {
    try {
      console.log('Updating product in SQLite:', productId, productData);
      
      const dataToUpdate = { ...productData };
      
      // Handle stock/quantity synchronization
      if (dataToUpdate.stock !== undefined) {
        dataToUpdate.quantity = dataToUpdate.stock;
        delete dataToUpdate.stock;
      } else if (dataToUpdate.quantity !== undefined) {
        dataToUpdate.stock = dataToUpdate.quantity;
      }

      const updateFields = Object.keys(dataToUpdate)
        .filter(key => key !== 'id' && key !== 'createdAt')
        .map(key => `${key} = ?`);
        
      const updateValues = updateFields.map(field => {
        const key = field.split(' = ')[0];
        const value = dataToUpdate[key];
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      
      if (updateFields.length === 0) {
        console.log("No fields to update for product:", productId);
        return { id: productId, ...productData };
      }

      updateValues.push(productId);
      
      const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
      console.log('Update SQL:', sql);
      console.log('Update values:', updateValues);
      
      await window.electronAPI.dbRun(sql, updateValues);
      
      console.log('Product updated successfully in DB:', productId);
      
      // Trigger a refresh event
      const updatedProducts = await this.getProducts(true);
      
      return { id: productId, ...productData };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      console.log('Deleting product from SQLite:', productId);
      await window.electronAPI.dbRun('DELETE FROM products WHERE id = ?', [productId]);
      console.log('Product deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting product from SQLite:', error);
      throw error;
    }
  }

  // Méthodes pour les fournisseurs (Suppliers)
  async getSuppliers() {
    return window.electronAPI.dbQuery('SELECT * FROM suppliers ORDER BY name ASC');
  }

  async createSupplier(supplierData) {
    const id = supplierData.id || `sup-${Date.now()}`;
    const newSupplier = { ...supplierData, id };
    await window.electronAPI.dbRun(
      `INSERT INTO suppliers (id, name, contact, phone, email, address, fiscalId, bankRib, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newSupplier.id,
        newSupplier.name,
        newSupplier.contact,
        newSupplier.phone,
        newSupplier.email,
        newSupplier.address,
        newSupplier.fiscalId,
        newSupplier.bankRib,
        newSupplier.notes,
        newSupplier.createdAt.toISOString()
      ]
    );
    return newSupplier;
  }

  async getClients() {
    return window.electronAPI.dbQuery('SELECT * FROM clients');
  }

  async createClient(clientData) {
    const id = clientData.id || `cli-${Date.now()}`;
    await window.electronAPI.dbRun(
      'INSERT INTO clients (id, name, email, phone, address, type) VALUES (?, ?, ?, ?, ?, ?)',
      [id, clientData.name, clientData.email, clientData.phone, clientData.address, clientData.type]
    );
    return { ...clientData, id };
  }

  async updateClient(clientId, clientData) {
     const updateFields = Object.keys(clientData).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
    const updateValues = Object.values(clientData).filter(v => typeof v !== 'undefined' && v !== null);
    updateValues.push(clientId);

    await window.electronAPI.dbRun(`UPDATE clients SET ${updateFields} WHERE id = ?`, updateValues);
    return { ...clientData, id: clientId };
  }

  async deleteClient(clientId) {
    await window.electronAPI.dbRun('DELETE FROM clients WHERE id = ?', [clientId]);
      return true;
  }

  async getCompanySettings() {
    return window.electronAPI.dbGet('SELECT * FROM company_settings LIMIT 1');
  }

  async updateCompanySettings(settings) {
    const updateFields = Object.keys(settings).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
    const updateValues = Object.values(settings).filter(v => typeof v !== 'undefined' && v !== null);
    updateValues.push(1); // Assuming ID is 1

    await window.electronAPI.dbRun(`UPDATE company_settings SET ${updateFields} WHERE id = ?`, updateValues);
    return settings;
  }

  async getUsers() {
    return window.electronAPI.dbQuery('SELECT id, username, email, fullName, role, active, createdAt FROM users');
  }
  
  async getUserById(id) {
    const user = await window.electronAPI.dbGet('SELECT id, username, email, fullName, role, active, createdAt FROM users WHERE id = ?', [id]);
    if (user) {
      const permissions = await window.electronAPI.dbGet('SELECT * FROM user_permissions WHERE userId = ?', [id]);
      return { ...user, permissions };
    }
    return null;
  }
  
  async getUserByUsername(username) {
    // This method needs to return the password hash for authentication
    return window.electronAPI.dbGet('SELECT * FROM users WHERE username = ?', [username]);
  }
  
  async createUser(userData) {
     const id = userData.id || `user-${Date.now()}`;
     // Note: Password hashing should be done before calling this.
    await window.electronAPI.dbRun(
      'INSERT INTO users (id, username, email, fullName, passwordHash, role, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userData.username, userData.email, userData.fullName, userData.passwordHash, userData.role, userData.active]
    );
    return { ...userData, id };
  }
  
  async updateUser(userId, userData) {
    const { permissions, ...userFields } = userData;
    const updateFields = Object.keys(userFields).filter(k => k !== 'id' && k !== 'passwordHash').map(k => `${k} = ?`).join(', ');
    const updateValues = Object.values(userFields).filter(v => typeof v !== 'undefined' && v !== null);
    updateValues.push(userId);
    
    if (updateFields) {
      await window.electronAPI.dbRun(`UPDATE users SET ${updateFields} WHERE id = ?`, updateValues);
    }

    if (permissions) {
      const permFields = Object.keys(permissions).filter(k => k !== 'userId').map(k => `${k} = ?`).join(', ');
      const permValues = Object.values(permissions);
      permValues.push(userId);
      if (permFields) {
        await window.electronAPI.dbRun(`UPDATE user_permissions SET ${permFields} WHERE userId = ?`, permValues);
      }
    }
    return { ...userData, id: userId };
  }
  
  async updateUserPassword(userId, passwordHash) {
      await window.electronAPI.dbRun('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, userId]);
        return true;
  }
  
  async deleteUser(userId) {
    await window.electronAPI.dbRun('DELETE FROM users WHERE id = ?', [userId]);
    await window.electronAPI.dbRun('DELETE FROM user_permissions WHERE userId = ?', [userId]);
      return true;
  }

  async getSystemStats() {
    try {
      console.log('Fetching system stats from SQLite...');
      const [totalClients, totalProducts, totalSales, totalPurchases] = await Promise.all([
        window.electronAPI.dbGet('SELECT COUNT(*) as count FROM clients'),
        window.electronAPI.dbGet('SELECT COUNT(*) as count FROM products'),
        window.electronAPI.dbGet('SELECT SUM(total) as sum FROM sales'),
        window.electronAPI.dbGet('SELECT SUM(total) as sum FROM purchases')
      ]);
      return {
        totalClients: totalClients.count,
        totalProducts: totalProducts.count,
        totalSales: totalSales.sum || 0,
        totalPurchases: totalPurchases.sum || 0,
      };
    } catch (error) {
      console.error('Error fetching system stats from SQLite:', error);
      throw error;
    }
  }

  // ===================================================================
  // VENTES (SALES)
  // ===================================================================

  async getSales() {
    try {
      console.log('Loading sales from SQLite...');
      const sales = await window.electronAPI.dbQuery('SELECT * FROM sales ORDER BY date DESC');
      return sales.map(sale => {
        let items = [];
        try {
          if (typeof sale.items === 'string' && sale.items.trim().startsWith('[')) {
            items = JSON.parse(sale.items);
          }
        } catch(e) {
          console.error(`Failed to parse items for sale ${sale.id}:`, sale.items, e);
        }
        return {
          ...sale,
          date: new Date(sale.date),
          items: items,
        }
      });
    } catch (error) {
      console.error('Error loading sales from SQLite:', error);
      return [];
    }
  }

  async getSaleById(id) {
    console.log('Loading sale by ID from SQLite:', id);
    const sale = await window.electronAPI.dbGet('SELECT * FROM sales WHERE id = ?', [id]);
    if (!sale) return null;

    const items = await window.electronAPI.dbQuery('SELECT * FROM sale_items WHERE saleId = ?', [id]);
    return {
      ...sale,
      date: new Date(sale.date),
      items: items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: parseFloat(item.total) || 0,
      }))
    };
  }

  async createSale(saleData) {
    if (!saleData.items || saleData.items.length === 0) {
      throw new Error("Une vente doit contenir au moins un article.");
    }
  
    // Start transaction
    await window.electronAPI.dbRun('BEGIN TRANSACTION');
  
    try {
      // 1. Get counter from settings (as a fallback)
      const settings = await window.electronAPI.dbGet('SELECT invoiceCounter FROM company_settings WHERE id = 1');
      const settingsCounter = settings?.invoiceCounter || 1;

      // 2. Get the latest invoice number directly from sales to ensure accuracy
      const lastSale = await window.electronAPI.dbGet("SELECT invoiceNumber FROM sales WHERE invoiceNumber LIKE 'FACT-%' ORDER BY invoiceNumber DESC LIMIT 1");
      
      let salesCounter = 0;
      if (lastSale && lastSale.invoiceNumber) {
        try {
          const lastNumberStr = lastSale.invoiceNumber.split('-').pop();
          if (lastNumberStr) {
            const lastNumber = parseInt(lastNumberStr, 10);
            if (!isNaN(lastNumber)) {
              salesCounter = lastNumber;
            }
          }
        } catch(e) {
          console.error("Could not parse last invoice number, falling back to settings counter.", e);
        }
      }

      // 3. Determine the correct next counter value
      const nextCounter = Math.max(settingsCounter, salesCounter) + 1;

      // 4. Generate the new, guaranteed-unique invoice number
      const year = new Date().getFullYear();
      const invoiceNumber = `FACT-${year.toString().slice(2)}-${nextCounter.toString().padStart(6, '0')}`;

      // 5. Check stock for all items
      for (const item of saleData.items) {
        const product = await window.electronAPI.dbGet('SELECT * FROM products WHERE id = ?', [item.productId]);
        if (!product) {
          throw new Error(`Produit non trouvé: ${item.productName}`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Stock insuffisant pour ${product.name}. Demandé: ${item.quantity}, Disponible: ${product.quantity}`);
        }
      }
  
      // 6. Create the sale
      const saleId = saleData.id || `sale-${Date.now()}`;
      const newSale = { 
        ...saleData, 
        id: saleId,
        invoiceNumber: invoiceNumber, // Use the generated invoice number
        date: new Date(saleData.date).toISOString()
      };
  
      await window.electronAPI.dbRun(
        `INSERT INTO sales (id, invoiceNumber, clientId, clientName, totalHT, totalTVA, totalTTC, paymentMethod, paymentStatus, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newSale.id, newSale.invoiceNumber, newSale.clientId, newSale.clientName,
          newSale.totalHT, newSale.totalTVA, newSale.totalTTC, newSale.paymentMethod,
          newSale.paymentStatus, newSale.date
        ]
      );
  
      // 7. Create sale items and update stock
      for (const item of saleData.items) {
        const saleItemId = item.id || `sitem-${Date.now()}-${Math.random()}`;
        await window.electronAPI.dbRun(
          `INSERT INTO sale_items (id, saleId, productId, productName, quantity, unitPrice, vatRate, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [saleItemId, newSale.id, item.productId, item.productName, item.quantity, item.unitPrice, item.vatRate, item.total]
        );
        
        // Update product quantity
        await window.electronAPI.dbRun(
          'UPDATE products SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.productId]
        );
      }
  
      // 8. Update the invoice counter with the new correct value
      await window.electronAPI.dbRun(
        'UPDATE company_settings SET invoiceCounter = ? WHERE id = 1',
        [nextCounter]
      );

      // Commit transaction
      await window.electronAPI.dbRun('COMMIT');
  
      console.log('Sale created and stock updated successfully with ID:', newSale.id);
      
      // Notifier l'application qu'un changement a eu lieu
      window.dispatchEvent(new CustomEvent('sales-changed'));

      return newSale;
  
    } catch (error) {
      // Rollback transaction on error
      await window.electronAPI.dbRun('ROLLBACK');
      console.error('Error creating sale in SQLite, transaction rolled back:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  async updateSale(saleId, saleData) {
    try {
      console.log('Updating sale in SQLite:', saleId, saleData);
      const updateFields = Object.keys(saleData).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(saleData).map(value => 
        (value instanceof Date) ? value.toISOString() :
        (typeof value === 'object' && value !== null) ? JSON.stringify(value) :
        value
      );
      updateValues.push(saleId);
      
      const sql = `UPDATE sales SET ${updateFields} WHERE id = ?`;
      await window.electronAPI.dbRun(sql, updateValues);
      
      const updatedSale = await this.getSaleById(saleId);
      return updatedSale;
    } catch (error) {
      console.error(`Error updating sale ${saleId} in SQLite:`, error);
      throw error;
    }
  }

  async deleteSale(saleId) {
    try {
      await window.electronAPI.dbRun('DELETE FROM sales WHERE id = ?', [saleId]);
      return true;
    } catch (error) {
      console.error(`Error deleting sale ${saleId} from SQLite:`, error);
      throw error;
    }
  }

}

const dbService = new DatabaseService();

export { dbService };
