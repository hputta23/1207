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
            // Fetch from NewsAPI (using general business/finance news)
            const response = await fetch(
                'https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=20',
                {
                    headers: {
                        // Using a demo API key - in production, this should be from env
                        'X-Api-Key': 'demo',
                    },
                }
            );

            if (!response.ok) {
                // Fallback to mock data if API fails
                return this.getMockNews().slice(0, limit);
            }

            const data = await response.json();

            if (data.articles && Array.isArray(data.articles)) {
                this.cache = data.articles.map((article: any) => ({
                    title: article.title,
                    source: article.source?.name || 'Unknown',
                    url: article.url,
                    publishedAt: article.publishedAt,
                    sentiment: this.analyzeSentiment(article.title),
                    symbols: this.extractSymbols(article.title),
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

    private analyzeSentiment(title: string): 'positive' | 'negative' | 'neutral' {
        const lowerTitle = title.toLowerCase();

        const positiveWords = ['surge', 'soar', 'gain', 'jump', 'rally', 'up', 'rise', 'boost', 'profit', 'growth', 'high', 'record'];
        const negativeWords = ['fall', 'drop', 'crash', 'plunge', 'decline', 'loss', 'down', 'sink', 'tumble', 'weak', 'low', 'concern'];

        const positiveCount = positiveWords.filter(word => lowerTitle.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerTitle.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    private extractSymbols(title: string): string[] {
        const symbols: string[] = [];
        const commonStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'];

        commonStocks.forEach(symbol => {
            if (title.toUpperCase().includes(symbol)) {
                symbols.push(symbol);
            }
        });

        return symbols;
    }

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
                title: 'Tesla Announces Record Deliveries for Quarter',
                source: 'Bloomberg',
                url: '#',
                publishedAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
                sentiment: 'positive',
                symbols: ['TSLA'],
            },
            {
                title: 'Oil Prices Drop on Demand Concerns',
                source: 'Wall Street Journal',
                url: '#',
                publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
                sentiment: 'negative',
                symbols: [],
            },
            {
                title: 'Apple Unveils New Product Lineup',
                source: 'CNBC',
                url: '#',
                publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
                sentiment: 'positive',
                symbols: ['AAPL'],
            },
            {
                title: 'Banking Sector Faces Regulatory Scrutiny',
                source: 'Financial Times',
                url: '#',
                publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
                sentiment: 'negative',
                symbols: [],
            },
            {
                title: 'Semiconductor Demand Reaches All-Time High',
                source: 'Reuters',
                url: '#',
                publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
                sentiment: 'positive',
                symbols: ['NVDA', 'AMD', 'INTC'],
            },
            {
                title: 'Consumer Spending Shows Strong Growth',
                source: 'Bloomberg',
                url: '#',
                publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
                sentiment: 'positive',
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
