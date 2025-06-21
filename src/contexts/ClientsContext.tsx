import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client } from '@/types';
import { dbService } from '@/data/dbService';

type ClientsContextType = {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (clientId: string, clientData: Partial<Client>) => Promise<Client>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined;
  isLoading: boolean;
};

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        const loadedClients = await dbService.getClients();
        setClients(loadedClients);
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadClients();
  }, []);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newClient = await dbService.createClient(client);
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (error) {
      console.error('Failed to add client:', error);
      throw error;
    }
  };

  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    try {
      const updatedClient = await dbService.updateClient(clientId, clientData);
      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
      return updatedClient;
    } catch (error) {
      console.error('Failed to update client:', error);
      throw error;
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      await dbService.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (error) {
      console.error('Failed to delete client:', error);
      throw error;
    }
  };
  
  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient, deleteClient, getClientById, isLoading }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
}; 