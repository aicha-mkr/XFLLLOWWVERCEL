import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DeliveryNote } from '@/types';
import { dbService } from '@/data/dbService';

interface DeliveryNotesContextType {
  deliveryNotes: DeliveryNote[];
  addDeliveryNote: (note: Omit<DeliveryNote, 'id'>) => Promise<void>;
  updateDeliveryNote: (id: string, updates: Partial<DeliveryNote>) => Promise<void>;
  deleteDeliveryNote: (id: string) => Promise<void>;
  loading: boolean;
}

const DeliveryNotesContext = createContext<DeliveryNotesContextType | undefined>(undefined);

export const DeliveryNotesProvider = ({ children }: { children: ReactNode }) => {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les bons de livraison depuis la base de données
  useEffect(() => {
    const loadDeliveryNotes = async () => {
      try {
        console.log('Loading delivery notes from database...');
        await dbService.initialize();
        const loadedNotes = await dbService.getDeliveryNotes();
        console.log('Loaded delivery notes:', loadedNotes);
        setDeliveryNotes(loadedNotes);
      } catch (error) {
        console.error('Error loading delivery notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeliveryNotes();
  }, []);

  const addDeliveryNote = async (noteData: Omit<DeliveryNote, 'id'>) => {
    try {
      console.log('Adding delivery note:', noteData);
      const newNote = await dbService.createDeliveryNote(noteData);
      console.log('Delivery note added successfully:', newNote);
      setDeliveryNotes(prev => [newNote, ...prev]);
    } catch (error) {
      console.error('Error adding delivery note:', error);
      throw error;
    }
  };

  const updateDeliveryNote = async (id: string, updates: Partial<DeliveryNote>) => {
    try {
      console.log('Updating delivery note:', id, updates);
      await dbService.updateDeliveryNote(id, updates);
      console.log('Delivery note updated successfully');
      setDeliveryNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...updates } : note
      ));
    } catch (error) {
      console.error('Error updating delivery note:', error);
      throw error;
    }
  };

  const deleteDeliveryNote = async (id: string) => {
    try {
      console.log('Deleting delivery note:', id);
      await dbService.deleteDeliveryNote(id);
      console.log('Delivery note deleted successfully');
      setDeliveryNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting delivery note:', error);
      throw error;
    }
  };

  return (
    <DeliveryNotesContext.Provider value={{ 
      deliveryNotes, 
      addDeliveryNote, 
      updateDeliveryNote, 
      deleteDeliveryNote,
      loading
    }}>
      {children}
    </DeliveryNotesContext.Provider>
  );
};

export const useDeliveryNotes = () => {
  const context = useContext(DeliveryNotesContext);
  if (context === undefined) {
    throw new Error('useDeliveryNotes must be used within a DeliveryNotesProvider');
  }
  return context;
};
