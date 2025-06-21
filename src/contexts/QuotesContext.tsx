import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quote } from '@/types';
import { dbService } from '@/data/dbService';

interface QuotesContextType {
  quotes: Quote[];
  addQuote: (quote: Omit<Quote, 'id'>) => Promise<void>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  loading: boolean;
}

const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

export const QuotesProvider = ({ children }: { children: ReactNode }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les devis depuis la base de données
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        console.log('Loading quotes from database...');
        await dbService.initialize();
        const loadedQuotes = await dbService.getQuotes();
        console.log('Loaded quotes:', loadedQuotes);
        setQuotes(loadedQuotes);
      } catch (error) {
        console.error('Error loading quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, []);

  const generateQuoteNumber = () => {
    const currentYear = new Date().getFullYear();
    const existingNumbers = quotes
      .filter(quote => quote.reference?.startsWith(`DEV-${currentYear}`))
      .map(quote => {
        const match = quote.reference?.match(/DEV-\d{4}-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `DEV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  };

  const addQuote = async (quoteData: Omit<Quote, 'id'>) => {
    try {
      console.log('Adding quote:', quoteData);
      const quoteWithReference = {
        ...quoteData,
        reference: generateQuoteNumber()
      };
      const newQuote = await dbService.createQuote(quoteWithReference);
      console.log('Quote added successfully:', newQuote);
      setQuotes(prev => [newQuote, ...prev]);
    } catch (error) {
      console.error('Error adding quote:', error);
      throw error;
    }
  };

  const updateQuote = async (id: string, updates: Partial<Quote>) => {
    try {
      console.log('Updating quote:', id, updates);
      await dbService.updateQuote(id, updates);
      console.log('Quote updated successfully');
      setQuotes(prev => prev.map(quote => 
        quote.id === id ? { ...quote, ...updates } : quote
      ));
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      console.log('Deleting quote:', id);
      await dbService.deleteQuote(id);
      console.log('Quote deleted successfully');
      setQuotes(prev => prev.filter(quote => quote.id !== id));
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  };

  return (
    <QuotesContext.Provider value={{ quotes, addQuote, updateQuote, deleteQuote, loading }}>
      {children}
    </QuotesContext.Provider>
  );
};

export const useQuotes = () => {
  const context = useContext(QuotesContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};
