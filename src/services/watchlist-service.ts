import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistItem {
    symbol: string;
    name: string;
    addedAt: number;
}

interface WatchlistState {
    watchlist: WatchlistItem[];
    addToWatchlist: (symbol: string, name?: string) => void;
    removeFromWatchlist: (symbol: string) => void;
    isInWatchlist: (symbol: string) => boolean;
    clearWatchlist: () => void;
}

export const useWatchlistStore = create<WatchlistState>()(
    persist(
        (set, get) => ({
            watchlist: [
                { symbol: 'AAPL', name: 'Apple Inc.', addedAt: Date.now() },
                { symbol: 'MSFT', name: 'Microsoft Corp.', addedAt: Date.now() },
                { symbol: 'GOOGL', name: 'Alphabet Inc.', addedAt: Date.now() },
                { symbol: 'AMZN', name: 'Amazon.com Inc.', addedAt: Date.now() },
            ],

            addToWatchlist: (symbol: string, name?: string) => {
                const { watchlist, isInWatchlist } = get();

                if (!isInWatchlist(symbol)) {
                    set({
                        watchlist: [
                            ...watchlist,
                            {
                                symbol: symbol.toUpperCase(),
                                name: name || symbol.toUpperCase(),
                                addedAt: Date.now(),
                            },
                        ],
                    });
                }
            },

            removeFromWatchlist: (symbol: string) => {
                const { watchlist } = get();
                set({
                    watchlist: watchlist.filter(
                        (item) => item.symbol !== symbol.toUpperCase()
                    ),
                });
            },

            isInWatchlist: (symbol: string) => {
                const { watchlist } = get();
                return watchlist.some(
                    (item) => item.symbol === symbol.toUpperCase()
                );
            },

            clearWatchlist: () => {
                set({ watchlist: [] });
            },
        }),
        {
            name: 'terminal-pro-watchlist',
        }
    )
);

// Legacy class-based service for backwards compatibility
class WatchlistService {
    addTicker(ticker: string): boolean {
        const store = useWatchlistStore.getState();
        if (store.isInWatchlist(ticker)) {
            return false;
        }
        store.addToWatchlist(ticker);
        return true;
    }

    removeTicker(ticker: string): void {
        useWatchlistStore.getState().removeFromWatchlist(ticker);
    }

    getTickers(): string[] {
        return useWatchlistStore.getState().watchlist.map(item => item.symbol);
    }

    hasTicker(ticker: string): boolean {
        return useWatchlistStore.getState().isInWatchlist(ticker);
    }

    getCount(): number {
        return useWatchlistStore.getState().watchlist.length;
    }

    clearAll(): void {
        useWatchlistStore.getState().clearWatchlist();
    }
}

export const watchlistService = new WatchlistService();
