export interface NewsItem {
    title: string;
    source: string;
    url: string;
    publishedAt: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    symbols?: string[];
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class NewsFeedService {
    private cache: NewsItem[] | null = null;
    private lastFetchTime = 0;
    private isFetching = false;

    async fetchLatestNews(limit: number = 10): Promise<NewsItem[]> {
        const now = Date.now();

        // Return cached data if still fresh
        if (this.cache && now - this.lastFetchTime < CACHE_DURATION) {
            return this.cache.slice(0, limit);
        }

        // Prevent duplicate fetches
        if (this.isFetching) {
            return this.cache?.slice(0, limit) || [];
        }

        this.isFetching = true;

        try {
            // Fetch from Backend (Proxy for Google News + Sentiment)
            // Using SPY as a proxy for general market news
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${BASE_URL}/news/SPY`);

            if (!response.ok) {
                // Fallback to mock data if API fails
                return this.getMockNews().slice(0, limit);
            }

            const data = await response.json();

            if (data.news && Array.isArray(data.news)) {
                this.cache = data.news.map((article: any) => ({
                    title: article.headline,
                    source: article.source,
                    url: article.url,
                    publishedAt: new Date(article.datetime * 1000).toISOString(),
                    // Map Backend "Bullish" -> Frontend "positive"
                    sentiment: this.mapSentiment(article.sentiment),
                    sentiment_score: article.sentiment_score,
                    symbols: ['SPY'], // Default since we fetched SPY
                }));
                this.lastFetchTime = now;
                return this.cache?.slice(0, limit) || [];
            }

            return this.getMockNews().slice(0, limit);
        } catch (error) {
            console.error('Error fetching news:', error);
            return this.getMockNews().slice(0, limit);
        } finally {
            this.isFetching = false;
        }
    }

    private mapSentiment(backendLabel: string): 'positive' | 'negative' | 'neutral' {
        switch (backendLabel) {
            case 'Bullish': return 'positive';
            case 'Bearish': return 'negative';
            default: return 'neutral';
        }
    }

    // Removed local analyzeSentiment as backend handles it now
    // Removed extractSymbols as backend context is specific

    private getMockNews(): NewsItem[] {
        const now = new Date();

        return [
            {
                title: 'Tech Stocks Surge as AI Optimism Grows',
                source: 'Financial Times',
                url: '#',
                publishedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
                sentiment: 'positive',
                symbols: ['NVDA', 'MSFT', 'GOOGL'],
            },
            {
                title: 'Federal Reserve Holds Interest Rates Steady',
                source: 'Reuters',
                url: '#',
                publishedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
                sentiment: 'neutral',
                symbols: [],
            },
            {
                title: 'Markets Await Inflation Data',
                source: 'Bloomberg',
                url: '#',
                publishedAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
                sentiment: 'neutral',
                symbols: ['SPY'],
            },
            {
                title: 'Oil Prices Drop on Demand Concerns',
                source: 'Wall Street Journal',
                url: '#',
                publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
                sentiment: 'negative',
                symbols: [],
            },
        ];
    }

    getFormattedTime(timestamp: string): string {
        const now = Date.now();
        const time = new Date(timestamp).getTime();
        const diff = now - time;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;

        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }
}

export const newsFeedService = new NewsFeedService();
