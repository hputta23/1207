// Market indices to track
// Market indices to track
import { apiClient } from './api-client';
import { BASE_URL } from './api-client';
export const MARKET_INDICES = {
    '^GSPC': { name: 'S&P 500', symbol: '^GSPC' },
    '^IXIC': { name: 'NASDAQ', symbol: '^IXIC' },
    '^DJI': { name: 'Dow Jones', symbol: '^DJI' },
    '^RUT': { name: 'Russell 2000', symbol: '^RUT' },
} as const;

export interface IndexData {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    volume: number;
    lastUpdate: number;
}

export interface MarketStatus {
    isOpen: boolean;
    nextOpen?: Date;
    nextClose?: Date;
    statusText: string;
}

class MarketOverviewService {
    private cache = new Map<string, IndexData>();
    private cacheTimeout = 5000; // 5 seconds

    async fetchIndexData(symbol: string): Promise<IndexData | null> {
        const cached = this.cache.get(symbol);
        if (cached && Date.now() - cached.lastUpdate < this.cacheTimeout) {
            return cached;
        }

        try {
            const data = await apiClient.getQuote(symbol);

            if (!data) {
                console.warn(`No data for ${symbol}`);
                return null;
            }

            const indexData: IndexData = {
                symbol,
                name: MARKET_INDICES[symbol as keyof typeof MARKET_INDICES]?.name || symbol,
                price: data.price,
                change: data.change,
                changePercent: data.changePercent,
                previousClose: data.price - data.change,
                volume: data.volume,
                lastUpdate: Date.now(),
            };

            this.cache.set(symbol, indexData);
            return indexData;
        } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            return null;
        }
    }


    // Mock data removed

    async fetchAllIndices(): Promise<IndexData[]> {
        const symbols = Object.keys(MARKET_INDICES);
        const promises = symbols.map(symbol => this.fetchIndexData(symbol));
        const results = await Promise.all(promises);
        return results.filter((data): data is IndexData => data !== null);
    }

    getMarketStatus(): MarketStatus {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentMinutes = hours * 60 + minutes;

        // Market hours: 9:30 AM - 4:00 PM ET (Monday-Friday)
        const marketOpen = 9 * 60 + 30; // 9:30 AM
        const marketClose = 16 * 60; // 4:00 PM

        // Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            const nextMonday = new Date(now);
            nextMonday.setDate(now.getDate() + (dayOfWeek === 0 ? 1 : 2));
            nextMonday.setHours(9, 30, 0, 0);

            return {
                isOpen: false,
                nextOpen: nextMonday,
                statusText: 'Market Closed - Weekend',
            };
        }

        // Weekday - check if market is open
        if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
            const closeTime = new Date(now);
            closeTime.setHours(16, 0, 0, 0);

            const minutesUntilClose = marketClose - currentMinutes;
            const hoursUntilClose = Math.floor(minutesUntilClose / 60);
            const minsUntilClose = minutesUntilClose % 60;

            return {
                isOpen: true,
                nextClose: closeTime,
                statusText: `Market Open - Closes in ${hoursUntilClose}h ${minsUntilClose}m`,
            };
        }

        // Before market open
        if (currentMinutes < marketOpen) {
            const openTime = new Date(now);
            openTime.setHours(9, 30, 0, 0);

            const minutesUntilOpen = marketOpen - currentMinutes;
            const hoursUntilOpen = Math.floor(minutesUntilOpen / 60);
            const minsUntilOpen = minutesUntilOpen % 60;

            return {
                isOpen: false,
                nextOpen: openTime,
                statusText: `Pre-Market - Opens in ${hoursUntilOpen}h ${minsUntilOpen}m`,
            };
        }

        // After market close
        const nextOpen = new Date(now);
        if (dayOfWeek === 5) { // Friday
            nextOpen.setDate(now.getDate() + 3); // Next Monday
        } else {
            nextOpen.setDate(now.getDate() + 1); // Next day
        }
        nextOpen.setHours(9, 30, 0, 0);

        return {
            isOpen: false,
            nextOpen,
            statusText: 'After Hours - Market Closed',
        };
    }
}

export const marketOverviewService = new MarketOverviewService();
