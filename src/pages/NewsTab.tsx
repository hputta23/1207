import { useState, useEffect } from 'react';
import { newsService } from '../services/news-service';
import type { NewsItem } from '../services/news-service';
import { NewsSection } from '../components/News/NewsSection';

export function NewsTab() {
    const [searchTicker, setSearchTicker] = useState('');
    const [searchResults, setSearchResults] = useState<NewsItem[]>([]);
    const [dashboardNews, setDashboardNews] = useState<Map<string, NewsItem[]>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSearchMode, setIsSearchMode] = useState(false);

    const defaultTickers = ['AAPL', 'TSLA', 'NVDA'];

    // Load dashboard news on mount
    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        setIsSearchMode(false);

        try {
            const results = await newsService.fetchMultipleNews(defaultTickers);
            setDashboardNews(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load news');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        const ticker = searchTicker.trim().toUpperCase();
        if (!ticker) {
            loadDashboard();
            return;
        }

        setLoading(true);
        setError(null);
        setIsSearchMode(true);

        try {
            const news = await newsService.fetchNews(ticker);
            setSearchResults(news);

            // Refresh dashboard
            const results = await newsService.fetchMultipleNews(defaultTickers);
            setDashboardNews(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to fetch news for ${ticker}`);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                overflow: 'auto',
                padding: '40px',
            }}
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1
                        style={{
                            margin: '0 0 8px 0',
                            fontSize: '32px',
                            fontWeight: 700,
                            color: '#fff',
                        }}
                    >
                        Market News
                    </h1>
                    <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                        Latest financial news and updates
                    </p>
                </div>

                {/* Search Bar */}
                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '32px',
                        alignItems: 'center',
                    }}
                >
                    <input
                        type="text"
                        value={searchTicker}
                        onChange={(e) => setSearchTicker(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search ticker (e.g., AAPL, TSLA)..."
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        Search
                    </button>
                    <button
                        onClick={loadDashboard}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#888',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.color = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#333';
                            e.currentTarget.style.color = '#888';
                        }}
                    >
                        Reset
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid #333',
                                borderTop: '3px solid #3b82f6',
                                borderRadius: '50%',
                                margin: '0 auto 16px',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <p style={{ margin: 0, fontSize: '14px' }}>Loading news...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div
                        style={{
                            padding: '20px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '14px',
                            marginBottom: '20px',
                        }}
                    >
                        ⚠️ {error}
                    </div>
                )}

                {/* Search Results */}
                {isSearchMode && !loading && searchResults.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
                            Search Results
                        </h2>
                        <NewsSection ticker={searchTicker.toUpperCase()} news={searchResults} isSingleView />
                    </div>
                )}

                {/* Dashboard News */}
                {!loading && (
                    <div>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
                            Market Overview
                        </h2>
                        {Array.from(dashboardNews.entries()).map(([ticker, news]) => (
                            <NewsSection key={ticker} ticker={ticker} news={news} />
                        ))}
                    </div>
                )}
            </div>

            {/* CSS Animation */}
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
