// Market indices to track
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
            // Encode symbol for URL (caret ^ needs encoding)
            const encodedSymbol = encodeURIComponent(symbol);
            const url = `${BASE_URL}/api/yahoo/v8/finance/chart/${encodedSymbol}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`Failed to fetch ${symbol}: ${response.status}`);
                // Return mock data as fallback
                return this.getMockIndexData(symbol);
            }

            const data = await response.json();
            const result = data?.chart?.result?.[0];

            if (!result) {
                console.warn(`No data for ${symbol}`);
                return this.getMockIndexData(symbol);
            }

            const meta = result.meta;
            const currentPrice = meta.regularMarketPrice || meta.previousClose;
            const previousClose = meta.chartPreviousClose || meta.previousClose;
            const change = currentPrice - previousClose;
            const changePercent = (change / previousClose) * 100;

            const indexData: IndexData = {
                symbol,
                name: MARKET_INDICES[symbol as keyof typeof MARKET_INDICES]?.name || symbol,
                price: currentPrice,
                change,
                changePercent,
                previousClose,
                volume: meta.regularMarketVolume || 0,
                lastUpdate: Date.now(),
            };

            this.cache.set(symbol, indexData);
            return indexData;
        } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            // Return mock data as fallback
            return this.getMockIndexData(symbol);
        }
    }

    // Fallback mock data when API fails
    private getMockIndexData(symbol: string): IndexData {
        const basePrices: Record<string, number> = {
            '^GSPC': 5500.50,
            '^IXIC': 17500.30,
            '^DJI': 42100.20,
            '^RUT': 2150.15,
        };

        const basePrice = basePrices[symbol] || 1000;
        const randomChange = (Math.random() - 0.5) * 1.5; // -0.75% to +0.75%
        const change = basePrice * (randomChange / 100);

        return {
            symbol,
            name: MARKET_INDICES[symbol as keyof typeof MARKET_INDICES]?.name || symbol,
            price: basePrice + change,
            change: change,
            changePercent: randomChange,
            previousClose: basePrice,
            volume: Math.floor(Math.random() * 100000000),
            lastUpdate: Date.now(),
        };
    }

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
