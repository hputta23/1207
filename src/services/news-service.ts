export interface NewsItem {
    headline: string;
    url: string;
    source: string;
    datetime: number;
    description?: string;
}

class NewsService {
    private cache: Map<string, { items: NewsItem[]; timestamp: number }>;
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.cache = new Map();
    }

    async fetchNews(ticker: string): Promise<NewsItem[]> {
        // Check cache first
        const cached = this.cache.get(ticker);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.items;
        }

        try {
            const encodedTicker = encodeURIComponent(ticker);
            // Use RSS2JSON API as a CORS proxy for Google News RSS
            const rssUrl = `https://news.google.com/rss/search?q=${encodedTicker}+stock&hl=en-US&gl=US&ceid=US:en`;
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.items || !Array.isArray(data.items)) {
                throw new Error('Invalid response format');
            }

            const newsItems: NewsItem[] = data.items.map((entry: any) => {
                // Extract source from title (Google News format: "Title - Source")
                let title = entry.title || '';
                let source = 'Google News';

                if (title.includes(' - ')) {
                    const parts = title.split(' - ');
                    title = parts.slice(0, -1).join(' - ');
                    source = parts[parts.length - 1];
                }

                // Parse date
                let timestamp = Date.now();
                if (entry.pubDate) {
                    const date = new Date(entry.pubDate);
                    if (!isNaN(date.getTime())) {
                        timestamp = date.getTime();
                    }
                }

                return {
                    headline: title,
                    url: entry.link || '',
                    source,
                    datetime: timestamp,
                    description: entry.description || '',
                };
            });

            // Cache the results
            this.cache.set(ticker, { items: newsItems, timestamp: Date.now() });

            return newsItems;
        } catch (error) {
            console.error(`Failed to fetch news for ${ticker}:`, error);
            throw new Error(`Failed to fetch news for ${ticker}`);
        }
    }

    async fetchMultipleNews(tickers: string[]): Promise<Map<string, NewsItem[]>> {
        const results = new Map<string, NewsItem[]>();

        await Promise.allSettled(
            tickers.map(async (ticker) => {
                try {
                    const news = await this.fetchNews(ticker);
                    results.set(ticker, news);
                } catch (error) {
                    console.error(`Failed to fetch news for ${ticker}`, error);
                    results.set(ticker, []);
                }
            })
        );

        return results;
    }

    clearCache() {
        this.cache.clear();
    }
}

export const newsService = new NewsService();
