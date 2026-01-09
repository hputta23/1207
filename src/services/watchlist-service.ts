export interface WatchlistTicker {
    symbol: string;
    addedAt: number;
}

class WatchlistService {
    private storageKey = 'terminal_pro_watchlist';
    private tickers: Set<string>;

    constructor() {
        this.tickers = new Set(this.loadFromStorage());
    }

    private loadFromStorage(): string[] {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load watchlist from storage:', error);
            return [];
        }
    }

    private saveToStorage(): void {
        try {
            const tickers = Array.from(this.tickers);
            localStorage.setItem(this.storageKey, JSON.stringify(tickers));
        } catch (error) {
            console.error('Failed to save watchlist to storage:', error);
        }
    }

    addTicker(ticker: string): boolean {
        const normalized = ticker.trim().toUpperCase();
        if (!normalized || this.tickers.has(normalized)) {
            return false;
        }
        this.tickers.add(normalized);
        this.saveToStorage();
        return true;
    }

    removeTicker(ticker: string): boolean {
        const normalized = ticker.trim().toUpperCase();
        const removed = this.tickers.delete(normalized);
        if (removed) {
            this.saveToStorage();
        }
        return removed;
    }

    getTickers(): string[] {
        return Array.from(this.tickers).sort();
    }

    hasTicker(ticker: string): boolean {
        return this.tickers.has(ticker.trim().toUpperCase());
    }

    getCount(): number {
        return this.tickers.size;
    }

    clearWatchlist(): void {
        this.tickers.clear();
        this.saveToStorage();
    }
}

export const watchlistService = new WatchlistService();
