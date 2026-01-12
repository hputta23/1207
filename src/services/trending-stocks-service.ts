// Popular liquid stocks to track for trending analysis (reduced for performance)
const TRACKED_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META',
    'JPM', 'V', 'WMT', 'MA', 'HD', 'DIS', 'NFLX',
    'AMD', 'PYPL', 'INTC', 'CSCO', 'ADBE', 'CRM',
];

export interface TrendingStock {
    symbol: string;
    name?: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    previousClose: number;
}

class TrendingStocksService {
    private cache: {
        gainers: TrendingStock[];
        losers: TrendingStock[];
        lastUpdate: number;
    } | null = null;

    private cacheTimeout = 60000; // 1 minute

    async fetchTrendingStocks(): Promise<{ gainers: TrendingStock[]; losers: TrendingStock[] }> {
        // Return cache if valid
        if (this.cache && Date.now() - this.cache.lastUpdate < this.cacheTimeout) {
            return {
                gainers: this.cache.gainers,
                losers: this.cache.losers,
            };
        }

        try {
            // Fetch data for all tracked stocks
            const fetchPromises = TRACKED_STOCKS.map(async (symbol) => {
                try {
                    // Use Yahoo Finance public API endpoint
                    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                    const response = await fetch(url);

                    if (!response.ok) return null;

                    const data = await response.json();
                    const result = data?.chart?.result?.[0];

                    if (!result) return null;

                    const meta = result.meta;
                    const currentPrice = meta.regularMarketPrice || meta.previousClose;
                    const previousClose = meta.chartPreviousClose || meta.previousClose;
                    const change = currentPrice - previousClose;
                    const changePercent = (change / previousClose) * 100;

                    return {
                        symbol,
                        name: meta.longName || meta.shortName || symbol,
                        price: currentPrice,
                        change,
                        changePercent,
                        volume: meta.regularMarketVolume || 0,
                        previousClose,
                    };
                } catch (error) {
                    console.error(`Error fetching ${symbol}:`, error);
                    return null;
                }
            });

            const results = await Promise.all(fetchPromises);
            const validStocks = results.filter((stock) => stock !== null) as TrendingStock[];

            // Sort by change percent
            const sortedByChange = [...validStocks].sort((a, b) => b.changePercent - a.changePercent);

            // Get top 5 gainers and losers
            const gainers = sortedByChange.slice(0, 5);
            const losers = sortedByChange.slice(-5).reverse();

            // Update cache
            this.cache = {
                gainers,
                losers,
                lastUpdate: Date.now(),
            };

            return { gainers, losers };
        } catch (error) {
            console.error('Error fetching trending stocks:', error);

            // Return empty arrays on error
            return {
                gainers: [],
                losers: [],
            };
        }
    }
}

export const trendingStocksService = new TrendingStocksService();
