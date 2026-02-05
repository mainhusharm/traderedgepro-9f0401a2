// Journal Service
// Handles trading journal entries with local storage fallback

import { supabase } from '@/integrations/supabase/client';

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize?: number;
  pnl?: number;
  outcome?: 'win' | 'loss' | 'breakeven';
  notes?: string;
  tags?: string[];
  emotions?: string[];
  screenshots?: string[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'journal_entries';

class JournalService {
  private entries: JournalEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.entries = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.error('Error saving journal entries:', error);
    }
  }

  async getEntries(userId: string): Promise<JournalEntry[]> {
    return this.entries.filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getEntry(id: string, userId: string): Promise<JournalEntry | null> {
    return this.entries.find(e => e.id === id && e.userId === userId) || null;
  }

  async addEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const now = new Date().toISOString();
    const newEntry: JournalEntry = {
      ...entry,
      id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.entries.unshift(newEntry);
    this.saveToStorage();

    return newEntry;
  }

  async updateEntry(id: string, userId: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    const index = this.entries.findIndex(e => e.id === id && e.userId === userId);
    
    if (index === -1) return null;

    this.entries[index] = {
      ...this.entries[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage();
    return this.entries[index];
  }

  async deleteEntry(id: string, userId: string): Promise<boolean> {
    const initialLength = this.entries.length;
    this.entries = this.entries.filter(e => !(e.id === id && e.userId === userId));
    
    if (this.entries.length < initialLength) {
      this.saveToStorage();
      return true;
    }
    
    return false;
  }

  async getEntriesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<JournalEntry[]> {
    return this.entries.filter(e => {
      if (e.userId !== userId) return false;
      const entryDate = new Date(e.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  async getEntriesBySymbol(userId: string, symbol: string): Promise<JournalEntry[]> {
    return this.entries.filter(
      e => e.userId === userId && e.symbol.toUpperCase() === symbol.toUpperCase()
    );
  }

  async getEntriesByTags(userId: string, tags: string[]): Promise<JournalEntry[]> {
    return this.entries.filter(e => {
      if (e.userId !== userId) return false;
      return e.tags?.some(tag => tags.includes(tag));
    });
  }

  getStats(userId: string): {
    totalEntries: number;
    wins: number;
    losses: number;
    totalPnl: number;
    topSymbols: { symbol: string; count: number }[];
  } {
    const userEntries = this.entries.filter(e => e.userId === userId);
    
    const wins = userEntries.filter(e => e.outcome === 'win').length;
    const losses = userEntries.filter(e => e.outcome === 'loss').length;
    const totalPnl = userEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);

    // Count by symbol
    const symbolCounts: Record<string, number> = {};
    userEntries.forEach(e => {
      symbolCounts[e.symbol] = (symbolCounts[e.symbol] || 0) + 1;
    });

    const topSymbols = Object.entries(symbolCounts)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEntries: userEntries.length,
      wins,
      losses,
      totalPnl,
      topSymbols,
    };
  }

  exportToCSV(userId: string): string {
    const userEntries = this.entries.filter(e => e.userId === userId);
    
    const headers = [
      'Date', 'Symbol', 'Direction', 'Entry Price', 'Exit Price',
      'Stop Loss', 'Take Profit', 'Lot Size', 'P&L', 'Outcome', 'Notes'
    ];

    const rows = userEntries.map(e => [
      e.date,
      e.symbol,
      e.direction,
      e.entryPrice,
      e.exitPrice || '',
      e.stopLoss || '',
      e.takeProfit || '',
      e.lotSize || '',
      e.pnl || '',
      e.outcome || '',
      (e.notes || '').replace(/,/g, ';'),
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}

export const journalService = new JournalService();
