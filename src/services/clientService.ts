
import { Client } from "@/types";

class ClientService {
  private storageKey = 'clients';
  private lastId = 'lastClientId';

  // Charger tous les clients
  getAllClients(): Client[] {
    try {
      const clients = localStorage.getItem(this.storageKey);
      return clients ? JSON.parse(clients) : [];
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  }

  // Sauvegarder tous les clients
  saveClients(clients: Client[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving clients:', error);
      throw new Error('Impossible de sauvegarder les clients');
    }
  }

  // Obtenir un client par ID
  getClientById(id: string): Client | null {
    const clients = this.getAllClients();
    return clients.find(client => client.id === id) || null;
  }

  // Générer un nouvel ID
  private generateNewId(): string {
    try {
      const lastId = localStorage.getItem(this.lastId);
      const newId = lastId ? (parseInt(lastId) + 1).toString() : '1';
      localStorage.setItem(this.lastId, newId);
      return newId;
    } catch (error) {
      return Date.now().toString();
    }
  }

  // Ajouter un nouveau client
  addClient(clientData: Omit<Client, 'id' | 'createdAt'>): Client {
    const clients = this.getAllClients();
    
    // Vérifier si le client existe déjà (par nom ou email)
    const existingClient = clients.find(
      c => c.name.toLowerCase() === clientData.name.toLowerCase() || 
           (c.email && clientData.email && c.email.toLowerCase() === clientData.email.toLowerCase())
    );
    
    if (existingClient) {
      throw new Error('Un client avec ce nom ou cet email existe déjà');
    }

    const newClient: Client = {
      ...clientData,
      id: this.generateNewId(),
      createdAt: new Date()
    };

    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  }

  // Mettre à jour un client
  updateClient(id: string, clientData: Partial<Omit<Client, 'id' | 'createdAt'>>): Client {
    const clients = this.getAllClients();
    const clientIndex = clients.findIndex(c => c.id === id);
    
    if (clientIndex === -1) {
      throw new Error('Client non trouvé');
    }

    // Vérifier les doublons (sauf pour le client actuel)
    if (clientData.name || clientData.email) {
      const existingClient = clients.find(
        c => c.id !== id && (
          (clientData.name && c.name.toLowerCase() === clientData.name.toLowerCase()) ||
          (clientData.email && c.email && clientData.email && c.email.toLowerCase() === clientData.email.toLowerCase())
        )
      );
      
      if (existingClient) {
        throw new Error('Un autre client avec ce nom ou cet email existe déjà');
      }
    }

    const updatedClient = {
      ...clients[clientIndex],
      ...clientData
    };

    clients[clientIndex] = updatedClient;
    this.saveClients(clients);
    return updatedClient;
  }

  // Supprimer un client
  deleteClient(id: string): void {
    const clients = this.getAllClients();
    const filteredClients = clients.filter(c => c.id !== id);
    
    if (filteredClients.length === clients.length) {
      throw new Error('Client non trouvé');
    }
    
    this.saveClients(filteredClients);
  }

  // Rechercher des clients
  searchClients(query: string): Client[] {
    const clients = this.getAllClients();
    const lowerQuery = query.toLowerCase();
    
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowerQuery) ||
      (client.fiscalId && client.fiscalId.toLowerCase().includes(lowerQuery)) ||
      (client.email && client.email.toLowerCase().includes(lowerQuery)) ||
      (client.phone && client.phone.includes(query))
    );
  }

  // Exporter les données
  exportToJSON(): string {
    const clients = this.getAllClients();
    return JSON.stringify(clients, null, 2);
  }

  // Importer les données
  importFromJSON(jsonData: string): void {
    try {
      const importedClients = JSON.parse(jsonData);
      if (!Array.isArray(importedClients)) {
        throw new Error('Format de données invalide');
      }
      
      // Valider les données
      const validClients = importedClients.filter(client => 
        client.name && typeof client.name === 'string'
      );
      
      this.saveClients(validClients);
    } catch (error) {
      throw new Error('Impossible d\'importer les données: format invalide');
    }
  }

  // Sauvegarder en CSV
  exportToCSV(): string {
    const clients = this.getAllClients();
    const headers = ['ID', 'Nom', 'Matricule Fiscal', 'Téléphone', 'Email', 'Adresse', 'Date de création'];
    
    const csvContent = [
      headers.join(','),
      ...clients.map(client => [
        client.id,
        `"${client.name}"`,
        `"${client.fiscalId || ''}"`,
        `"${client.phone || ''}"`,
        `"${client.email || ''}"`,
        `"${client.address || ''}"`,
        `"${client.createdAt ? new Date(client.createdAt).toLocaleDateString() : ''}"`
      ].join(','))
    ].join('\n');
    
    return csvContent;
  }
}

export const clientService = new ClientService();
